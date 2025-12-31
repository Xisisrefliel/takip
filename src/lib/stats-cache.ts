import { db } from "@/db";
import { userStats, userMovies, reviews } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Totals = {
  watchedCount: number;
  likedCount: number;
  watchlistCount: number;
  totalRuntimeMinutes: number;
};

export type YearStat = { year: number; count: number; runtimeMinutes: number };
export type GenreStat = { name: string; count: number };
export type FavoriteStat = { id: string; title: string; posterUrl?: string | null; year?: number | null; updatedAt?: Date };
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

const EMPTY_STATS: StatsData = {
  totals: { watchedCount: 0, likedCount: 0, watchlistCount: 0, totalRuntimeMinutes: 0 },
  filmsByYear: [],
  genres: [],
  favorites: [],
  recent: [],
  decades: [],
  actors: [],
  directors: [],
  ratings: [],
};

export async function getCachedStats(userId: string): Promise<StatsData | null> {
  try {
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);

    if (!stats) return null;

    return {
      totals: stats.totals as Totals | undefined,
      filmsByYear: stats.filmsByYear as YearStat[] | undefined,
      genres: stats.genres as GenreStat[] | undefined,
      favorites: stats.favorites as FavoriteStat[] | undefined,
      recent: stats.recent as RecentStat[] | undefined,
      decades: stats.decades as DecadeStat[] | undefined,
      actors: stats.actors as PeopleStat[] | undefined,
      directors: stats.directors as PeopleStat[] | undefined,
      ratings: stats.ratings as RatingStat[] | undefined,
    };
  } catch (error) {
    console.error("getCachedStats error:", error);
    return null;
  }
}

export async function initializeUserStats(userId: string, stats?: StatsData): Promise<void> {
  const data = stats || EMPTY_STATS;
  await db.insert(userStats).values({
    userId,
    totals: data.totals || EMPTY_STATS.totals,
    filmsByYear: data.filmsByYear || EMPTY_STATS.filmsByYear,
    genres: data.genres || EMPTY_STATS.genres,
    decades: data.decades || EMPTY_STATS.decades,
    ratings: data.ratings || EMPTY_STATS.ratings,
    actors: data.actors || EMPTY_STATS.actors,
    directors: data.directors || EMPTY_STATS.directors,
    favorites: data.favorites || EMPTY_STATS.favorites,
    recent: data.recent || EMPTY_STATS.recent,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: userStats.userId,
    set: {
      totals: data.totals || EMPTY_STATS.totals,
      filmsByYear: data.filmsByYear || EMPTY_STATS.filmsByYear,
      genres: data.genres || EMPTY_STATS.genres,
      decades: data.decades || EMPTY_STATS.decades,
      ratings: data.ratings || EMPTY_STATS.ratings,
      actors: data.actors || EMPTY_STATS.actors,
      directors: data.directors || EMPTY_STATS.directors,
      favorites: data.favorites || EMPTY_STATS.favorites,
      recent: data.recent || EMPTY_STATS.recent,
      updatedAt: new Date(),
    },
  });
}

export async function invalidateUserStats(userId: string): Promise<void> {
  try {
    await db.delete(userStats).where(eq(userStats.userId, userId));
  } catch (error) {
    console.error("invalidateUserStats error:", error);
  }
}

