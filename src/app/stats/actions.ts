"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { reviews, userMovies } from "@/db/schema";
import { getMediaById } from "@/lib/tmdb";
import { eq } from "drizzle-orm";

type Totals = {
  watchedCount: number;
  likedCount: number;
  watchlistCount: number;
  totalRuntimeMinutes: number;
};

export type YearStat = { year: number; count: number; runtimeMinutes: number };
export type GenreStat = { name: string; count: number };
export type FavoriteStat = { id: string; title: string; posterUrl?: string | null; year?: number | null };
export type RecentStat = { id: string; title: string; posterUrl?: string | null; watchedDate?: string; year?: number | null };
export type DecadeStat = { decade: string; count: number };
export type PeopleStat = { id: number; name: string; count: number; profilePath?: string };
export type RatingStat = { rating: number; count: number };

export type StatsData = {
  totals?: Totals;
  filmsByYear?: YearStat[];
  genres?: GenreStat[];
  favorites?: FavoriteStat[];
  recent?: RecentStat[];
  decades?: DecadeStat[];
  actors?: PeopleStat[];
  directors?: PeopleStat[];
  ratings?: RatingStat[];
  error?: string;
};

const safeParseGenres = (value?: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.flatMap((g) => (typeof g === "string" ? [g] : [])) : [];
  } catch {
    return [];
  }
};

const toMillis = (value?: Date | string | null) => {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
};

const toYear = (entry: typeof userMovies.$inferSelect) => {
  if (entry.year) return entry.year;
  if (entry.watchedDate) {
    const d = entry.watchedDate instanceof Date ? entry.watchedDate : new Date(entry.watchedDate);
    const yr = d.getFullYear();
    return Number.isNaN(yr) ? null : yr;
  }
  return null;
};

