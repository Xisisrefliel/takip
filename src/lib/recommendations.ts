import { db } from "@/db";
import { userMovies } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Movie } from "@/types";
import {
  discoverMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  discoverMoviesByGenres,
} from "./tmdb";
import { GENRE_IDS } from "./constants";

// ==========================================
// User Data Helpers
// ==========================================

export async function getSeenMovieIds(userId: string): Promise<Set<string>> {
  const userMoviesData = await db
    .select({ movieId: userMovies.movieId })
    .from(userMovies)
    .where(eq(userMovies.userId, userId));
  return new Set(userMoviesData.map((m) => m.movieId));
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

// ==========================================
// TMDB-Based Discovery Functions
// ==========================================

/**
 * Filter out movies the user has already seen
 */
function filterSeenMovies(movies: Movie[], seenIds: Set<string>): Movie[] {
  return movies.filter((m) => !seenIds.has(m.id));
}

/**
 * Get popular movies from TMDB, filtered for user
 */
export async function getPopularMovies(
  userId: string | null,
  limit: number = 20
): Promise<Movie[]> {
  try {
    const movies = await discoverMovies({
      sort_by: "popularity.desc",
      "vote_count.gte": "100",
    });

    if (!userId) return movies.slice(0, limit);

    const seenIds = await getSeenMovieIds(userId);
    return filterSeenMovies(movies, seenIds).slice(0, limit);
  } catch (error) {
    console.error("Error getting popular movies:", error);
    return [];
  }
}

/**
 * Get top rated movies from TMDB, filtered for user
 */
export async function getTopRatedMovies(
  userId: string | null,
  limit: number = 20
): Promise<Movie[]> {
  try {
    const movies = await discoverMovies({
      sort_by: "vote_average.desc",
      "vote_count.gte": "500",
    });

    if (!userId) return movies.slice(0, limit);

    const seenIds = await getSeenMovieIds(userId);
    return filterSeenMovies(movies, seenIds).slice(0, limit);
  } catch (error) {
    console.error("Error getting top rated movies:", error);
    return [];
  }
}

/**
 * Get now playing movies from TMDB, filtered for user
 */
export async function getNowPlaying(
  userId: string | null,
  limit: number = 20
): Promise<Movie[]> {
  try {
    const movies = await getNowPlayingMovies();

    if (!userId) return movies.slice(0, limit);

    const seenIds = await getSeenMovieIds(userId);
    return filterSeenMovies(movies, seenIds).slice(0, limit);
  } catch (error) {
    console.error("Error getting now playing movies:", error);
    return [];
  }
}

/**
 * Get upcoming movies from TMDB, filtered for user
 */
export async function getUpcoming(
  userId: string | null,
  limit: number = 20
): Promise<Movie[]> {
  try {
    const movies = await getUpcomingMovies();

    if (!userId) return movies.slice(0, limit);

    const seenIds = await getSeenMovieIds(userId);
    return filterSeenMovies(movies, seenIds).slice(0, limit);
  } catch (error) {
    console.error("Error getting upcoming movies:", error);
    return [];
  }
}

/**
 * Get movies by genre from TMDB, filtered for user
 */
export async function getMoviesByGenre(
  genreName: string,
  userId: string | null,
  limit: number = 20
): Promise<Movie[]> {
  try {
    const genreId = GENRE_IDS[genreName];
    if (!genreId) return [];

    const movies = await discoverMoviesByGenres([genreId], {
      minVotes: 100,
      sortBy: "popularity.desc",
    });

    if (!userId) return movies.slice(0, limit);

    const seenIds = await getSeenMovieIds(userId);
    return filterSeenMovies(movies, seenIds).slice(0, limit);
  } catch (error) {
    console.error(`Error getting ${genreName} movies:`, error);
    return [];
  }
}

/**
 * Get critically acclaimed movies (high rating, decent vote count)
 */
export async function getCriticallyAcclaimed(
  userId: string | null,
  limit: number = 20
): Promise<Movie[]> {
  try {
    const movies = await discoverMovies({
      sort_by: "vote_average.desc",
      "vote_count.gte": "1000",
      "vote_average.gte": "7.5",
    });

    if (!userId) return movies.slice(0, limit);

    const seenIds = await getSeenMovieIds(userId);
    return filterSeenMovies(movies, seenIds).slice(0, limit);
  } catch (error) {
    console.error("Error getting critically acclaimed movies:", error);
    return [];
  }
}

/**
 * Get hidden gems (high rating but lower vote count)
 */
export async function getHiddenGems(
  userId: string | null,
  limit: number = 20
): Promise<Movie[]> {
  try {
    const movies = await discoverMovies({
      sort_by: "vote_average.desc",
      "vote_count.gte": "100",
      "vote_count.lte": "1000",
      "vote_average.gte": "7.0",
    });

    if (!userId) return movies.slice(0, limit);

    const seenIds = await getSeenMovieIds(userId);
    return filterSeenMovies(movies, seenIds).slice(0, limit);
  } catch (error) {
    console.error("Error getting hidden gems:", error);
    return [];
  }
}

/**
 * Get classic movies (older but highly rated)
 */
export async function getClassicMovies(
  userId: string | null,
  limit: number = 20
): Promise<Movie[]> {
  try {
    const movies = await discoverMovies({
      sort_by: "vote_average.desc",
      "vote_count.gte": "500",
      "vote_average.gte": "7.5",
      "primary_release_date.lte": "2000-12-31",
    });

    if (!userId) return movies.slice(0, limit);

    const seenIds = await getSeenMovieIds(userId);
    return filterSeenMovies(movies, seenIds).slice(0, limit);
  } catch (error) {
    console.error("Error getting classic movies:", error);
    return [];
  }
}

/**
 * Get recent releases (last 2 years, well-rated)
 */
export async function getRecentReleases(
  userId: string | null,
  limit: number = 20
): Promise<Movie[]> {
  try {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const dateStr = twoYearsAgo.toISOString().split("T")[0];

    const movies = await discoverMovies({
      sort_by: "popularity.desc",
      "vote_count.gte": "100",
      "vote_average.gte": "6.5",
      "primary_release_date.gte": dateStr,
    });

    if (!userId) return movies.slice(0, limit);

    const seenIds = await getSeenMovieIds(userId);
    return filterSeenMovies(movies, seenIds).slice(0, limit);
  } catch (error) {
    console.error("Error getting recent releases:", error);
    return [];
  }
}
