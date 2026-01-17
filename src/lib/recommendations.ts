import { db } from "@/db";
import { userMovies, reviews } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { Movie } from "@/types";
import {
  getMovieRecommendations,
  discoverMoviesByGenres,
  discoverMoviesByKeywords,
  getTrendingMovies,
  GENRE_IDS,
  THEME_KEYWORD_IDS,
} from "./tmdb";

// ==========================================
// Types and Constants
// ==========================================

export const MOOD_MAP: Record<string, string[]> = {
  "uplifting": ["Comedy", "Animation", "Family", "Music"],
  "mind-bending": ["Science Fiction", "Mystery", "Thriller"],
  "dark-intense": ["Horror", "Crime", "War"],
  "feel-good": ["Romance", "Comedy", "Music"],
  "adrenaline": ["Action", "Adventure", "Thriller"],
  "thought-provoking": ["Documentary", "Drama", "Science Fiction"],
  "classic": ["Drama", "Mystery"],
};

export type MoodKey = keyof typeof MOOD_MAP;

const MIN_VOTE_COUNT = 50;
const MIN_RATING = 5.5;
const RECENCY_DECAY_DAYS = 180; // Half-life for recency weighting
const MAX_RECOMMENDATIONS_PER_SOURCE = 30;

interface UserPreferences {
  favoriteGenres: Map<string, number>;
  favoriteDirectors: Map<string, number>;
  favoriteActors: Map<string, number>;
  favoriteKeywords: Map<string, number>;
  preferredDecades: Map<string, number>;
  seenCollections: Set<number>;
  averageRuntime: number;
  runtimeRange: { min: number; max: number };
  averageRating: number;
  ratingStyle: "generous" | "moderate" | "critical";
  topLikedMovieIds: string[];
  watchlistMovieIds: string[];
  watchlistCollectionIds: Set<number>;
}

interface ScoredMovie {
  movie: Movie;
  score: number;
  reasons: string[];
  sources: Set<string>;
}

// ==========================================
// Utility Functions
// ==========================================

function parseJsonSafely<T>(data: unknown, fallback: T): T {
  if (data === null || data === undefined) return fallback;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  }
  return data as T;
}

/**
 * Calculate recency weight using exponential decay
 * More recent interactions have higher weight
 */
function calculateRecencyWeight(date: Date | null): number {
  if (!date) return 0.5; // Default weight for items without date
  const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  // Exponential decay with half-life of RECENCY_DECAY_DAYS
  return Math.exp(-0.693 * daysSince / RECENCY_DECAY_DAYS);
}

/**
 * Get current season for seasonal recommendations
 */
