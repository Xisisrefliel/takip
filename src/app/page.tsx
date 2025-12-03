import { getTrendingMovies, getPopularSeries } from "@/lib/tmdb";
import { HomePage } from "@/components/HomePage";
import { enrichMoviesWithUserStatus } from "@/app/actions";

export default async function Page() {
  const [trendingMovies, popularSeries] = await Promise.all([
    getTrendingMovies(),
    getPopularSeries(),
  ]);

  // Enrich movies with user status from database
  const [enrichedTrendingMovies, enrichedPopularSeries] = await Promise.all([
    enrichMoviesWithUserStatus(trendingMovies),
    enrichMoviesWithUserStatus(popularSeries),
  ]);

  return (
    <HomePage
      trendingMovies={enrichedTrendingMovies}
      popularSeries={enrichedPopularSeries}
    />
  );
}
