import { db } from "@/db";
import { userRecommendations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Movie } from "@/types";
import {
  getPersonalizedRecommendations,
  getMoodRecommendations,
  getExplorationRecommendations,
  getHiddenGems,
  getDefaultMood,
} from "./recommendations";
import { MOOD_IDS } from "./constants";

// Cache TTL: 1 hour (recommendations are regenerated after user actions anyway)
const CACHE_TTL_MS = 60 * 60 * 1000;

export interface CachedRecommendations {
  personalized: Movie[];
  exploration: Movie[];
  hiddenGems: Movie[];
  moods: Record<string, Movie[]>;
  defaultMood: string;
  updatedAt: Date;
  isStale: boolean;
}

/**
 * Get cached recommendations for a user
 * Returns null if no cache exists or cache is too old
 */
export async function getCachedRecommendations(
  userId: string
): Promise<CachedRecommendations | null> {
  try {
    const [cached] = await db
      .select()
      .from(userRecommendations)
      .where(eq(userRecommendations.userId, userId))
      .limit(1);

    if (!cached) return null;

    // Check if cache is too old (beyond TTL)
    const cacheAge = Date.now() - (cached.updatedAt?.getTime() || 0);
    if (cacheAge > CACHE_TTL_MS) {
      // Mark as stale but still return it (stale-while-revalidate pattern)
      if (!cached.isStale) {
        await markRecommendationsStale(userId);
      }
    }

    return {
      personalized: (cached.personalized as Movie[]) || [],
      exploration: (cached.exploration as Movie[]) || [],
      hiddenGems: (cached.hiddenGems as Movie[]) || [],
      moods: (cached.moods as Record<string, Movie[]>) || {},
      defaultMood: cached.defaultMood || "uplifting",
      updatedAt: cached.updatedAt || new Date(),
      isStale: cached.isStale || cacheAge > CACHE_TTL_MS,
    };
  } catch (error) {
    console.error("Error getting cached recommendations:", error);
    return null;
  }
}

/**
 * Generate and cache all recommendations for a user
 * This is the heavy operation that should run in background
 */
export async function generateAndCacheRecommendations(
  userId: string
): Promise<CachedRecommendations> {
  console.log(`[RecommendationCache] Generating recommendations for user ${userId}`);
  const startTime = Date.now();

  try {
    // Generate all recommendations in parallel
    const [personalized, exploration, hiddenGems, defaultMood] = await Promise.all([
      getPersonalizedRecommendations(userId, 12),
      getExplorationRecommendations(userId, 12),
      getHiddenGems(userId, 12),
      getDefaultMood(userId),
    ]);

    // Generate mood recommendations for all moods in parallel
    const moodResults = await Promise.all(
      MOOD_IDS.map(async (moodId) => {
        try {
          const movies = await getMoodRecommendations(userId, moodId, 12);
          return { id: moodId, movies };
        } catch {
          return { id: moodId, movies: [] };
        }
      })
    );

    const moods: Record<string, Movie[]> = {};
    for (const result of moodResults) {
      if (result.movies.length > 0) {
        moods[result.id] = result.movies;
      }
    }

    const now = new Date();

    // Upsert the cached recommendations
    await db
      .insert(userRecommendations)
      .values({
        userId,
        personalized,
        exploration,
        hiddenGems,
        moods,
        defaultMood,
        updatedAt: now,
        isStale: false,
      })
      .onConflictDoUpdate({
        target: userRecommendations.userId,
        set: {
          personalized,
          exploration,
          hiddenGems,
          moods,
          defaultMood,
          updatedAt: now,
          isStale: false,
        },
      });

    const duration = Date.now() - startTime;
    console.log(`[RecommendationCache] Generated in ${duration}ms for user ${userId}`);

    return {
      personalized,
      exploration,
      hiddenGems,
      moods,
      defaultMood,
      updatedAt: now,
      isStale: false,
    };
  } catch (error) {
    console.error("Error generating recommendations:", error);
    throw error;
  }
}

/**
 * Mark recommendations as stale (needs refresh)
 * Called when user watches/likes/adds to watchlist
 */
export async function markRecommendationsStale(userId: string): Promise<void> {
  try {
    await db
      .update(userRecommendations)
      .set({ isStale: true })
      .where(eq(userRecommendations.userId, userId));
  } catch (error) {
    console.error("Error marking recommendations stale:", error);
  }
}

/**
 * Delete cached recommendations for a user
 */
export async function invalidateRecommendations(userId: string): Promise<void> {
  try {
    await db
      .delete(userRecommendations)
      .where(eq(userRecommendations.userId, userId));
  } catch (error) {
    console.error("Error invalidating recommendations:", error);
  }
}

/**
 * Get recommendations with stale-while-revalidate pattern
 * Returns cached data immediately, triggers background refresh if stale
 */
export async function getRecommendationsWithSWR(
  userId: string
): Promise<CachedRecommendations> {
  const cached = await getCachedRecommendations(userId);

  if (cached && !cached.isStale) {
    // Cache is fresh, return it
    return cached;
  }

  if (cached && cached.isStale) {
    // Cache exists but is stale - return it and trigger background refresh
    // Don't await - let it run in background
    generateAndCacheRecommendations(userId).catch((err) => {
      console.error("Background recommendation refresh failed:", err);
    });
    return cached;
  }

  // No cache exists - generate synchronously (first time)
  return generateAndCacheRecommendations(userId);
}

/**
 * Get a specific mood's recommendations from cache
 */
export async function getCachedMoodRecommendations(
  userId: string,
  moodId: string
): Promise<{ movies: Movie[]; fromCache: boolean }> {
  const cached = await getCachedRecommendations(userId);

  if (cached?.moods?.[moodId]?.length) {
    return { movies: cached.moods[moodId], fromCache: true };
  }

  // Not in cache, generate just this mood
  try {
    const movies = await getMoodRecommendations(userId, moodId, 12);

    // Update just this mood in the cache (if cache exists)
    if (cached) {
      const updatedMoods = { ...cached.moods, [moodId]: movies };
      await db
        .update(userRecommendations)
        .set({ moods: updatedMoods })
        .where(eq(userRecommendations.userId, userId));
    }

    return { movies, fromCache: false };
  } catch (error) {
    console.error(`Error getting mood recommendations for ${moodId}:`, error);
    return { movies: [], fromCache: false };
  }
}