function getCurrentSeason(): "spring" | "summer" | "fall" | "winter" {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

/**
 * Check if current date is near a holiday
 */
function getCurrentHoliday(): string | null {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();

  // Christmas season (Dec 1 - Dec 31)
  if (month === 11) return "christmas";
  // Halloween season (Oct 15 - Oct 31)
  if (month === 9 && day >= 15) return "halloween";
  // Valentine's (Feb 1 - Feb 14)
  if (month === 1 && day <= 14) return "valentines";

  return null;
}

function isQualityContent(movie: Movie): boolean {
  if (movie.voteCount !== undefined && movie.voteCount < MIN_VOTE_COUNT) return false;
  if (movie.rating !== undefined && movie.rating < MIN_RATING) return false;
  return true;
}

// ==========================================
// User Preferences Analysis
// ==========================================

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  // Fetch user's movie data with all fields
  const userMoviesData = await db
    .select()
    .from(userMovies)
    .where(eq(userMovies.userId, userId))
    .orderBy(desc(userMovies.watchedDate));

  const userReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.userId, userId));

  const preferences: UserPreferences = {
    favoriteGenres: new Map(),
    favoriteDirectors: new Map(),
    favoriteActors: new Map(),
    favoriteKeywords: new Map(),
    preferredDecades: new Map(),
    seenCollections: new Set(),
    averageRuntime: 120,
    runtimeRange: { min: 80, max: 180 },
    averageRating: 3,
    ratingStyle: "moderate",
    topLikedMovieIds: [],
    watchlistMovieIds: [],
    watchlistCollectionIds: new Set(),
  };

  let totalRuntime = 0;
  let runtimeCount = 0;
  const runtimes: number[] = [];
  let totalRating = 0;
  let ratedCount = 0;

  // Process each movie with recency weighting
  for (const movie of userMoviesData) {
    const recencyWeight = calculateRecencyWeight(movie.watchedDate);
    const isLiked = movie.liked;
    const isWatched = movie.watched;
    const isWatchlist = movie.watchlist;

    // Track collections
    if (movie.collectionId) {
      if (isWatched) {
        preferences.seenCollections.add(movie.collectionId);
      }
      if (isWatchlist) {
        preferences.watchlistCollectionIds.add(movie.collectionId);
      }
    }

    // Track watchlist
    if (isWatchlist && !isWatched) {
      preferences.watchlistMovieIds.push(movie.movieId);
    }

    // Track top liked movies (for similar movie recommendations)
    if (isLiked) {
      preferences.topLikedMovieIds.push(movie.movieId);
    }

    // Process genres with recency weighting
    const genres = parseJsonSafely<string[]>(movie.genres, []);
    for (const genre of genres) {
      const currentScore = preferences.favoriteGenres.get(genre) || 0;
      const weight = isLiked ? 3 * recencyWeight : isWatched ? 1 * recencyWeight : 0;
      preferences.favoriteGenres.set(genre, currentScore + weight);
    }

    // Process directors with recency weighting
    const crew = parseJsonSafely<Array<{ name: string; job: string }>>(movie.crew, []);
    for (const member of crew) {
      if (member.job === "Director" && isLiked) {
        const currentScore = preferences.favoriteDirectors.get(member.name) || 0;
        preferences.favoriteDirectors.set(member.name, currentScore + 3 * recencyWeight);
      }
    }

    // Process actors with recency weighting
    const cast = parseJsonSafely<Array<{ name: string }>>(movie.cast, []);
    for (const actor of cast.slice(0, 5)) {
      if (isLiked) {
        const currentScore = preferences.favoriteActors.get(actor.name) || 0;
        preferences.favoriteActors.set(actor.name, currentScore + recencyWeight);
      }
    }

    // Process keywords with recency weighting
    const keywords = parseJsonSafely<string[]>(movie.keywords, []);
    for (const keyword of keywords) {
      if (isLiked) {
        const currentScore = preferences.favoriteKeywords.get(keyword) || 0;
        preferences.favoriteKeywords.set(keyword, currentScore + 2 * recencyWeight);
      } else if (isWatched) {
        const currentScore = preferences.favoriteKeywords.get(keyword) || 0;
        preferences.favoriteKeywords.set(keyword, currentScore + 0.5 * recencyWeight);
      }
    }

    // Process decades
    if (movie.year && movie.year > 1900 && isLiked) {
      const decade = `${Math.floor(movie.year / 10) * 10}s`;
      const currentScore = preferences.preferredDecades.get(decade) || 0;
      preferences.preferredDecades.set(decade, currentScore + recencyWeight);
    }

    // Track runtime
    if (movie.runtime && movie.runtime > 0 && isWatched) {
      totalRuntime += movie.runtime;
      runtimeCount++;
      runtimes.push(movie.runtime);
    }
  }

  // Calculate runtime preferences
  if (runtimeCount > 0) {
    preferences.averageRuntime = totalRuntime / runtimeCount;
    runtimes.sort((a, b) => a - b);
    const p10 = Math.floor(runtimes.length * 0.1);
    const p90 = Math.floor(runtimes.length * 0.9);
    preferences.runtimeRange = {
      min: runtimes[p10] || 80,
      max: runtimes[p90] || 180,
    };
  }

  // Process reviews for rating style
  for (const review of userReviews) {
    if (review.rating) {
      totalRating += review.rating;
      ratedCount++;
    }
  }

  if (ratedCount > 0) {
    preferences.averageRating = totalRating / ratedCount;
    if (preferences.averageRating >= 3.5) {
      preferences.ratingStyle = "generous";
    } else if (preferences.averageRating <= 2.5) {
      preferences.ratingStyle = "critical";
    }
  }

  // Limit top liked movies to most recent 20
  preferences.topLikedMovieIds = preferences.topLikedMovieIds.slice(0, 20);

  return preferences;
}

