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
  const defaultMood = cachedRecommendations?.defaultMood ?? "uplifting";

  // Single batch call to enrich all movie arrays (1 auth check, 1 DB query)
  const [enrichedTrendingMovies, enrichedPopularSeries, enrichedRecommendations] =
    await enrichMoviesWithUserStatusBatch(trendingMovies, popularSeries, recommendations);

  return (
    <HomePage
      trendingMovies={enrichedTrendingMovies}
      popularSeries={enrichedPopularSeries}
      recommendedMovies={enrichedRecommendations}
      isAuthenticated={isAuthenticated}
      watchedCount={watchedCount}
      defaultMood={defaultMood}
    />
  );
}