function toDecade(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

function safeParseGenres(genres: string | null): string[] {
  if (!genres) return [];
  try {
    const parsed = JSON.parse(genres);
    return Array.isArray(parsed) ? parsed.flatMap((g) => (typeof g === "string" ? [g] : [])) : [];
  } catch {
    return [];
  }
}

function safeParseCastCrew(data: string | null): { id: number; name: string; profilePath?: string }[] {
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

interface MovieMetadata {
  id: string;
  movieId: string;
  title: string | null;
  year: number | null;
  runtime: number | null;
  posterUrl: string | null;
  genres: string | null;
  cast: string | null;
  crew: string | null;
  mediaType: string;
  watched: boolean;
  watchedDate: Date | null;
  liked: boolean;
  watchlist: boolean;
  updatedAt: Date;
}

function toMillis(value?: Date | string | null): number {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

export async function computeStatsFromDatabase(userId: string): Promise<StatsData> {
  try {
    const [movies, userRatings] = await Promise.all([
      db.select().from(userMovies).where(eq(userMovies.userId, userId)),
      db.select({ rating: reviews.rating }).from(reviews).where(eq(reviews.userId, userId)),
    ]);

    if (!movies.length) {
      return EMPTY_STATS;
    }

    const watchedMovies = movies.filter((m) => m.watched) as MovieMetadata[];
    const totals: Totals = {
      watchedCount: watchedMovies.length,
      likedCount: movies.filter((m) => m.liked).length,
      watchlistCount: movies.filter((m) => m.watchlist).length,
      totalRuntimeMinutes: watchedMovies.reduce((acc, m) => acc + (m.runtime ?? 0), 0),
    };

    const yearMap = new Map<number, { count: number; runtime: number }>();
    watchedMovies.forEach((m) => {
      const year = m.year || (m.watchedDate ? new Date(m.watchedDate).getFullYear() : null);
      if (!year) return;
      const current = yearMap.get(year) ?? { count: 0, runtime: 0 };
      current.count += 1;
      current.runtime += m.runtime ?? 0;
      yearMap.set(year, current);
    });
    const filmsByYear: YearStat[] = Array.from(yearMap.entries())
      .map(([year, value]) => ({ year, count: value.count, runtimeMinutes: value.runtime }))
      .sort((a, b) => a.year - b.year);

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

    const favorites: FavoriteStat[] = movies
      .filter((m) => m.liked)
      .sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt))
      .slice(0, 16)
      .map((m) => ({
        id: m.movieId,
        title: m.title || `Movie ${m.movieId}`,
        posterUrl: m.posterUrl,
        year: m.year,
        updatedAt: m.updatedAt || undefined,
      }));

    const recent: RecentStat[] = watchedMovies
      .filter((m) => m.watchedDate)
      .sort((a, b) => toMillis(b.watchedDate) - toMillis(a.watchedDate))
      .slice(0, 18)
      .map((m) => ({
        id: m.movieId,
        title: m.title || `Movie ${m.movieId}`,
        posterUrl: m.posterUrl,
        watchedDate: m.watchedDate ? new Date(m.watchedDate).toISOString() : undefined,
        year: m.year,
      }));

    const decadeMap = new Map<string, number>();
    watchedMovies.forEach((m) => {
      const year = m.year || (m.watchedDate ? new Date(m.watchedDate).getFullYear() : null);
      if (!year) return;
      const decade = toDecade(year);
      decadeMap.set(decade, (decadeMap.get(decade) ?? 0) + 1);
    });
    const decades: DecadeStat[] = Array.from(decadeMap.entries())
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const ratingBuckets = new Map<number, number>();
    userRatings.forEach((r) => {
      if (!r.rating) return;
      ratingBuckets.set(r.rating, (ratingBuckets.get(r.rating) ?? 0) + 1);
    });
    const ratings: RatingStat[] = Array.from(ratingBuckets.entries())
      .map(([rating, count]) => ({ rating, count }))
      .sort((a, b) => a.rating - b.rating);

    const actorMap = new Map<number, PeopleStat>();
    const directorMap = new Map<number, PeopleStat>();

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

    movies.forEach((m) => {
      processPeople(safeParseCastCrew(m.cast), safeParseCastCrew(m.crew));
    });

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
    console.error("computeStatsFromDatabase error:", error);
    return { error: "Failed to compute stats" };
  }
}

export async function refreshUserStats(userId: string): Promise<void> {
  const stats = await computeStatsFromDatabase(userId);
  await initializeUserStats(userId, stats);
}

export async function getStatsWithCache(userId: string): Promise<StatsData> {
  const cached = await getCachedStats(userId);
  if (cached) return cached;

  const stats = await computeStatsFromDatabase(userId);
  await initializeUserStats(userId, stats);
  return stats;
}
