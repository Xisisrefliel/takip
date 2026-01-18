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
 * Filter out watched movies from recommendations and optionally replace them
 */
async function filterWatchedMovies(
  userId: string,
  movies: Movie[],
  sectionType: 'personalized' | 'exploration' | 'hiddenGems',
  replaceCount?: number
): Promise<Movie[]> {
  const { getSeenMovieIds } = await import("./recommendations");
  const seenIds = await getSeenMovieIds(userId);

  const unwatchedMovies = movies.filter(m => !seenIds.has(m.id));
  const watchedCount = movies.length - unwatchedMovies.length;

  // If no movies were watched, return as-is
  if (watchedCount === 0) {
    return movies;
  }

  console.log(`[RecommendationCache] Found ${watchedCount} watched movies in ${sectionType}`);

  // If we don't need replacements or don't have a count, just return filtered
  if (!replaceCount || replaceCount === 0) {
    return unwatchedMovies;
  }

  // Try to fetch replacements
  try {
    const {
      getPersonalizedRecommendations,
      getExplorationRecommendations,
      getHiddenGems
    } = await import("./recommendations");

    let candidates: Movie[] = [];
    const fetchCount = Math.min(replaceCount, watchedCount) * 2; // Fetch extra to ensure we get enough

    switch (sectionType) {
      case 'personalized':
        candidates = await getPersonalizedRecommendations(userId, fetchCount);
        break;
      case 'exploration':
        candidates = await getExplorationRecommendations(userId, fetchCount);
        break;
      case 'hiddenGems':
        candidates = await getHiddenGems(userId, fetchCount);
        break;
    }

    // Filter candidates to exclude already displayed and watched movies
    const existingIds = new Set(unwatchedMovies.map(m => m.id));
    const replacements = candidates
      .filter(m => !seenIds.has(m.id) && !existingIds.has(m.id))
      .slice(0, replaceCount);

    if (replacements.length > 0) {
      console.log(`[RecommendationCache] Replacing ${replacements.length} movies in ${sectionType}`);
      return [...unwatchedMovies, ...replacements];
    }
  } catch (error) {
    console.error(`Error fetching replacements for ${sectionType}:`, error);
  }

  return unwatchedMovies;
}

/**
 * Get recommendations with stale-while-revalidate pattern
 * Returns cached data immediately, triggers background refresh if stale
 * Automatically filters out watched movies and replaces them
 */
export async function getRecommendationsWithSWR(
  userId: string
): Promise<CachedRecommendations> {
  const cached = await getCachedRecommendations(userId);

  if (cached && !cached.isStale) {
    // Cache is fresh, but check for watched movies and replace them
    const [personalizedFiltered, explorationFiltered, hiddenGemsFiltered] = await Promise.all([
      filterWatchedMovies(userId, cached.personalized, 'personalized', 3),
      filterWatchedMovies(userId, cached.exploration, 'exploration', 2),
      filterWatchedMovies(userId, cached.hiddenGems, 'hiddenGems', 2),
    ]);

    // Update cache if any movies were replaced
    const hasChanges =
      personalizedFiltered.length !== cached.personalized.length ||
      explorationFiltered.length !== cached.exploration.length ||
      hiddenGemsFiltered.length !== cached.hiddenGems.length;

    if (hasChanges) {
      await db
        .update(userRecommendations)
        .set({
          personalized: personalizedFiltered,
          exploration: explorationFiltered,
          hiddenGems: hiddenGemsFiltered,
        })
        .where(eq(userRecommendations.userId, userId));

      return {
        ...cached,
        personalized: personalizedFiltered,
        exploration: explorationFiltered,
        hiddenGems: hiddenGemsFiltered,
      };
    }

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
 * Automatically replaces watched movies with new recommendations
 */
export async function getCachedMoodRecommendations(
  userId: string,
  moodId: string
): Promise<{ movies: Movie[]; fromCache: boolean }> {
  const cached = await getCachedRecommendations(userId);

  if (cached?.moods?.[moodId]?.length) {
    const cachedMovies = cached.moods[moodId];

    // Check if any cached movies have been watched since caching
    const { getSeenMovieIds, getMoodRecommendations } = await import("./recommendations");
    const seenIds = await getSeenMovieIds(userId);

    const watchedMovies = cachedMovies.filter(m => seenIds.has(m.id));

    // If some movies have been watched, replace them
    if (watchedMovies.length > 0) {
      console.log(`[MoodCache] Replacing ${watchedMovies.length} watched movies in ${moodId} mood`);

      try {
        // Get current movie IDs (excluding watched ones)
        const remainingMovies = cachedMovies.filter(m => !seenIds.has(m.id));
        const excludeIds = remainingMovies.map(m => m.id);

        // Fetch fresh recommendations to find replacements
        const freshCandidates = await getMoodRecommendations(userId, moodId, 20);

        // Find movies that aren't in our current list and aren't watched
        const replacements = freshCandidates
          .filter(m => !seenIds.has(m.id) && !excludeIds.includes(m.id))
          .slice(0, watchedMovies.length);

        if (replacements.length > 0) {
          // Combine remaining + replacements
          const updatedMovies = [...remainingMovies, ...replacements];

          // Update cache
          const updatedMoods = { ...cached.moods, [moodId]: updatedMovies };
          await db
            .update(userRecommendations)
            .set({ moods: updatedMoods })
            .where(eq(userRecommendations.userId, userId));

          console.log(`[MoodCache] Replaced ${replacements.length} movies in ${moodId} mood`);
          return { movies: updatedMovies, fromCache: true };
        }
      } catch (error) {
        console.error(`Error replacing watched movies in ${moodId}:`, error);
        // Fall through to return original cache
      }
    }

    return { movies: cachedMovies, fromCache: true };
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
