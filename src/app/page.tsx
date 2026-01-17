import { getTrendingMovies, getPopularSeries } from "@/lib/tmdb";
import { HomePage } from "@/components/HomePage";
import { enrichMoviesWithUserStatusBatch } from "@/app/actions";
import { auth } from "@/auth";
import { getRecommendationsWithSWR } from "@/lib/recommendation-cache";
import { getWatchedCount } from "@/lib/recommendations";

// Revalidate homepage every hour for fresh trending content
export const revalidate = 3600;

export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id;
  const isAuthenticated = !!userId;

  // Fetch all data in parallel
  const [trendingMovies, popularSeries, cachedRecommendations, watchedCount] = await Promise.all([
    getTrendingMovies(),
    getPopularSeries(),
    // Get pre-computed recommendations from cache (instant if cached)
    isAuthenticated && userId
      ? getRecommendationsWithSWR(userId).catch((error) => {
          console.error("Error fetching cached recommendations:", error);
          return null;
        })
      : null,
    // Watched count is a simple query, keep it separate
    isAuthenticated && userId
      ? getWatchedCount(userId).catch(() => 0)
      : 0,
  ]);

  const recommendations = cachedRecommendations?.personalized ?? [];
  const exploration = cachedRecommendations?.exploration ?? [];
  const hiddenGems = cachedRecommendations?.hiddenGems ?? [];
  const moods = cachedRecommendations?.moods ?? {};
  const defaultMood = cachedRecommendations?.defaultMood ?? "uplifting";

  // Collect all mood movies for batch enrichment
  const moodArrays = Object.entries(moods)
    .filter(([, moodMovies]) => moodMovies && moodMovies.length > 0)
    .map(([, moodMovies]) => moodMovies);

  // Single batch call to enrich all movie arrays (1 auth check, 1 DB query)
  const enrichedArrays = await enrichMoviesWithUserStatusBatch(
    trendingMovies,
    popularSeries,
    recommendations,
    exploration,
    hiddenGems,
    ...moodArrays
  );

  const [
    enrichedTrendingMovies,
    enrichedPopularSeries,
    enrichedRecommendations,
    enrichedExploration,
    enrichedHiddenGems,
    ...enrichedMoodArrays
  ] = enrichedArrays;

  // Map enriched mood arrays back to their mood IDs
  const enrichedMoods: Record<string, typeof enrichedRecommendations> = {};
  const moodIds = Object.keys(moods).filter(id => moods[id] && moods[id].length > 0);
  moodIds.forEach((moodId, index) => {
    enrichedMoods[moodId] = enrichedMoodArrays[index];
  });

  return (
    <HomePage
      trendingMovies={enrichedTrendingMovies}
      popularSeries={enrichedPopularSeries}
      recommendedMovies={enrichedRecommendations}
      explorationMovies={enrichedExploration}
      hiddenGemsMovies={enrichedHiddenGems}
      moodMovies={enrichedMoods}
      isAuthenticated={isAuthenticated}
      watchedCount={watchedCount}
      defaultMood={defaultMood}
    />
  );
}