export async function getSeenMovieIds(userId: string): Promise<Set<string>> {
  const userMoviesData = await db
    .select({ movieId: userMovies.movieId })
    .from(userMovies)
    .where(eq(userMovies.userId, userId));
  return new Set(userMoviesData.map((m) => m.movieId));
}

// ==========================================
// Scoring Functions
// ==========================================

function calculateMovieScore(
  movie: Movie,
  preferences: UserPreferences,
  seenIds: Set<string>
): ScoredMovie | null {
  if (seenIds.has(movie.id)) return null;
  if (!isQualityContent(movie)) return null;

  let score = 0;
  const reasons: string[] = [];
  const sources = new Set<string>();

  // Genre matching (weighted by user preference)
  for (const genre of movie.genre) {
    const genreScore = preferences.favoriteGenres.get(genre) || 0;
    if (genreScore > 0) {
      score += genreScore * 1.5;
      if (genreScore > 2) {
        reasons.push(`Matches your love of ${genre}`);
      }
    }
  }

  // Director matching
  if (movie.crew) {
    for (const member of movie.crew) {
      if (member.job === "Director") {
        const directorScore = preferences.favoriteDirectors.get(member.name) || 0;
        if (directorScore > 0) {
          score += directorScore * 2;
          reasons.push(`Directed by ${member.name}`);
          sources.add("director");
        }
      }
    }
  }

  // Actor matching
  if (movie.cast) {
    for (const actor of movie.cast.slice(0, 5)) {
      const actorScore = preferences.favoriteActors.get(actor.name) || 0;
      if (actorScore > 0) {
        score += actorScore * 1.2;
        if (actorScore > 1) {
          reasons.push(`Stars ${actor.name}`);
          sources.add("actor");
        }
      }
    }
  }

  // Decade preference
  if (movie.year && movie.year > 1900) {
    const decade = `${Math.floor(movie.year / 10) * 10}s`;
    const decadeScore = preferences.preferredDecades.get(decade) || 0;
    if (decadeScore > 0) {
      score += decadeScore * 0.5;
    }
  }

  // Runtime preference - bonus for movies within user's preferred range
  if (movie.runtime) {
    if (movie.runtime >= preferences.runtimeRange.min && movie.runtime <= preferences.runtimeRange.max) {
      score += 1;
    } else if (Math.abs(movie.runtime - preferences.averageRuntime) > 60) {
      score -= 0.5; // Slight penalty for very different runtime
    }
  }

  // Quality bonus
  if (movie.rating && movie.rating >= 8) {
    score += 2;
    reasons.push("Critically acclaimed");
  } else if (movie.rating && movie.rating >= 7) {
    score += 1;
  }

  // Popularity bonus (ensures some mainstream appeal)
  if (movie.voteCount && movie.voteCount >= 5000) {
    score += 0.5;
  }

  // Rating style adjustment
  if (preferences.ratingStyle === "critical" && movie.rating && movie.rating >= 7.5) {
    score += 1;
  } else if (preferences.ratingStyle === "generous" && movie.rating && movie.rating >= 6) {
    score += 0.5;
  }

  return {
    movie,
    score,
    reasons: reasons.slice(0, 3),
    sources,
  };
}

// ==========================================
// Diversity Control
// ==========================================

