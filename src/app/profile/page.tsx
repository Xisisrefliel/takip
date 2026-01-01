import { ProfilePage } from "@/components/ProfilePage";
import { getUserMediaAction } from "@/app/actions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const initialContentType = "movies" as const;
  
  const [watchedResult, watchlistResult, favoritesResult] = await Promise.all([
    getUserMediaAction(initialContentType, "watched"),
    getUserMediaAction(initialContentType, "watchlist"),
    getUserMediaAction(initialContentType, "favorites"),
  ]);

  const initialMovies = {
    watched: watchedResult.movies || [],
    watchlist: watchlistResult.movies || [],
    favorites: favoritesResult.movies || [],
  };

  return (
    <ProfilePage 
      initialContentType={initialContentType}
      initialMovies={initialMovies}
    />
  );
}
