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

export async function getUserWatchedIds(userId: string): Promise<Set<string>> {
  const userMoviesData = await db
    .select({ movieId: userMovies.movieId })
    .from(userMovies)
    .where(eq(userMovies.userId, userId));
  return new Set(userMoviesData.map((m) => m.movieId));
}

export const getSeenMovieIds = getUserWatchedIds;

export async function getUserLikedGenres(userId: string): Promise<string[]> {
  const likedMoviesData = await db
    .select({ genres: userMovies.genres })
    .from(userMovies)
    .where(and(eq(userMovies.userId, userId), eq(userMovies.liked, true)))
    .catch(() => []);

  const genreCounts = new Map<string, number>();

  for (const row of likedMoviesData) {
    if (!row.genres) continue;
    const genres = JSON.parse(row.genres) as string[];
    for (const genre of genres) {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
    }
  }

  return Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);
}

export function personalizeRecommendations(
  movies: Movie[],
  watchedIds: Set<string>,
  preferredGenres: string[]
): Movie[] {
  const unseen = movies.filter(m => !watchedIds.has(m.id));

  if (preferredGenres.length === 0) {
    return unseen;
  }

  const preferredSet = new Set(preferredGenres.map(g => g.toLowerCase()));

  const scored = unseen.map(movie => {
    let genreBoost = 0;
    for (const genre of movie.genre || []) {
      if (preferredSet.has(genre.toLowerCase())) {
        genreBoost += 1;
      }
    }
    return { movie, genreBoost };
  });

  return scored
    .sort((a, b) => b.genreBoost - a.genreBoost)
    .map(s => s.movie);
}

export async function getWatchedCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(userMovies)
    .where(and(eq(userMovies.userId, userId), eq(userMovies.watched, true)))
    .catch(() => [{ count: 0 }]);
  return result[0]?.count || 0;
}

function filterSeenMovies(movies: Movie[], seenIds: Set<string>): Movie[] {
  return movies.filter((m) => !seenIds.has(m.id));
}

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