function applyDiversityFilter(
  scoredMovies: ScoredMovie[],
  limit: number
): Movie[] {
  const result: Movie[] = [];
  const genreCounts = new Map<string, number>();
  const decadeCounts = new Map<string, number>();
  const directorCounts = new Map<string, number>();

  const MAX_PER_GENRE = Math.ceil(limit / 3);
  const MAX_PER_DECADE = Math.ceil(limit / 2);
  const MAX_PER_DIRECTOR = 2;

  // Sort by score descending
  scoredMovies.sort((a, b) => b.score - a.score);

  for (const scored of scoredMovies) {
    if (result.length >= limit) break;

    const movie = scored.movie;
    let shouldInclude = true;

    // Check genre diversity
    for (const genre of movie.genre) {
      const count = genreCounts.get(genre) || 0;
      if (count >= MAX_PER_GENRE) {
        shouldInclude = false;
        break;
      }
    }

    // Check decade diversity
    if (shouldInclude && movie.year) {
      const decade = `${Math.floor(movie.year / 10) * 10}s`;
      const count = decadeCounts.get(decade) || 0;
      if (count >= MAX_PER_DECADE) {
        shouldInclude = false;
      }
    }

    // Check director diversity
    if (shouldInclude && movie.crew) {
      for (const member of movie.crew) {
        if (member.job === "Director") {
          const count = directorCounts.get(member.name) || 0;
          if (count >= MAX_PER_DIRECTOR) {
            shouldInclude = false;
            break;
          }
        }
      }
    }

    if (shouldInclude) {
      result.push(movie);

      // Update counts
      for (const genre of movie.genre) {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      }
      if (movie.year) {
        const decade = `${Math.floor(movie.year / 10) * 10}s`;
        decadeCounts.set(decade, (decadeCounts.get(decade) || 0) + 1);
      }
      if (movie.crew) {
        for (const member of movie.crew) {
          if (member.job === "Director") {
            directorCounts.set(member.name, (directorCounts.get(member.name) || 0) + 1);
          }
        }
      }
    }
  }

  // If we don't have enough, add remaining by score without diversity filter
  if (result.length < limit) {
    const resultIds = new Set(result.map((m) => m.id));
    for (const scored of scoredMovies) {
      if (result.length >= limit) break;
      if (!resultIds.has(scored.movie.id)) {
        result.push(scored.movie);
      }
    }
  }

  return result;
}

// ==========================================
// Recommendation Generators
// ==========================================

/**
 * Get recommendations based on user's top liked movies (using TMDB's similar/recommendations)
 */
async function getSimilarToLiked(
  preferences: UserPreferences,
  seenIds: Set<string>
): Promise<ScoredMovie[]> {
  const results: ScoredMovie[] = [];

  // Get recommendations for top 5 most recently liked movies
  const likedMovieIds = preferences.topLikedMovieIds.slice(0, 5);

  const promises = likedMovieIds.map(async (movieId) => {
    try {
      const recommendations = await getMovieRecommendations(movieId, 15);
      return recommendations
        .filter((m) => !seenIds.has(m.id) && isQualityContent(m))
        .map((movie) => {
          const scored = calculateMovieScore(movie, preferences, seenIds);
          if (scored) {
            scored.score += 3; // Bonus for being similar to liked
            scored.reasons.unshift("Similar to movies you loved");
            scored.sources.add("similar-to-liked");
          }
          return scored;
        })
        .filter((s): s is ScoredMovie => s !== null);
    } catch {
      return [];
    }
  });

  const allResults = await Promise.all(promises);
  for (const movies of allResults) {
    results.push(...movies);
  }

  return results;
}

/**
 * Get trending movies filtered by user's preferred genres
 */
async function getTrendingInGenres(
  preferences: UserPreferences,
  seenIds: Set<string>
): Promise<ScoredMovie[]> {
  const topGenres = Array.from(preferences.favoriteGenres.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre);

  if (topGenres.length === 0) return [];

  const genreIds = topGenres
    .map((g) => GENRE_IDS[g])
    .filter((id): id is number => id !== undefined);

  if (genreIds.length === 0) return [];

  try {
    const movies = await discoverMoviesByGenres(genreIds, {
      minRating: 6.5,
      minVotes: 100,
      sortBy: "popularity.desc",
    });

    return movies
      .filter((m) => !seenIds.has(m.id) && isQualityContent(m))
      .map((movie) => {
        const scored = calculateMovieScore(movie, preferences, seenIds);
        if (scored) {
          scored.score += 2; // Bonus for trending
          scored.reasons.unshift("Trending in your favorite genres");
          scored.sources.add("trending-genres");
        }
        return scored;
      })
      .filter((s): s is ScoredMovie => s !== null)
      .slice(0, MAX_RECOMMENDATIONS_PER_SOURCE);
  } catch {
    return [];
  }
}

