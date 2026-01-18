import { db } from "@/db";
import { userMovies, reviews, negativeSignals, userBehaviorPatterns } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { Movie } from "@/types";
import {
  getMovieRecommendations,
  getSimilarMovies,
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

// Dynamic quality thresholds based on user preference (Phase 1)
// These are defaults - actual thresholds are calculated per-user
const DEFAULT_MIN_VOTE_COUNT = 500; // Raised from 50 to filter obscure films
const DEFAULT_MIN_RATING = 6.0; // Raised from 5.5 for better quality
const RECENCY_DECAY_DAYS = 180; // Half-life for recency weighting
const MAX_RECOMMENDATIONS_PER_SOURCE = 30;

// Vote count thresholds by user preference
const VOTE_THRESHOLDS = {
  mainstream: 1000, // User prefers well-known films
  balanced: 500,    // Default - mix of popular and lesser-known
  niche: 200,       // User enjoys hidden gems
} as const;

type PopularityPreference = keyof typeof VOTE_THRESHOLDS;

interface UserPreferences {
  // Existing preferences
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

  // Production analysis (NEW)
  favoriteProductionCompanies: Map<string, number>;
  favoriteProductionCountries: Map<string, number>;
  favoriteWatchProviders: Map<string, number>;

  // Negative patterns (NEW)
  dislikedGenres: Map<string, number>;
  dislikedDirectors: Set<string>;
  dislikedProductionCompanies: Set<string>;
  dislikedThemes: Set<string>;

  // Behavioral patterns (NEW)
  watchingVelocity: number; // Movies per week
  explorationScore: number; // 0-1: genre diversity seeking
  qualityThreshold: number; // Minimum rating user typically enjoys (0-10 scale)
  complexityPreference: number; // 0-1: narrative complexity tolerance

  // Temporal patterns (NEW)
  recentGenreShift: string[]; // Genres watched in last 30 days
  bingeBehavior: boolean; // Does user watch series in batches?

  // Popularity preference (Phase 1 & 3)
  popularityPreference: PopularityPreference; // User's mainstream vs niche preference
  averageVoteCount: number; // Average popularity of watched films
  minVoteCountThreshold: number; // Dynamic quality threshold based on preference
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

/**
 * Check if a movie meets quality thresholds
 * @param movie - The movie to check
 * @param minVotes - Minimum vote count (dynamic based on user preference)
 * @param minRating - Minimum rating threshold
 */
function isQualityContent(
  movie: Movie,
  minVotes: number = DEFAULT_MIN_VOTE_COUNT,
  minRating: number = DEFAULT_MIN_RATING
): boolean {
  if (movie.voteCount !== undefined && movie.voteCount < minVotes) return false;
  if (movie.rating !== undefined && movie.rating < minRating) return false;
  return true;
}

// ==========================================
// User Preferences Analysis
// ==========================================

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  // Fetch user's movie data with all fields
  const [userMoviesData, userReviews, negativeSignalsData, behaviorCache] = await Promise.all([
    db
      .select()
      .from(userMovies)
      .where(eq(userMovies.userId, userId))
      .orderBy(desc(userMovies.watchedDate)),
    db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId)),
    db
      .select()
      .from(negativeSignals)
      .where(eq(negativeSignals.userId, userId)),
    db
      .select()
      .from(userBehaviorPatterns)
      .where(eq(userBehaviorPatterns.userId, userId))
      .limit(1),
  ]);

  const preferences: UserPreferences = {
    // Existing preferences
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

    // NEW: Production analysis
    favoriteProductionCompanies: new Map(),
    favoriteProductionCountries: new Map(),
    favoriteWatchProviders: new Map(),

    // NEW: Negative patterns
    dislikedGenres: new Map(),
    dislikedDirectors: new Set(),
    dislikedProductionCompanies: new Set(),
    dislikedThemes: new Set(),

    // NEW: Behavioral defaults
    watchingVelocity: 0,
    explorationScore: 0.5,
    qualityThreshold: 6.5,
    complexityPreference: 0.5,
    recentGenreShift: [],
    bingeBehavior: false,

    // NEW: Popularity preference (Phase 1 & 3)
    popularityPreference: "balanced",
    averageVoteCount: 0,
    minVoteCountThreshold: VOTE_THRESHOLDS.balanced,
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

    // NEW: Process production companies from liked movies
    if (isLiked) {
      const companies = parseJsonSafely<Array<{ id: number; name: string }>>(
        movie.productionCompanies,
        []
      );
      for (const company of companies.slice(0, 3)) {
        const current = preferences.favoriteProductionCompanies.get(company.name) || 0;
        preferences.favoriteProductionCompanies.set(company.name, current + 2 * recencyWeight);
      }

      // NEW: Process production countries
      const countries = parseJsonSafely<Array<{ iso: string; name: string }>>(
        movie.productionCountries,
        []
      );
      for (const country of countries) {
        const current = preferences.favoriteProductionCountries.get(country.name) || 0;
        preferences.favoriteProductionCountries.set(country.name, current + recencyWeight);
      }

      // NEW: Process watch providers
      const providers = parseJsonSafely<Record<string, unknown>>(movie.watchProviders, {});
      const userRegion = "US"; // TODO: Get from user settings
      const regionProviders = providers[userRegion];

      if (regionProviders?.flatrate) {
        for (const provider of regionProviders.flatrate) {
          const current = preferences.favoriteWatchProviders.get(provider.provider_name) || 0;
          preferences.favoriteWatchProviders.set(provider.provider_name, current + recencyWeight);
        }
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

  // NEW: Process negative signals
  for (const signal of negativeSignalsData) {
    if (signal.signalType === "low_rating" && signal.signalValue && signal.signalValue <= 2) {
      const context = parseJsonSafely<Record<string, unknown>>(signal.context, {});

      // Track disliked genres
      const genres = parseJsonSafely<string[]>(context.genres, []);
      for (const genre of genres) {
        const current = preferences.dislikedGenres.get(genre) || 0;
        preferences.dislikedGenres.set(genre, current + 1);
      }

      // Track disliked production companies
      const companies = parseJsonSafely<Array<{ name: string }>>(
        context.productionCompanies,
        []
      );
      for (const company of companies) {
        preferences.dislikedProductionCompanies.add(company.name);
      }
    }
  }

  // Filter out false negatives: If user has watched genre many times,
  // a few dislikes don't mean true aversion
  preferences.dislikedGenres.forEach((dislikeCount, genre) => {
    const likeCount = preferences.favoriteGenres.get(genre) || 0;
    const totalExposure = dislikeCount + likeCount;

    // Only consider it a true dislike if <30% positive rate
    if (totalExposure > 5 && dislikeCount / totalExposure < 0.7) {
      preferences.dislikedGenres.delete(genre);
    }
  });

  // NEW: Calculate behavioral metrics
  const watchedMovies = userMoviesData.filter((m) => m.watched && m.watchedDate);

  // Watching velocity (movies per week over last 90 days)
  const recentWatched = watchedMovies.filter((m) => {
    const daysSince = (Date.now() - m.watchedDate!.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 90;
  });
  preferences.watchingVelocity = recentWatched.length / (90 / 7);

  // Exploration score: How diverse are their genres?
  const genreCount = preferences.favoriteGenres.size;
  const totalWatched = watchedMovies.length;
  preferences.explorationScore =
    totalWatched > 0 ? Math.min(1, genreCount / (totalWatched * 0.3)) : 0.5;

  // Quality threshold: What's the minimum rating they typically enjoy?
  const ratings = userReviews.filter((r) => r.rating).map((r) => r.rating as number);
  if (ratings.length >= 5) {
    ratings.sort((a, b) => a - b);
    const p25 = ratings[Math.floor(ratings.length * 0.25)];
    // Map 1-5 rating scale to 0-10 TMDB scale
    preferences.qualityThreshold = p25 * 2;
  }

  // Recent genre shift (last 30 days vs overall)
  const last30Days = watchedMovies.filter((m) => {
    const daysSince = (Date.now() - m.watchedDate!.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  });

  const recentGenres = new Map<string, number>();
  for (const movie of last30Days) {
    const genres = parseJsonSafely<string[]>(movie.genres, []);
    for (const genre of genres) {
      recentGenres.set(genre, (recentGenres.get(genre) || 0) + 1);
    }
  }

  preferences.recentGenreShift = Array.from(recentGenres.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre);

  // NEW: Calculate popularity preference (Phase 3)
  // Use production companies as a proxy for mainstream vs niche preference
  // Major studios typically distribute more mainstream films
  const majorStudios = new Set([
    "Warner Bros. Pictures", "Universal Pictures", "Paramount Pictures",
    "20th Century Studios", "Sony Pictures", "Walt Disney Pictures",
    "Columbia Pictures", "Metro-Goldwyn-Mayer", "Lionsgate", "Netflix",
    "Amazon Studios", "Apple Studios", "A24", "Searchlight Pictures"
  ]);

  let mainstreamCount = 0;
  let nicheCount = 0;

  for (const movie of watchedMovies) {
    if (movie.liked) {
      const companies = parseJsonSafely<Array<{ name: string }>>(movie.productionCompanies, []);
      const hasMajorStudio = companies.some(c => majorStudios.has(c.name));

      if (hasMajorStudio) {
        mainstreamCount++;
      } else if (companies.length > 0) {
        nicheCount++;
      }
    }
  }

  const totalCategorized = mainstreamCount + nicheCount;
  if (totalCategorized >= 5) {
    const mainstreamRatio = mainstreamCount / totalCategorized;
    if (mainstreamRatio > 0.7) {
      preferences.popularityPreference = "mainstream";
    } else if (mainstreamRatio < 0.3) {
      preferences.popularityPreference = "niche";
    } else {
      preferences.popularityPreference = "balanced";
    }
  }
  // Set the vote count threshold based on preference
  preferences.minVoteCountThreshold = VOTE_THRESHOLDS[preferences.popularityPreference];

  // Use cached behavioral patterns if available
  if (behaviorCache.length > 0) {
    const cached = behaviorCache[0];
    if (cached.watchingVelocity !== null) {
      preferences.watchingVelocity = cached.watchingVelocity / 100; // Convert from stored integer
    }
    if (cached.explorationScore !== null) {
      preferences.explorationScore = cached.explorationScore / 100; // Convert from stored integer
    }
    preferences.bingeBehavior =
      parseJsonSafely(cached.bingePatterns, {}).isBinger || false;
  }

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
  if (!isQualityContent(movie, preferences.minVoteCountThreshold)) return null;

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

  // Popularity alignment scoring (Phase 5) - replaces simple popularity bonus
  if (movie.voteCount && preferences.popularityPreference) {
    if (preferences.popularityPreference === "mainstream") {
      // Mainstream user: boost popular films, penalize obscure
      if (movie.voteCount > 10000) {
        score += 2;
        reasons.push("Popular choice");
      } else if (movie.voteCount > 5000) {
        score += 1;
      } else if (movie.voteCount < 1000) {
        score -= 1;
      }
    } else if (preferences.popularityPreference === "niche") {
      // Niche user: boost hidden gems
      if (movie.voteCount < 3000 && movie.rating && movie.rating > 7.0) {
        score += 2;
        reasons.push("Hidden gem");
      } else if (movie.voteCount < 5000) {
        score += 0.5;
      }
    } else {
      // Balanced: small bonus for moderately popular
      if (movie.voteCount >= 5000) {
        score += 0.5;
      }
    }
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

/**
 * Enhanced movie scoring with production company, country, and advanced behavioral analysis
 */
function calculateEnhancedMovieScore(
  movie: Movie,
  preferences: UserPreferences,
  source: string
): number {
  let score = 0;

  // === GENRE MATCHING (0-10 points) ===
  let genreScore = 0;
  for (const genre of movie.genre || []) {
    const preference = preferences.favoriteGenres.get(genre) || 0;
    genreScore += preference * 0.5;

    // Penalty for disliked genres
    const dislikeScore = preferences.dislikedGenres.get(genre) || 0;
    if (dislikeScore > 2) {
      genreScore -= dislikeScore * 2; // Heavy penalty
    }
  }
  score += Math.min(10, genreScore);

  // === DIRECTOR MATCHING (0-8 points) ===
  const directors = movie.crew?.filter((c) => c.job === "Director") || [];
  for (const director of directors) {
    const preference = preferences.favoriteDirectors.get(director.name) || 0;
    if (preference > 0) {
      score += Math.min(8, preference * 2);
    }
    // Strong penalty for disliked directors
    if (preferences.dislikedDirectors.has(director.name)) {
      score -= 10;
    }
  }

  // === ACTOR MATCHING (0-6 points) ===
  const topCast = movie.cast?.slice(0, 10) || [];
  for (const actor of topCast) {
    const preference = preferences.favoriteActors.get(actor.name) || 0;
    if (preference > 0) {
      score += Math.min(1, preference * 0.3);
    }
  }

  // === PRODUCTION COMPANY MATCHING (0-7 points) ===
  const companies = movie.productionCompanies || [];
  for (const company of companies.slice(0, 3)) {
    const preference = preferences.favoriteProductionCompanies.get(company.name) || 0;
    if (preference > 1) {
      score += Math.min(4, preference);
    }
    // Penalty for disliked studios
    if (preferences.dislikedProductionCompanies.has(company.name)) {
      score -= 5;
    }
  }

  // === PRODUCTION COUNTRY MATCHING (0-4 points) ===
  const countries = movie.productionCountries || [];
  for (const country of countries) {
    const preference = preferences.favoriteProductionCountries.get(country.name) || 0;
    if (preference > 0.5) {
      score += Math.min(4, preference * 1.5);
    }
  }

  // === QUALITY ALIGNMENT (0-8 points) ===
  if (movie.rating) {
    const ratingDiff = movie.rating - preferences.qualityThreshold;

    if (ratingDiff >= 1.5) {
      score += 8; // Significantly above threshold
    } else if (ratingDiff >= 0.5) {
      score += 5; // Above threshold
    } else if (ratingDiff >= -0.5) {
      score += 3; // At threshold
    } else {
      score -= 3; // Below threshold
    }
  }

  // === RUNTIME FIT (0-3 points) ===
  if (movie.runtime) {
    if (
      movie.runtime >= preferences.runtimeRange.min &&
      movie.runtime <= preferences.runtimeRange.max
    ) {
      score += 3;
    } else {
      const diff = Math.min(
        Math.abs(movie.runtime - preferences.runtimeRange.min),
        Math.abs(movie.runtime - preferences.runtimeRange.max)
      );
      score -= Math.min(2, diff / 30);
    }
  }

  // === DECADE PREFERENCE (0-2 points) ===
  if (movie.year && movie.year > 1900) {
    const decade = `${Math.floor(movie.year / 10) * 10}s`;
    const preference = preferences.preferredDecades.get(decade) || 0;
    score += Math.min(2, preference);
  }

  // === KEYWORD/THEME MATCHING (0-5 points) ===
  const keywords = movie.keywords || [];
  for (const keyword of keywords) {
    const preference = preferences.favoriteKeywords.get(keyword) || 0;
    if (preference > 0) {
      score += Math.min(0.5, preference * 0.2);
    }
    // Penalty for disliked themes
    if (preferences.dislikedThemes.has(keyword)) {
      score -= 2;
    }
  }

  // === RECENT TREND BONUS (0-3 points) ===
  if (preferences.recentGenreShift.length > 0) {
    const recentGenreMatches =
      movie.genre?.filter((g) => preferences.recentGenreShift.includes(g)).length || 0;
    if (recentGenreMatches > 0) {
      score += recentGenreMatches * 1.5;
    }
  }

  // === POPULARITY BALANCE (0-3 points) ===
  if (movie.voteCount) {
    if (preferences.watchingVelocity > 5) {
      // High velocity: prefer popular
      if (movie.voteCount > 5000) score += 2;
    } else {
      // Low velocity: prefer quality hidden gems
      if (movie.voteCount < 3000 && movie.rating && movie.rating > 7.5) {
        score += 3;
      }
    }
  }

  // === EXPLORATION BONUS (0-2 points) ===
  if (preferences.explorationScore > 0.7) {
    const unfamiliarGenres =
      movie.genre?.filter(
        (g) => !preferences.favoriteGenres.has(g) || preferences.favoriteGenres.get(g)! < 1
      ).length || 0;
    if (unfamiliarGenres > 0 && movie.rating && movie.rating > 7.0) {
      score += 2;
    }
  }

  // === WATCH PROVIDER COMPATIBILITY (0-4 points) - Phase 4 ===
  // Scoring boost only - still shows good recommendations regardless of platform
  if (preferences.favoriteWatchProviders.size > 0) {
    const watchProviders = movie.watchProviders as Record<string, { flatrate?: Array<{ provider_name: string }> }> | undefined;
    const userRegion = "US"; // TODO: Get from user settings
    const movieProviders = watchProviders?.[userRegion]?.flatrate || [];

    let providerScore = 0;
    for (const provider of movieProviders) {
      const preference = preferences.favoriteWatchProviders.get(provider.provider_name) || 0;
      if (preference > 1) {
        providerScore += Math.min(2, preference * 0.5);
      }
    }
    score += Math.min(4, providerScore);
    // No penalty for unavailable platforms - just don't add bonus
  }

  // === POPULARITY ALIGNMENT (bonus/penalty based on user preference) - Phase 5 ===
  if (movie.voteCount && preferences.popularityPreference) {
    if (preferences.popularityPreference === "mainstream") {
      // Mainstream user: boost popular films, penalize obscure
      if (movie.voteCount > 10000) score += 3;
      else if (movie.voteCount > 5000) score += 1;
      else if (movie.voteCount < 1000) score -= 2;
    } else if (preferences.popularityPreference === "niche") {
      // Niche user: boost hidden gems, don't penalize popular
      if (movie.voteCount < 3000 && movie.rating && movie.rating > 7.0) score += 3;
      else if (movie.voteCount < 5000) score += 1;
    }
    // 'balanced' users get no additional adjustment
  }

  // === SOURCE MULTIPLIER ===
  const sourceMultipliers: Record<string, number> = {
    similar: 1.2,
    trending: 1.0,
    keyword: 1.1,
    seasonal: 0.9,
  };
  score *= sourceMultipliers[source] || 1.0;

  return score;
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

/**
 * Enhanced diversity filter with production company and country diversity
 */
function applyEnhancedDiversityFilter(
  scoredMovies: ScoredMovie[],
  preferences: UserPreferences,
  limit: number
): ScoredMovie[] {
  const selected: ScoredMovie[] = [];
  const genreCounts = new Map<string, number>();
  const decadeCounts = new Map<string, number>();
  const directorCounts = new Map<string, number>();
  const studioCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();

  // Constraints
  const MAX_PER_GENRE = Math.ceil(limit / 3);
  const MAX_PER_DECADE = Math.ceil(limit / 3);
  const MAX_PER_DIRECTOR = 2;
  const MAX_PER_STUDIO = 4;
  const MAX_PER_COUNTRY = Math.ceil(limit / 2);

  for (const scored of scoredMovies) {
    if (selected.length >= limit) break;

    // Check constraints
    const genreOk =
      scored.movie.genre?.every((g) => (genreCounts.get(g) || 0) < MAX_PER_GENRE) ?? true;

    const decade = scored.movie.year
      ? `${Math.floor(scored.movie.year / 10) * 10}s`
      : "unknown";
    const decadeOk = (decadeCounts.get(decade) || 0) < MAX_PER_DECADE;

    const directors =
      scored.movie.crew?.filter((c) => c.job === "Director").map((d) => d.name) || [];
    const directorOk = directors.every((d) => (directorCounts.get(d) || 0) < MAX_PER_DIRECTOR);

    const studios = scored.movie.productionCompanies?.map((c) => c.name) || [];
    const studioOk = studios.every((s) => (studioCounts.get(s) || 0) < MAX_PER_STUDIO);

    const countries = scored.movie.productionCountries?.map((c) => c.name) || [];
    const countryOk = countries.every((c) => (countryCounts.get(c) || 0) < MAX_PER_COUNTRY);

    if (genreOk && decadeOk && directorOk && studioOk && countryOk) {
      selected.push(scored);

      // Update counts
      scored.movie.genre?.forEach((g) => genreCounts.set(g, (genreCounts.get(g) || 0) + 1));
      decadeCounts.set(decade, (decadeCounts.get(decade) || 0) + 1);
      directors.forEach((d) => directorCounts.set(d, (directorCounts.get(d) || 0) + 1));
      studios.forEach((s) => studioCounts.set(s, (studioCounts.get(s) || 0) + 1));
      countries.forEach((c) => countryCounts.set(c, (countryCounts.get(c) || 0) + 1));
    }
  }

  return selected;
}

// ==========================================
// Recommendation Generators
// ==========================================

/**
 * Get recommendations based on user's top liked movies (using TMDB's recommendations AND similar movies)
 * Phase 2: Enhanced to fetch both endpoints for better "vibe" matching
 */
async function getSimilarToLiked(
  preferences: UserPreferences,
  seenIds: Set<string>
): Promise<ScoredMovie[]> {
  const results: ScoredMovie[] = [];

  // Increased from 5 to 8 for better coverage (Phase 2)
  const likedMovieIds = preferences.topLikedMovieIds.slice(0, 8);

  const promises = likedMovieIds.map(async (movieId) => {
    try {
      // Fetch BOTH recommendations AND similar movies (Phase 2)
      const [recommendations, similar] = await Promise.all([
        getMovieRecommendations(movieId, 15),
        getSimilarMovies(movieId, 'movie').catch(() => []), // Graceful fallback
      ]);

      // Process TMDB recommendations with higher bonus
      const recResults = recommendations
        .filter((m) => !seenIds.has(m.id) && isQualityContent(m, preferences.minVoteCountThreshold))
        .map((movie) => {
          const scored = calculateMovieScore(movie, preferences, seenIds);
          if (scored) {
            scored.score += 4; // Higher bonus for TMDB recommendations
            scored.reasons.unshift("Similar to movies you loved");
            scored.sources.add("similar-to-liked");
          }
          return scored;
        })
        .filter((s): s is ScoredMovie => s !== null);

      // Process similar movies with slightly lower bonus
      const simResults = similar
        .filter((m) => !seenIds.has(m.id) && isQualityContent(m, preferences.minVoteCountThreshold))
        .map((movie) => {
          const scored = calculateMovieScore(movie, preferences, seenIds);
          if (scored) {
            scored.score += 3; // Bonus for similar movies
            scored.reasons.unshift("Shares themes with your favorites");
            scored.sources.add("similar-content");
          }
          return scored;
        })
        .filter((s): s is ScoredMovie => s !== null);

      return [...recResults, ...simResults];
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
 * Get recommendations based on user's 5-star rated movies (Phase 6)
 * These get the HIGHEST scores since user explicitly rated them highest
 */
async function getRecommendationsFromTopRated(
  userId: string,
  preferences: UserPreferences,
  seenIds: Set<string>
): Promise<ScoredMovie[]> {
  try {
    // Get user's 5-star rated movies from reviews table
    const topRated = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.rating, 5)))
      .orderBy(desc(reviews.createdAt))
      .limit(10);

    const movieIds = topRated
      .filter((r) => r.mediaId && r.mediaType === "movie")
      .map((r) => r.mediaId as string);

    if (movieIds.length === 0) {
      return [];
    }

    // Fetch recommendations for each 5-star movie with highest weight
    const results: ScoredMovie[] = [];

    // Process top 5 five-star rated movies
    const topFiveStarIds = movieIds.slice(0, 5);

    const promises = topFiveStarIds.map(async (movieId) => {
      try {
        const [recs, similar] = await Promise.all([
          getMovieRecommendations(movieId, 10),
          getSimilarMovies(movieId, "movie").catch(() => []),
        ]);

        const scored: ScoredMovie[] = [];

        // Process both recommendations and similar movies
        for (const movie of [...recs, ...similar]) {
          if (seenIds.has(movie.id)) continue;
          if (!isQualityContent(movie, preferences.minVoteCountThreshold)) continue;

          const movieScore = calculateMovieScore(movie, preferences, seenIds);
          if (movieScore) {
            movieScore.score += 6; // Strong bonus for 5-star based
            movieScore.reasons.unshift("Based on a movie you rated 5 stars");
            movieScore.sources.add("top-rated");
            scored.push(movieScore);
          }
        }

        return scored;
      } catch {
        return [];
      }
    });

    const allResults = await Promise.all(promises);
    for (const movies of allResults) {
      results.push(...movies);
    }

    return results;
  } catch (error) {
    console.error("Error getting recommendations from top rated:", error);
    return [];
  }
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
      .filter((m) => !seenIds.has(m.id) && isQualityContent(m, preferences.minVoteCountThreshold))
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
      .filter((m) => !seenIds.has(m.id) && isQualityContent(m, preferences.minVoteCountThreshold))
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
      .filter((m) => !seenIds.has(m.id) && isQualityContent(m, preferences.minVoteCountThreshold))
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
  limit: number = 20
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

    // Gather recommendations from multiple sources in parallel (Phase 7)
    const [
      similarToLiked,
      topRatedBased, // NEW: Based on 5-star rated movies
      trendingInGenres,
      seasonal,
      keywordBased,
    ] = await Promise.all([
      getSimilarToLiked(preferences, seenIds),
      getRecommendationsFromTopRated(userId, preferences, seenIds), // NEW
      getTrendingInGenres(preferences, seenIds),
      getSeasonalRecommendations(preferences, seenIds),
      getKeywordBasedRecommendations(preferences, seenIds),
    ]);

    // Combine all recommendations (including new top-rated source)
    const allScored: ScoredMovie[] = [
      ...similarToLiked,
      ...topRatedBased, // NEW
      ...trendingInGenres,
      ...seasonal,
      ...keywordBased,
    ];

    // Deduplicate by movie ID, merging scores from multiple sources
    const movieScores = new Map<string, ScoredMovie>();
    for (const candidate of allScored) {
      const existing = movieScores.get(candidate.movie.id);
      if (existing) {
        // Multiple sources recommend this - boost score
        existing.score += candidate.score * 0.3;
        existing.sources = new Set([...existing.sources, ...candidate.sources]);
        existing.reasons = [...new Set([...existing.reasons, ...candidate.reasons])];
      } else {
        movieScores.set(candidate.movie.id, candidate);
      }
    }

    // Sort by score and apply enhanced diversity filter
    const rankedCandidates = Array.from(movieScores.values()).sort((a, b) => b.score - a.score);
    const diverseResults = applyEnhancedDiversityFilter(rankedCandidates, preferences, limit);

    return diverseResults.map((r) => r.movie);
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

    // Fetch multiple pages to ensure we have enough candidates
    // Even if user has watched a lot, we should always find movies
    const moviePromises = [];
    const pagesToFetch = 3; // Fetch 3 pages = ~60 movies

    for (let page = 1; page <= pagesToFetch; page++) {
      moviePromises.push(
        discoverMoviesByGenres(genreIds, {
          minRating: 5.5, // Lower threshold for mood browsing
          minVotes: 50,   // Lower threshold to include more movies
          sortBy: page === 1 ? "popularity.desc" : "vote_average.desc", // Mix popular and highly rated
          page,
        })
      );
    }

    const moviePages = await Promise.all(moviePromises);
    const allMovies = moviePages.flat();

    // If still no movies, try with even lower thresholds
    let candidates = allMovies;
    if (candidates.length === 0) {
      console.log(`[MoodRecommendations] No movies found for ${mood}, trying relaxed filters`);
      const relaxedMovies = await discoverMoviesByGenres(genreIds, {
        minRating: 4.0,
        minVotes: 10,
        sortBy: "popularity.desc",
        page: 1,
      });
      candidates = relaxedMovies;
    }

    // Filter and score
    const scored = candidates
      .filter((m) => !seenIds.has(m.id)) // Only filter out watched, not quality
      .map((movie) => {
        // Still score for quality, but don't filter out
        const scored = calculateMovieScore(movie, preferences, seenIds);
        return scored || { movie, score: 1, reasons: [], sources: new Set() };
      })
      .filter((s): s is ScoredMovie => s !== null);

    // If we still have nothing, log and return empty
    if (scored.length === 0) {
      console.warn(`[MoodRecommendations] No unwatched movies found for mood: ${mood}`);
      return [];
    }

    const result = applyDiversityFilter(scored, limit);
    console.log(`[MoodRecommendations] Returning ${result.length} movies for mood: ${mood} (from ${candidates.length} candidates)`);
    return result;
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

    // Fetch multiple pages to ensure enough candidates
    const moviePromises = [
      discoverMoviesByGenres(genreIds.slice(0, 3), {
        minRating: 7.0, // Slightly lower to get more results
        minVotes: 300,
        sortBy: "vote_average.desc",
        page: 1,
      }),
      discoverMoviesByGenres(genreIds.slice(0, 3), {
        minRating: 7.0,
        minVotes: 300,
        sortBy: "vote_average.desc",
        page: 2,
      }),
    ];

    const moviePages = await Promise.all(moviePromises);
    const allMovies = moviePages.flat();

    const filtered = allMovies
      .filter((m) => !seenIds.has(m.id))
      .slice(0, limit);

    console.log(`[ExplorationRecommendations] Returning ${filtered.length} movies from ${allMovies.length} candidates`);
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

    // Fetch multiple pages of hidden gems
    const moviePromises = [
      discoverMoviesByGenres(
        genreIds.length > 0 ? genreIds : [GENRE_IDS["Drama"]],
        {
          minRating: 6.5, // Lower threshold to get more hidden gems
          minVotes: 100,
          maxVotes: 3000,
          sortBy: "vote_average.desc",
          page: 1,
        }
      ),
      discoverMoviesByGenres(
        genreIds.length > 0 ? genreIds : [GENRE_IDS["Drama"]],
        {
          minRating: 6.5,
          minVotes: 100,
          maxVotes: 3000,
          sortBy: "vote_average.desc",
          page: 2,
        }
      ),
    ];

    const moviePages = await Promise.all(moviePromises);
    const allMovies = moviePages.flat();

    const filtered = allMovies.filter((m) => !seenIds.has(m.id));

    // Shuffle for variety
    const shuffled = [...filtered];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const result = shuffled.slice(0, limit);
    console.log(`[HiddenGems] Returning ${result.length} movies from ${filtered.length} candidates`);
    return result;
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
