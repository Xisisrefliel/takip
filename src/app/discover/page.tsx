import { auth } from "@/auth";
import { discoverMovies, discoverTv } from "@/lib/tmdb";
import { parseFiltersFromURL, buildTMDBDiscoverParams } from "@/lib/discover-utils";
import DiscoverPage from "@/components/DiscoverPage";
import { redirect } from "next/navigation";

export const revalidate = 14400; // 4 hours ISR

export default async function DiscoverRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const filters = parseFiltersFromURL(resolvedSearchParams);

  const discoverFn = filters.mediaType === "movie" ? discoverMovies : discoverTv;
  const params = buildTMDBDiscoverParams(filters);
  const initialResults = await discoverFn(params);

  return <DiscoverPage initialResults={initialResults} initialFilters={filters} />;
}