/**
 * Get seasonal recommendations based on current time of year
 */
async function getSeasonalRecommendations(
  preferences: UserPreferences,
  seenIds: Set<string>
): Promise<ScoredMovie[]> {
  const holiday = getCurrentHoliday();
  const season = getCurrentSeason();

  let keywordIds: number[] = [];
  let genreIds: number[] = [];

  if (holiday === "christmas") {
    keywordIds = THEME_KEYWORD_IDS["christmas"] || [];
    genreIds = [GENRE_IDS["Family"], GENRE_IDS["Comedy"]].filter(Boolean) as number[];
  } else if (holiday === "halloween") {
    keywordIds = THEME_KEYWORD_IDS["halloween"] || [];
    genreIds = [GENRE_IDS["Horror"], GENRE_IDS["Thriller"]].filter(Boolean) as number[];
  } else if (holiday === "valentines") {
    genreIds = [GENRE_IDS["Romance"], GENRE_IDS["Comedy"]].filter(Boolean) as number[];
  } else if (season === "summer") {
    genreIds = [GENRE_IDS["Action"], GENRE_IDS["Adventure"]].filter(Boolean) as number[];
  }

  if (keywordIds.length === 0 && genreIds.length === 0) return [];

  try {
    let movies: Movie[] = [];

    if (keywordIds.length > 0) {
      movies = await discoverMoviesByKeywords(keywordIds, {
        minRating: 6.0,
        minVotes: 50,
      });
    } else if (genreIds.length > 0) {
      movies = await discoverMoviesByGenres(genreIds, {
        minRating: 6.5,
        minVotes: 100,
        sortBy: "popularity.desc",
      });
    }

    return movies
      .filter((m) => !seenIds.has(m.id) && isQualityContent(m))
      .map((movie) => {
        const scored = calculateMovieScore(movie, preferences, seenIds);
        if (scored) {
          scored.score += 1.5; // Seasonal bonus
          if (holiday) {
            scored.reasons.unshift(`Perfect for ${holiday}`);
          } else {
            scored.reasons.unshift(`Great ${season} watch`);
          }
          scored.sources.add("seasonal");
        }
        return scored;
      })
      .filter((s): s is ScoredMovie => s !== null)
      .slice(0, MAX_RECOMMENDATIONS_PER_SOURCE / 2);
  } catch {
    return [];
  }
}

/**
 * Get movies based on user's favorite keywords/themes
 */
async function getKeywordBasedRecommendations(
  preferences: UserPreferences,
  seenIds: Set<string>
): Promise<ScoredMovie[]> {
  // Find matching theme keywords from user's favorites
  const userKeywords = Array.from(preferences.favoriteKeywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]) => keyword.toLowerCase());

  // Map user keywords to TMDB keyword IDs
  const matchedKeywordIds: number[] = [];
  for (const [theme, ids] of Object.entries(THEME_KEYWORD_IDS)) {
    const themeWords = theme.split("-");
    if (userKeywords.some((k) => themeWords.some((t) => k.includes(t) || t.includes(k)))) {
      matchedKeywordIds.push(...ids);
    }
  }

  if (matchedKeywordIds.length === 0) return [];

  try {
    const movies = await discoverMoviesByKeywords(matchedKeywordIds.slice(0, 5), {
      minRating: 6.5,
      minVotes: 100,
    });

    return movies
      .filter((m) => !seenIds.has(m.id) && isQualityContent(m))
      .map((movie) => {
        const scored = calculateMovieScore(movie, preferences, seenIds);
        if (scored) {
          scored.score += 2; // Theme bonus
          scored.reasons.unshift("Matches themes you enjoy");
          scored.sources.add("keywords");
        }
        return scored;
      })
      .filter((s): s is ScoredMovie => s !== null)
      .slice(0, MAX_RECOMMENDATIONS_PER_SOURCE);
  } catch {
    return [];
  }
}

