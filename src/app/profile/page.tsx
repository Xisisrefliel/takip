import { getTrendingMovies, getPopularSeries } from "@/lib/tmdb";
import { ProfilePage } from "@/components/ProfilePage";

export default async function Page() {
  const [trendingMovies, popularSeries] = await Promise.all([
    getTrendingMovies(),
    getPopularSeries(),
  ]);

  return <ProfilePage trendingMovies={trendingMovies} popularSeries={popularSeries} />;
}
