import { db } from "@/db";
import { userMovies, reviews } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Movie } from "@/types";
import {
  getMediaById,
  searchMoviesOnly,
  getTrendingMovies,
  discoverMovies,
  discoverTv,
} from "./tmdb";

const TMDB_IMAGE_BASE_URL_W500 = "https://image.tmdb.org/t/p/w500";

const GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10762: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export const MOOD_MAP: Record<string, string[]> = {
  "uplifting": ["Comedy", "Animation", "Family", "Music"],
  "mind-bending": ["Science Fiction", "Mystery", "Thriller"],
  "dark-intense": ["Horror", "Crime", "War"],
  "feel-good": ["Romance", "Comedy", "Music"],
  "adrenaline": ["Action", "Adventure", "Thriller"],
  "thought-provoking": ["Documentary", "Drama", "Science Fiction"],
  "classic": ["Film-Noir", "Drama", "Mystery"],
};

export type MoodKey = keyof typeof MOOD_MAP;

const MIN_VOTE_COUNT = 50;
const MIN_RATING_THRESHOLD = 5.5;

interface UserPreferences {
  favoriteGenres: Record<string, number>;
  favoriteDirectors: Record<string, number>;
  favoriteActors: Record<string, number>;
  preferredDecades: Record<string, number>;
  averageRating: number;
  ratingStyle: "generous" | "moderate" | "critical";
  highlyRatedMovies: Set<string>;
}

interface RecommendationScore {
  movie: Movie;
  score: number;
  reasons: string[];
  qualityScore: number;
}