// ==========================================
// Main Recommendation Functions
// ==========================================

export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 12
): Promise<Movie[]> {
  try {
    const [preferences, seenIds] = await Promise.all([
      getUserPreferences(userId),
      getSeenMovieIds(userId),
    ]);

    // If user has no data, return empty
    if (preferences.topLikedMovieIds.length === 0 && preferences.favoriteGenres.size === 0) {
      return [];
    }

    // Gather recommendations from multiple sources in parallel
    const [
      similarToLiked,
      trendingInGenres,
      seasonal,
      keywordBased,
    ] = await Promise.all([
      getSimilarToLiked(preferences, seenIds),
      getTrendingInGenres(preferences, seenIds),
      getSeasonalRecommendations(preferences, seenIds),
      getKeywordBasedRecommendations(preferences, seenIds),
    ]);

    // Combine all recommendations
    const allScored: ScoredMovie[] = [
      ...similarToLiked,
      ...trendingInGenres,
      ...seasonal,
      ...keywordBased,
    ];

    // Deduplicate by movie ID, keeping highest score
    const deduped = new Map<string, ScoredMovie>();
    for (const scored of allScored) {
      const existing = deduped.get(scored.movie.id);
      if (!existing || scored.score > existing.score) {
        deduped.set(scored.movie.id, scored);
      }
    }

    // Apply diversity filter and return
    return applyDiversityFilter(Array.from(deduped.values()), limit);
  } catch (error) {
    console.error("Error getting personalized recommendations:", error);
    return [];
  }
}

export async function getMoodRecommendations(
  userId: string,
  mood: MoodKey,
  limit: number = 24
): Promise<Movie[]> {
  try {
    const [preferences, seenIds] = await Promise.all([
      getUserPreferences(userId),
      getSeenMovieIds(userId),
    ]);

    const moodGenres = MOOD_MAP[mood] || [];
    if (moodGenres.length === 0) return [];

    const genreIds = moodGenres
      .map((g) => GENRE_IDS[g])
      .filter((id): id is number => id !== undefined);

    if (genreIds.length === 0) return [];

    // Fetch movies matching mood genres
    const movies = await discoverMoviesByGenres(genreIds, {
      minRating: 6.5,
      minVotes: 100,
      sortBy: "popularity.desc",
    });

    const scored = movies
      .filter((m) => !seenIds.has(m.id) && isQualityContent(m))
      .map((movie) => calculateMovieScore(movie, preferences, seenIds))
      .filter((s): s is ScoredMovie => s !== null);

    return applyDiversityFilter(scored, limit);
  } catch (error) {
    console.error("Error getting mood recommendations:", error);
    return [];
  }
}

export async function getExplorationRecommendations(
  userId: string,
  limit: number = 12
): Promise<Movie[]> {
  try {
    const [preferences, seenIds] = await Promise.all([
      getUserPreferences(userId),
      getSeenMovieIds(userId),
    ]);

    // Get genres user HASN'T watched much
    const allGenres = Object.keys(GENRE_IDS);
    const lowWatchedGenres = allGenres
      .filter((g) => (preferences.favoriteGenres.get(g) || 0) < 2)
      .slice(0, 5);

    const genreIds = lowWatchedGenres
      .map((g) => GENRE_IDS[g])
      .filter((id): id is number => id !== undefined);

    if (genreIds.length === 0) {
      // Fallback to trending
      const trending = await getTrendingMovies();
      return trending.filter((m) => !seenIds.has(m.id)).slice(0, limit);
    }

    // Get highly rated movies from underexplored genres
    const movies = await discoverMoviesByGenres(genreIds.slice(0, 3), {
      minRating: 7.5,
      minVotes: 500,
      sortBy: "vote_average.desc",
    });

    const filtered = movies
      .filter((m) => !seenIds.has(m.id) && isQualityContent(m))
      .slice(0, limit);

    return filtered;
  } catch (error) {
    console.error("Error getting exploration recommendations:", error);
    return [];
  }
}

