"use server";

import { auth } from "@/auth";
import { getStatsWithCache } from "@/lib/stats-cache";

export type YearStat = { year: number; count: number; runtimeMinutes: number };
export type GenreStat = { name: string; count: number };
export type FavoriteStat = { id: string; title: string; posterUrl?: string | null; year?: number | null; rating?: number | null };
export type RecentStat = { id: string; title: string; posterUrl?: string | null; watchedDate?: string; year?: number | null };
export type DecadeStat = { decade: string; count: number };
export type PeopleStat = { id: number; name: string; count: number; profilePath?: string };
export type RatingStat = { rating: number; count: number };

export type StatsData = {
  totals?: {
    watchedCount: number;
    likedCount: number;
    watchlistCount: number;
    totalRuntimeMinutes: number;
  };
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

export async function getStatsData(): Promise<StatsData> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    return await getStatsWithCache(session.user.id);
  } catch (error) {
    console.error("Get stats data error:", error);
    return { error: "Failed to compute stats" };
  }
}