function parseJsonSafely<T>(data: unknown, fallback: T): T {
  if (data === null || data === undefined) {
    return fallback;
  }
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  }
  return data as T;
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const userMoviesData = await db
    .select()
    .from(userMovies)
    .where(eq(userMovies.userId, userId));
  const userReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.userId, userId));

  const preferences: UserPreferences = {
    favoriteGenres: {},
    favoriteDirectors: {},
    favoriteActors: {},
    preferredDecades: {},
    averageRating: 0,
    ratingStyle: "moderate",
    highlyRatedMovies: new Set(),
  };

  let totalRating = 0;
  let ratedCount = 0;
  let ratingsSum = 0;
  let ratingsCount = 0;

  for (const movie of userMoviesData) {
    if (movie.liked) {
      const genres = parseJsonSafely<string[]>(movie.genres, []);
      for (const genre of genres) {
        preferences.favoriteGenres[genre] = (preferences.favoriteGenres[genre] || 0) + 3;
      }
      const crew = parseJsonSafely<Array<{ name: string; job: string }>>(movie.crew, []);
      for (const member of crew) {
        if (member.job === "Director") {
          preferences.favoriteDirectors[member.name] = (preferences.favoriteDirectors[member.name] || 0) + 3;
        }
      }
      const cast = parseJsonSafely<Array<{ name: string }>>(movie.cast, []);
      for (const actor of cast.slice(0, 5)) {
        preferences.favoriteActors[actor.name] = (preferences.favoriteActors[actor.name] || 0) + 1;
      }
      if (movie.year) {
        const decade = Math.floor(movie.year / 10) * 10;
        const decadeStr = `${decade}s`;
        preferences.preferredDecades[decadeStr] = (preferences.preferredDecades[decadeStr] || 0) + 1;
      }
    }
    if (movie.watched) {
      const genres = parseJsonSafely<string[]>(movie.genres, []);
      for (const genre of genres) {
        preferences.favoriteGenres[genre] = (preferences.favoriteGenres[genre] || 0) + 1;
      }
    }
  }

  for (const review of userReviews) {
    if (review.rating) {
      totalRating += review.rating;
      ratedCount++;
      if (review.rating >= 4) {
        preferences.highlyRatedMovies.add(review.mediaId || "");
      }
      ratingsSum += review.rating;
      ratingsCount++;
    }
  }

  preferences.averageRating = ratedCount > 0 ? totalRating / ratedCount : 3;
  if (ratingsCount > 0) {
    const avg = ratingsSum / ratingsCount;
    if (avg >= 3.5) {
      preferences.ratingStyle = "generous";
    } else if (avg <= 2.5) {
      preferences.ratingStyle = "critical";
    } else {
      preferences.ratingStyle = "moderate";
    }
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

function normalizeGenre(genre: string): string {
  const normalized = genre.toLowerCase().trim();
  for (const [id, name] of Object.entries(GENRES)) {
    if (name.toLowerCase() === normalized) {
      return name;
    }
    if (id === normalized) {
      return name;
    }
  }
  return genre;
}

function calculateQualityScore(movie: Movie): number {
  let quality = 0;
  if (movie.rating) {
    quality += movie.rating * 2;
    if (movie.rating >= 8) {
      quality += 3;
    } else if (movie.rating >= 7) {
      quality += 1.5;
    } else if (movie.rating < 5) {
      quality -= 2;
    }
  }
  if (movie.voteCount) {
    if (movie.voteCount >= 10000) {
      quality += 3;
    } else if (movie.voteCount >= 1000) {
      quality += 1.5;
    } else if (movie.voteCount >= 100) {
      quality += 0.5;
    } else if (movie.voteCount < MIN_VOTE_COUNT) {
      quality -= 1;
    }
  }
  if (movie.popularity && movie.popularity > 100) {
    quality += 1;
  }
  return quality;
}

function isQualityContent(movie: Movie): boolean {
  if (movie.voteCount !== undefined && movie.voteCount < MIN_VOTE_COUNT) {
    return false;
  }
  if (movie.rating !== undefined && movie.rating < MIN_RATING_THRESHOLD) {
    return false;
  }
  return true;
}

function calculateSimilarityScore(
  movie: Movie,
  preferences: UserPreferences,
  seenIds: Set<string>
): RecommendationScore | null {
  if (seenIds.has(movie.id)) return null;
  if (!isQualityContent(movie)) {
    return null;
  }

  let score = 0;
  const reasons: string[] = [];

  const movieGenres = movie.genre.map(normalizeGenre);
  for (const genre of movieGenres) {
    const genreScore = preferences.favoriteGenres[genre] || 0;
    if (genreScore > 0) {
      score += genreScore;
      reasons.push(`Matches your interest in ${genre}`);
    }
  }

  if (movie.crew) {
    const directors = movie.crew.filter((c) => c.job === "Director");
    for (const director of directors) {
      const directorScore = preferences.favoriteDirectors[director.name] || 0;
      if (directorScore > 0) {
        score += directorScore * 2.5;
        reasons.push(`Directed by ${director.name}`);
      }
    }
  }

  if (movie.cast) {
    for (const actor of movie.cast.slice(0, 5)) {
      const actorScore = preferences.favoriteActors[actor.name] || 0;
      if (actorScore > 0) {
        score += actorScore;
        reasons.push(`Stars ${actor.name}`);
      }
    }
  }

  if (movie.year && movie.year > 1900) {
    const decade = `${Math.floor(movie.year / 10) * 10}s`;
    const decadeScore = preferences.preferredDecades[decade] || 0;
    if (decadeScore > 0) {
      score += decadeScore * 0.5;
      reasons.push(`From the ${decade}`);
    }
  }

  const qualityScore = calculateQualityScore(movie);

  if (preferences.ratingStyle === "critical") {
    if (movie.rating && movie.rating >= 7.5) {
      score += 2;
    } else if (movie.rating && movie.rating >= 6.5) {
      score += 1;
    }
  } else if (preferences.ratingStyle === "generous") {
    if (movie.rating && movie.rating >= preferences.averageRating) {
      score += 1.5;
    }
    if (movie.rating && movie.rating >= 6) {
      score += 1;
    }
  } else {
    if (movie.rating && movie.rating >= preferences.averageRating) {
      score += 1;
    }
  }

  if (movie.rating && movie.rating >= 8) {
    score += 1.5;
  } else if (movie.rating && movie.rating >= 7) {
    score += 0.5;
  }

  if (movie.voteCount && movie.voteCount >= 1000) {
    score += 0.5;
  }

  const combinedScore = score + (qualityScore * 0.3);
  if (combinedScore < 3) return null;

  return {
    movie,
    score: combinedScore,
    reasons: reasons.slice(0, 3),
    qualityScore,
  };
}

export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 12
): Promise<Movie[]> {
  try {
    const [preferences, seenIds] = await Promise.all([
      getUserPreferences(userId),
      getSeenMovieIds(userId),
    ]);

    const topGenres = Object.entries(preferences.favoriteGenres)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    const topDirectors = Object.entries(preferences.favoriteDirectors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([director]) => director);

    if (topGenres.length === 0) {
      return [];
    }

    const searchQueries: string[] = [];
    for (const genre of topGenres.slice(0, 2)) {
      searchQueries.push(genre);
    }
    for (const director of topDirectors) {
      searchQueries.push(`directed by ${director}`);
    }

    const searchPromises = searchQueries.slice(0, 5).map(async (query) => {
      try {
        return await searchMoviesOnly(query);
      } catch (error) {
        console.error(`Error searching for "${query}":`, error);
        return [];
      }
    });

    const searchResults = await Promise.all(searchPromises);
    const candidates = searchResults.flat();

    const scoredMovies = candidates
      .filter((movie) => !seenIds.has(movie.id))
      .map((movie) => calculateSimilarityScore(movie, preferences, seenIds))
      .filter((item): item is RecommendationScore => item !== null);

    scoredMovies.sort((a, b) => b.score - a.score);

    const uniqueMovies = new Map<string, Movie>();
    for (const item of scoredMovies) {
      if (!uniqueMovies.has(item.movie.id)) {
        uniqueMovies.set(item.movie.id, item.movie);
      }
      if (uniqueMovies.size >= limit) break;
    }

    const result = Array.from(uniqueMovies.values());

    if (result.length < limit) {
      const highlyRated = await getHighlyRatedMovies();
      for (const movie of highlyRated) {
        if (!seenIds.has(movie.id) && !uniqueMovies.has(movie.id)) {
          uniqueMovies.set(movie.id, movie);
        }
        if (uniqueMovies.size >= limit) break;
      }
    }

    return Array.from(uniqueMovies.values());
  } catch (error) {
    console.error("Error getting personalized recommendations:", error);
    return [];
  }
}