export async function getStatsData(): Promise<StatsData> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const [movies, userRatings] = await Promise.all([
      db.select().from(userMovies).where(eq(userMovies.userId, session.user.id)),
      db.select({ rating: reviews.rating }).from(reviews).where(eq(reviews.userId, session.user.id)),
    ]);

    if (!movies.length) {
      return { totals: { watchedCount: 0, likedCount: 0, watchlistCount: 0, totalRuntimeMinutes: 0 } };
    }

    const watchedMovies = movies.filter((m) => m.watched);
    const totals: Totals = {
      watchedCount: watchedMovies.length,
      likedCount: movies.filter((m) => m.liked).length,
      watchlistCount: movies.filter((m) => m.watchlist).length,
      totalRuntimeMinutes: watchedMovies.reduce((acc, m) => acc + (m.runtime ?? 0), 0),
    };

    // Films by year
    const yearMap = new Map<number, { count: number; runtime: number }>();
    watchedMovies.forEach((m) => {
      const year = toYear(m);
      if (!year) return;
      const current = yearMap.get(year) ?? { count: 0, runtime: 0 };
      current.count += 1;
      current.runtime += m.runtime ?? 0;
      yearMap.set(year, current);
    });
    const filmsByYear: YearStat[] = Array.from(yearMap.entries())
      .map(([year, value]) => ({ year, count: value.count, runtimeMinutes: value.runtime }))
      .sort((a, b) => a.year - b.year);

    // Genres
    const genreMap = new Map<string, number>();
    watchedMovies.forEach((m) => {
      safeParseGenres(m.genres).forEach((g) => {
        genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
      });
    });
    const genres: GenreStat[] = Array.from(genreMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 16);

    // Helper to hydrate missing metadata (title/poster/year) from TMDB
    const hydrateMedia = async (movie: typeof userMovies.$inferSelect) => {
      // If we already have everything we need, return fast
      if (movie.title && movie.posterUrl && movie.year) {
        return { title: movie.title, posterUrl: movie.posterUrl, year: movie.year };
      }

      try {
        const media = await getMediaById(movie.movieId, movie.mediaType as "movie" | "tv");
        return {
          title: movie.title ?? media?.title ?? "Untitled",
          posterUrl: movie.posterUrl ?? media?.posterUrl,
          year: movie.year ?? media?.year ?? null,
        };
      } catch {
        return {
          title: movie.title ?? "Untitled",
          posterUrl: movie.posterUrl,
          year: movie.year ?? null,
        };
      }
    };

    // Favorites (liked) - hydrate missing title/poster/year from TMDB when needed
    const favoritesWithMetadata = await Promise.all(
      movies
        .filter((m) => m.liked)
        .sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt))
        .slice(0, 16)
        .map(async (m) => {
          const hydrated = await hydrateMedia(m);
          return {
            id: m.movieId,
            title: hydrated.title,
            posterUrl: hydrated.posterUrl,
            year: hydrated.year,
          };
        })
    );
    const favorites: FavoriteStat[] = favoritesWithMetadata;

    // Recent watched timeline - hydrate missing title/poster/year from TMDB when needed
    const recentWithMetadata = await Promise.all(
      watchedMovies
        .filter((m) => m.watchedDate)
        .sort((a, b) => toMillis(b.watchedDate) - toMillis(a.watchedDate))
        .slice(0, 18)
        .map(async (m) => {
          const hydrated = await hydrateMedia(m);
          return {
            id: m.movieId,
            title: hydrated.title,
            posterUrl: hydrated.posterUrl,
            watchedDate: m.watchedDate ? new Date(m.watchedDate).toISOString() : undefined,
            year: hydrated.year,
          };
        })
    );
    const recent: RecentStat[] = recentWithMetadata;

    // Decades
    const decadeMap = new Map<string, number>();
    watchedMovies.forEach((m) => {
      const year = toYear(m);
      if (!year) return;
      const decade = `${Math.floor(year / 10) * 10}s`;
      decadeMap.set(decade, (decadeMap.get(decade) ?? 0) + 1);
    });
    const decades: DecadeStat[] = Array.from(decadeMap.entries())
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Rating distribution
    const ratingBuckets = new Map<number, number>();
    userRatings.forEach((r) => {
      if (!r.rating) return;
      ratingBuckets.set(r.rating, (ratingBuckets.get(r.rating) ?? 0) + 1);
    });
    const ratings: RatingStat[] = Array.from(ratingBuckets.entries())
      .map(([rating, count]) => ({ rating, count }))
      .sort((a, b) => a.rating - b.rating);

    // People stats (actors/directors)
    const actorMap = new Map<number, PeopleStat>();
    const directorMap = new Map<number, PeopleStat>();

    // Helper to process a movie's cast/crew
    const processPeople = (
      cast: { id: number; name: string; profilePath?: string }[] = [],
      crew: { id: number; name: string; job?: string; profilePath?: string }[] = []
    ) => {
      cast.slice(0, 10).forEach((c) => {
        const current = actorMap.get(c.id) ?? { id: c.id, name: c.name, count: 0, profilePath: c.profilePath };
        current.count += 1;
        if (!current.profilePath && c.profilePath) current.profilePath = c.profilePath;
        actorMap.set(c.id, current);
      });

      crew
        .filter((c) => c.job === "Director")
        .forEach((c) => {
          const current = directorMap.get(c.id) ?? { id: c.id, name: c.name, count: 0, profilePath: c.profilePath };
          current.count += 1;
          if (!current.profilePath && c.profilePath) current.profilePath = c.profilePath;
          directorMap.set(c.id, current);
        });
    };

    const safeParseJSON = <T>(value?: string | null): T[] => {
      if (!value) return [];
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    };

    // 1. Process movies that already have metadata
    const moviesWithMetadata = watchedMovies.filter((m) => m.cast && m.crew);
    moviesWithMetadata.forEach((m) => {
      processPeople(safeParseJSON(m.cast), safeParseJSON(m.crew));
    });

    // 2. For movies without metadata, fetch the most recent ones (up to 20) and backfill
    const moviesMissingMetadata = watchedMovies
      .filter((m) => !m.cast || !m.crew)
      .sort((a, b) => toMillis(b.watchedDate) - toMillis(a.watchedDate));

    if (moviesMissingMetadata.length > 0) {
      const toFetch = moviesMissingMetadata.slice(0, 20); // Limit to avoid timeouts
      
      const fetchedDetails = await Promise.all(
        toFetch.map(async (m) => {
          try {
            const details = await getMediaById(m.movieId, m.mediaType as "movie" | "tv");
            if (details) {
              // Backfill database in background (fire and forget promise, or await if fast enough)
              // We await to ensure stats are correct for this render
              const castJson = JSON.stringify(details.cast || []);
              const crewJson = JSON.stringify(details.crew || []);
              
              await db
                .update(userMovies)
                .set({
                  cast: castJson,
                  crew: crewJson,
                  // Also update other metadata if missing
                  title: m.title ?? details.title,
                  year: m.year ?? details.year,
                  posterUrl: m.posterUrl ?? details.posterUrl,
                  runtime: m.runtime ?? details.runtime,
                  genres: m.genres ?? (details.genre ? JSON.stringify(details.genre) : null),
                })
                .where(eq(userMovies.id, m.id));

              return details;
            }
            return null;
          } catch (e) {
            console.error(`Failed to fetch metadata for ${m.movieId}`, e);
            return null;
          }
        })
      );

      fetchedDetails.forEach((details) => {
        if (details) {
          processPeople(details.cast, details.crew);
        }
      });
    }

    const actors: PeopleStat[] = Array.from(actorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const directors: PeopleStat[] = Array.from(directorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    return {
      totals,
      filmsByYear,
      genres,
      favorites,
      recent,
      decades,
      actors,
      directors,
      ratings,
    };
  } catch (error) {
    console.error("Get stats data error:", error);
    return { error: "Failed to compute stats" };
  }
}
