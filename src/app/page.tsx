import { getTrendingMovies, getPopularSeries } from "@/lib/tmdb";
import { HomePage } from "@/components/HomePage";
import { enrichMoviesWithUserStatus } from "@/app/actions";
import { auth } from "@/auth";
import { getPersonalizedRecommendations, getWatchedCount, getDefaultMood } from "@/lib/recommendations";

export const dynamic = 'force-dynamic';

export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id;
  const isAuthenticated = !!userId;

  const [trendingMovies, popularSeries] = await Promise.all([
    getTrendingMovies(),
    getPopularSeries(),
  ]);

  const [enrichedTrendingMovies, enrichedPopularSeries] = await Promise.all([
    enrichMoviesWithUserStatus(trendingMovies),
    enrichMoviesWithUserStatus(popularSeries),
  ]);

  let recommendedMovies: typeof enrichedTrendingMovies = [];
  let watchedCount = 0;
  let defaultMood = "uplifting";

  if (isAuthenticated && userId) {
    try {
      const [recommendations, count, mood] = await Promise.all([
        getPersonalizedRecommendations(userId, 12),
        getWatchedCount(userId),
        getDefaultMood(userId),
      ]);

      recommendedMovies = await enrichMoviesWithUserStatus(recommendations);
      watchedCount = count;
      defaultMood = mood;
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  return (
    <HomePage
      trendingMovies={enrichedTrendingMovies}
      popularSeries={enrichedPopularSeries}
      recommendedMovies={recommendedMovies}
      isAuthenticated={isAuthenticated}
      watchedCount={watchedCount}
      defaultMood={defaultMood}
    />
  );
}