export async function getBecauseYouLikedRecommendations(
  userId: string,
  likedMovieId: string,
  limit: number = 6
): Promise<Movie[]> {
  try {
    const [seenIds, likedMovie] = await Promise.all([
      getSeenMovieIds(userId),
      getMediaById(likedMovieId, "movie"),
    ]);

    if (!likedMovie) return [];

    const similarGenres = likedMovie.genre.slice(0, 2);
    const director = likedMovie.crew?.find((c) => c.job === "Director");
    const topActors = likedMovie.cast?.slice(0, 3).map((a) => a.name) || [];

    const searchQueries: string[] = [];
    for (const genre of similarGenres) {
      searchQueries.push(genre);
    }
    if (director) {
      searchQueries.push(`directed by ${director.name}`);
    }
    for (const actor of topActors.slice(0, 2)) {
      searchQueries.push(`starring ${actor}`);
    }

    const searchPromises = searchQueries.slice(0, 4).map(async (query) => {
      try {
        return await searchMoviesOnly(query);
      } catch (error) {
        console.error(`Error searching for "${query}":`, error);
        return [];
      }
    });

    const searchResults = await Promise.all(searchPromises);
    const candidates = searchResults.flat();

    const scoredMovies = candidates
      .filter((movie) => movie.id !== likedMovieId && !seenIds.has(movie.id))
      .filter(isQualityContent)
      .map((movie) => {
        let score = 0;
        for (const genre of movie.genre) {
          if (similarGenres.includes(genre)) {
            score += 3;
          }
        }
        if (director && movie.crew?.some((c) => c.job === "Director" && c.name === director.name)) {
          score += 6;
        }
        for (const actor of movie.cast?.slice(0, 3).map((a) => a.name) || []) {
          if (topActors.includes(actor)) {
            score += 2;
          }
        }
        if (movie.rating && movie.rating >= 7) {
          score += 2;
        } else if (movie.rating && movie.rating >= 6) {
          score += 1;
        }
        if (movie.voteCount && movie.voteCount >= 5000) {
          score += 1.5;
        } else if (movie.voteCount && movie.voteCount >= 1000) {
          score += 0.5;
        }
        const qualityBonus = calculateQualityScore(movie) * 0.3;
        score += qualityBonus;
        return { movie, score };
      })
      .filter((item) => item.score >= 4)
      .sort((a, b) => b.score - a.score);

    const uniqueMovies = new Map<string, Movie>();
    for (const item of scoredMovies) {
      if (!uniqueMovies.has(item.movie.id)) {
        uniqueMovies.set(item.movie.id, item.movie);
      }
      if (uniqueMovies.size >= limit) break;
    }

    const result = Array.from(uniqueMovies.values());

    if (result.length < limit) {
      const highlyRated = await getHighlyRatedMovies();
      for (const movie of highlyRated) {
        if (movie.id !== likedMovieId && !seenIds.has(movie.id) && !uniqueMovies.has(movie.id)) {
          uniqueMovies.set(movie.id, movie);
        }
        if (uniqueMovies.size >= limit) break;
      }
    }

    return Array.from(uniqueMovies.values());
  } catch (error) {
    console.error("Error getting because you liked recommendations:", error);
    return [];
  }
}