export async function getHiddenGems(
  userId: string,
  limit: number = 12
): Promise<Movie[]> {
  try {
    const [preferences, seenIds] = await Promise.all([
      getUserPreferences(userId),
      getSeenMovieIds(userId),
    ]);

    // Get top genres
    const topGenres = Array.from(preferences.favoriteGenres.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    const genreIds = topGenres
      .map((g) => GENRE_IDS[g])
      .filter((id): id is number => id !== undefined);

    // Hidden gems: high rating, moderate popularity
    const movies = await discoverMoviesByGenres(
      genreIds.length > 0 ? genreIds : [GENRE_IDS["Drama"]],
      {
        minRating: 7.0,
        minVotes: 100,
        maxVotes: 3000,
        sortBy: "vote_average.desc",
      }
    );

    const filtered = movies
      .filter((m) => !seenIds.has(m.id) && isQualityContent(m));

    // Shuffle for variety
    const shuffled = [...filtered];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, limit);
  } catch (error) {
    console.error("Error getting hidden gems:", error);
    return [];
  }
}

// ==========================================
// Utility Exports
// ==========================================

export async function getWatchedCount(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(userMovies)
      .where(and(eq(userMovies.userId, userId), eq(userMovies.watched, true)));
    return result[0]?.count || 0;
  } catch (error) {
    console.error("Error getting watched count:", error);
    return 0;
  }
}

export async function getDefaultMood(userId: string): Promise<MoodKey> {
  try {
    const preferences = await getUserPreferences(userId);

    // Map genres to moods
    const genreToMood: Record<string, MoodKey[]> = {
      "Horror": ["dark-intense"],
      "Crime": ["dark-intense", "mind-bending"],
      "War": ["dark-intense", "thought-provoking"],
      "Science Fiction": ["mind-bending", "thought-provoking"],
      "Mystery": ["mind-bending"],
      "Thriller": ["mind-bending", "adrenaline"],
      "Action": ["adrenaline"],
      "Adventure": ["adrenaline"],
      "Comedy": ["uplifting", "feel-good"],
      "Animation": ["uplifting", "feel-good"],
      "Family": ["uplifting", "feel-good"],
      "Music": ["uplifting", "feel-good"],
      "Romance": ["feel-good"],
      "Documentary": ["thought-provoking"],
      "Drama": ["thought-provoking", "classic"],
    };

    const moodScores = new Map<MoodKey, number>();
    for (const mood of Object.keys(MOOD_MAP) as MoodKey[]) {
      moodScores.set(mood, 0);
    }

    // Score moods based on user's genre preferences
    for (const [genre, score] of preferences.favoriteGenres) {
      const moods = genreToMood[genre] || [];
      for (const mood of moods) {
        moodScores.set(mood, (moodScores.get(mood) || 0) + score);
      }
    }

    // Find best mood
    let bestMood: MoodKey = "uplifting";
    let bestScore = 0;
    for (const [mood, score] of moodScores) {
      if (score > bestScore) {
        bestScore = score;
        bestMood = mood;
      }
    }

    return bestMood;
  } catch (error) {
    console.error("Error getting default mood:", error);
    return "uplifting";
  }
}

export async function getDiscoveryContent(userId: string): Promise<{
  personalized: Movie[];
  trending: Movie[];
  highlyRated: Movie[];
}> {
  try {
    const [personalized, trending] = await Promise.all([
      getPersonalizedRecommendations(userId, 12),
      getTrendingMovies(),
    ]);

    const seenIds = await getSeenMovieIds(userId);
    const filteredTrending = trending.filter((m) => !seenIds.has(m.id));

    return {
      personalized,
      trending: filteredTrending,
      highlyRated: [], // Can be populated if needed
    };
  } catch (error) {
    console.error("Error getting discovery content:", error);
    return { personalized: [], trending: [], highlyRated: [] };
  }
}
