import { getTrendingMovies, getPopularSeries, getNowPlayingMovies, getUpcomingMovies } from "@/lib/tmdb";
import { HomePage } from "@/components/HomePage";
import { enrichMoviesWithUserStatusBatch } from "@/app/actions";
import { auth } from "@/auth";
import { getTopRatedMovies, getHiddenGems } from "@/lib/recommendations";

// Revalidate homepage every hour for fresh content
export const revalidate = 3600;

export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id || null;
  const isAuthenticated = !!userId;

  // Fetch all TMDB data in parallel
  const [trendingMovies, popularSeries, nowPlaying, upcoming, topRated, hiddenGems] = await Promise.all([
    getTrendingMovies(),
    getPopularSeries(),
    getNowPlayingMovies(),
    getUpcomingMovies(),
    getTopRatedMovies(userId, 20),
    getHiddenGems(userId, 20),
  ]);

  // Single batch call to enrich all movie arrays with user status
  const enrichedArrays = await enrichMoviesWithUserStatusBatch(
    trendingMovies,
    popularSeries,
    nowPlaying,
    upcoming,
    topRated,
    hiddenGems
  );

  const [
    enrichedTrendingMovies,
    enrichedPopularSeries,
    enrichedNowPlaying,
    enrichedUpcoming,
    enrichedTopRated,
    enrichedHiddenGems,
  ] = enrichedArrays;

  return (
    <HomePage
      trendingMovies={enrichedTrendingMovies}
      popularSeries={enrichedPopularSeries}
      nowPlaying={enrichedNowPlaying}
      upcoming={enrichedUpcoming}
      topRated={enrichedTopRated}
      hiddenGems={enrichedHiddenGems}
      isAuthenticated={isAuthenticated}
    />
  );
}