export async function getDiscoveryContent(userId: string): Promise<{
  personalized: Movie[];
  trending: Movie[];
  highlyRated: Movie[];
}> {
  try {
    const [personalized, trending, highlyRated] = await Promise.all([
      getPersonalizedRecommendations(userId, 12),
      getTrendingMovies(),
      getHighlyRatedMovies(),
    ]);
    return { personalized, trending, highlyRated };
  } catch (error) {
    console.error("Error getting discovery content:", error);
    return {
      personalized: [],
      trending: [],
      highlyRated: [],
    };
  }
}

interface TMDBMovieResult {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity?: number;
  genre_ids?: number[];
  overview?: string;
}

function mapTmdbResultToMovie(item: TMDBMovieResult, mediaType: "movie" | "tv"): Movie {
  const title = item.title || item.name || "Unknown Title";
  const date = item.release_date || item.first_air_date || "";
  const year = date ? new Date(date).getFullYear() : 0;

  const genreList = item.genre_ids
    ? item.genre_ids.map((id) => GENRES[id]).filter(Boolean)
    : [];

  return {
    id: item.id.toString(),
    title,
    year,
    releaseDate: date,
    posterUrl: item.poster_path
      ? `${TMDB_IMAGE_BASE_URL_W500}${item.poster_path}`
      : "/placeholder.jpg",
    backdropUrl: item.backdrop_path
      ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
      : undefined,
    rating: typeof item.vote_average === "number" ? Number(item.vote_average.toFixed(1)) : undefined,
    voteCount: item.vote_count,
    popularity: item.popularity,
    genre: genreList.slice(0, 3),
    overview: item.overview,
    mediaType,
    watched: false,
    liked: false,
    watchlist: false,
  };
}

async function getHighlyRatedMovies(): Promise<Movie[]> {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return [];

    const data = await fetch(
      `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&language=en-US&page=1`,
      { next: { revalidate: 3600 } }
    );
    const json = await data.json();
    if (!json.results) return [];

    return json.results
      .filter((item: TMDBMovieResult) => item.vote_count >= MIN_VOTE_COUNT)
      .slice(0, 20)
      .map((item: TMDBMovieResult) => mapTmdbResultToMovie(item, "movie"));
  } catch {
    return [];
  }
}

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
    const userMoviesData = await db
      .select({ genres: userMovies.genres })
      .from(userMovies)
      .where(and(eq(userMovies.userId, userId), eq(userMovies.liked, true)));

    const genreCounts: Record<string, number> = {};

    for (const movie of userMoviesData) {
      if (movie.genres) {
        try {
          const genres = JSON.parse(movie.genres as string) as string[];
          for (const genre of genres) {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          }
        } catch { }
      }
    }

    const topGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    const genreToMood: Record<string, MoodKey[]> = {
      "Horror": ["dark-intense"],
      "Crime": ["dark-intense", "mind-bending"],
      "War": ["dark-intense", "thought-provoking"],
      "Science Fiction": ["mind-bending", "thought-provoking"],
      "Mystery": ["mind-bending", "classic"],
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
      "Film-Noir": ["classic"],
    };

    const moodScores: Record<MoodKey, number> = {
      "uplifting": 0,
      "mind-bending": 0,
      "dark-intense": 0,
      "feel-good": 0,
      "adrenaline": 0,
      "thought-provoking": 0,
      "classic": 0,
    };

    for (const genre of topGenres) {
      const possibleMoods = genreToMood[genre] || [];
      for (const mood of possibleMoods) {
        moodScores[mood]++;
      }
    }

    const bestMood = Object.entries(moodScores)
      .sort(([, a], [, b]) => b - a)[0][0] as MoodKey;

    return bestMood || "uplifting";
  } catch (error) {
    console.error("Error getting default mood:", error);
    return "uplifting";
  }
}

const GENRE_NAME_TO_ID: Record<string, number> = {
  "Action": 28,
  "Adventure": 12,
  "Animation": 16,
  "Comedy": 35,
  "Crime": 80,
  "Documentary": 99,
  "Drama": 18,
  "Family": 10762,
  "Fantasy": 14,
  "History": 36,
  "Horror": 27,
  "Music": 10402,
  "Mystery": 9648,
  "Romance": 10749,
  "Science Fiction": 878,
  "Thriller": 53,
  "War": 10752,
  "Western": 37,
};

function getGenreCombinationsForMood(mood: MoodKey): string[][] {
  const combinations: Record<MoodKey, string[][]> = {
    "uplifting": [
      ["Comedy", "Romance"],
      ["Comedy", "Family"],
      ["Animation", "Family"],
      ["Romance", "Family"],
    ],
    "mind-bending": [
      ["Science Fiction", "Mystery"],
      ["Science Fiction", "Thriller"],
      ["Mystery", "Thriller"],
      ["Science Fiction", "Mystery", "Thriller"],
    ],
    "dark-intense": [
      ["Horror", "Thriller"],
      ["Crime", "Mystery"],
      ["Horror", "Crime", "Thriller"],
      ["Thriller", "Crime"],
    ],
    "feel-good": [
      ["Comedy", "Romance"],
      ["Family", "Comedy"],
      ["Animation", "Comedy"],
      ["Romance", "Comedy", "Family"],
    ],
    "adrenaline": [
      ["Action", "Thriller"],
      ["Action", "Adventure"],
      ["Adventure", "Action"],
      ["Action", "Thriller"],
    ],
    "thought-provoking": [
      ["Documentary", "Drama"],
      ["Drama", "History"],
      ["Drama"],
      ["Documentary", "Drama", "History"],
    ],
    "classic": [
      ["Drama", "Film-Noir"],
      ["Drama"],
      ["Drama", "Film-Noir"],
    ],
  };

  return combinations[mood] || [];
}

async function getPopularMovies(): Promise<Movie[]> {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return [];

    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;
    const response = await fetch(url, { next: { revalidate: 120 } });
    if (!response.ok) return [];

    const json = await response.json();
    if (!json.results) return [];

    return json.results
      .slice(0, 50)
      .map((item: TMDBMovieResult) => mapTmdbResultToMovie(item, "movie"));
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    return [];
  }
}

export async function getMoodRecommendations(
  userId: string,
  mood: MoodKey,
  limit: number = 24
): Promise<Movie[]> {
  try {
    const seenIds = await getSeenMovieIds(userId);
    const genreFilters = MOOD_MAP[mood] || [];
    if (genreFilters.length === 0) {
      return [];
    }

    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return [];

    const allCandidates: Movie[] = [];
    const moodCombinations = getGenreCombinationsForMood(mood);

    const fetchPromises = moodCombinations.map(async (combination) => {
      try {
        const genreIds = combination.map((g) => GENRE_NAME_TO_ID[g])
          .filter((id): id is number => id !== undefined);
        if (genreIds.length === 0) return [];

        const genreParam = genreIds.join(",");
        const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&include_adult=false&page=1&with_genres=${genreParam}&vote_count.gte=100`;
        const response = await fetch(url, { next: { revalidate: 60 } });
        if (!response.ok) return [];

        const json = await response.json();
        if (!json.results) return [];

        return json.results
          .slice(0, 30)
          .map((item: TMDBMovieResult) => mapTmdbResultToMovie(item, "movie"));
      } catch (error) {
        console.error(`Error fetching mood combination ${combination.join("+")}:`, error);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    for (const movies of results) {
      allCandidates.push(...movies);
    }

    const uniqueMovies = new Map<string, Movie>();
    for (const movie of allCandidates) {
      if (seenIds.has(movie.id)) continue;
      if (!uniqueMovies.has(movie.id)) {
        uniqueMovies.set(movie.id, movie);
      }
      if (uniqueMovies.size >= limit) break;
    }

    const result = Array.from(uniqueMovies.values());

    if (result.length < limit / 2) {
      const popularMovies = await getPopularMovies();
      for (const movie of popularMovies) {
        if (!seenIds.has(movie.id) && !uniqueMovies.has(movie.id)) {
          const matchingGenres = movie.genre.filter((g) => genreFilters.includes(g));
          if (matchingGenres.length > 0) {
            uniqueMovies.set(movie.id, movie);
          }
          if (uniqueMovies.size >= limit) break;
        }
      }
    }

    return Array.from(uniqueMovies.values());
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
    const [seenIds, highlyRated, popularMovies] = await Promise.all([
      getSeenMovieIds(userId),
      getHighlyRatedMovies(),
      getPopularMovies(),
    ]);

    const uniqueMovies = new Map<string, Movie>();

    for (const movie of [...highlyRated, ...popularMovies]) {
      if (seenIds.has(movie.id)) continue;
      if (!uniqueMovies.has(movie.id)) {
        uniqueMovies.set(movie.id, movie);
      }
      if (uniqueMovies.size >= limit) break;
    }

    return Array.from(uniqueMovies.values());
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

    const topGenres = Object.entries(preferences.favoriteGenres)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    const baseParams = {
      "vote_average.gte": "7.0",
      "vote_count.gte": "100",
      "vote_count.lte": "3000",
      "sort_by": "popularity.desc",
      "include_adult": "false",
      "page": "1",
    };

    const moviePromises: Promise<Movie[]>[] = [];

    moviePromises.push(discoverMovies(baseParams));

    for (const genreName of topGenres) {
      const genreId = GENRE_NAME_TO_ID[genreName];
      if (genreId) {
        moviePromises.push(
          discoverMovies({
            ...baseParams,
            with_genres: genreId.toString(),
          })
        );
      }
    }

    moviePromises.push(
      discoverTv({
        ...baseParams,
        page: "1",
      })
    );

    const allResults = await Promise.all(moviePromises);
    const candidates = allResults.flat();

    const uniqueMovies = new Map<string, Movie>();

    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    for (const movie of shuffled) {
      if (seenIds.has(movie.id)) continue;
      if (!uniqueMovies.has(movie.id)) {
        uniqueMovies.set(movie.id, movie);
      }
      if (uniqueMovies.size >= limit) break;
    }

    return Array.from(uniqueMovies.values());
  } catch (error) {
    console.error("Error getting hidden gems:", error);
    return [];
  }
}
