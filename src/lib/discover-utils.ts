import type { DiscoverFilters } from "@/types/discover";

export function getDefaultFilters(): DiscoverFilters {
  return {
    mediaType: "movie",
    sortBy: "popularity.desc",
    genres: [],
    page: 1,
  };
}

export function serializeFiltersToURL(filters: DiscoverFilters): string {
  const params = new URLSearchParams();

  if (filters.mediaType !== "movie") {
    params.set("mediaType", filters.mediaType);
  }
  if (filters.sortBy !== "popularity.desc") {
    params.set("sortBy", filters.sortBy);
  }
  if (filters.genres.length > 0) {
    params.set("genres", filters.genres.join(","));
  }
  if (filters.withCompanies && filters.withCompanies.length > 0) {
    params.set("studios", filters.withCompanies.join(","));
  }
  if (filters.minRating !== undefined) {
    params.set("minRating", filters.minRating.toString());
  }
  if (filters.maxRating !== undefined) {
    params.set("maxRating", filters.maxRating.toString());
  }
  if (filters.minVotes !== undefined) {
    params.set("minVotes", filters.minVotes.toString());
  }
  if (filters.releaseDateGte) {
    params.set("releaseDateGte", filters.releaseDateGte);
  }
  if (filters.releaseDateLte) {
    params.set("releaseDateLte", filters.releaseDateLte);
  }
  if (filters.withProviders && filters.withProviders.length > 0) {
    params.set("providers", filters.withProviders.join(","));
  }
  if (filters.region) {
    params.set("region", filters.region);
  }
  if (filters.originalLanguage) {
    params.set("language", filters.originalLanguage);
  }
  if (filters.certification) {
    params.set("certification", filters.certification);
  }
  if (filters.runtimeGte !== undefined) {
    params.set("runtimeGte", filters.runtimeGte.toString());
  }
  if (filters.runtimeLte !== undefined) {
    params.set("runtimeLte", filters.runtimeLte.toString());
  }
  if (filters.page && filters.page > 1) {
    params.set("page", filters.page.toString());
  }

  return params.toString();
}

export function parseFiltersFromURL(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): DiscoverFilters {
  const defaults = getDefaultFilters();

  // Helper to get string value from searchParams
  const getString = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) || undefined;
    }
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return {
    mediaType:
      (getString("mediaType") as "movie" | "tv") || defaults.mediaType,
    sortBy: getString("sortBy") || defaults.sortBy,
    genres: getString("genres")
      ? getString("genres")!.split(",").map(Number)
      : [],
    withCompanies: getString("studios")
      ? getString("studios")!.split(",").map(Number)
      : undefined,
    minRating: getString("minRating")
      ? Number(getString("minRating"))
      : undefined,
    maxRating: getString("maxRating")
      ? Number(getString("maxRating"))
      : undefined,
    minVotes: getString("minVotes")
      ? Number(getString("minVotes"))
      : undefined,
    releaseDateGte: getString("releaseDateGte"),
    releaseDateLte: getString("releaseDateLte"),
    withProviders: getString("providers")
      ? getString("providers")!.split(",").map(Number)
      : undefined,
    region: getString("region"),
    originalLanguage: getString("language"),
    certification: getString("certification"),
    runtimeGte: getString("runtimeGte")
      ? Number(getString("runtimeGte"))
      : undefined,
    runtimeLte: getString("runtimeLte")
      ? Number(getString("runtimeLte"))
      : undefined,
    page: getString("page") ? Number(getString("page")) : 1,
  };
}

export function buildTMDBDiscoverParams(
  filters: DiscoverFilters
): Record<string, string> {
  const params: Record<string, string> = {};

  // Sort
  params.sort_by = filters.sortBy;

  // Genres (pipe-separated)
  if (filters.genres.length > 0) {
    params.with_genres = filters.genres.join("|");
  }

  // Studios/Companies (pipe-separated)
  if (filters.withCompanies && filters.withCompanies.length > 0) {
    params.with_companies = filters.withCompanies.join("|");
  }

  // Rating range
  if (filters.minRating !== undefined) {
    params["vote_average.gte"] = filters.minRating.toString();
  }
  if (filters.maxRating !== undefined) {
    params["vote_average.lte"] = filters.maxRating.toString();
  }

  // Vote count
  if (filters.minVotes !== undefined) {
    params["vote_count.gte"] = filters.minVotes.toString();
  }

  // Release date range
  if (filters.releaseDateGte) {
    const dateParam =
      filters.mediaType === "movie"
        ? "primary_release_date.gte"
        : "first_air_date.gte";
    params[dateParam] = filters.releaseDateGte;
  }
  if (filters.releaseDateLte) {
    const dateParam =
      filters.mediaType === "movie"
        ? "primary_release_date.lte"
        : "first_air_date.lte";
    params[dateParam] = filters.releaseDateLte;
  }

  // Streaming providers (pipe-separated)
  if (filters.withProviders && filters.withProviders.length > 0) {
    params.with_watch_providers = filters.withProviders.join("|");
  }
  if (filters.region) {
    params.watch_region = filters.region;
  }

  // Original language
  if (filters.originalLanguage) {
    params.with_original_language = filters.originalLanguage;
  }

  // Content rating/certification
  if (filters.certification) {
    params.certification_country = "US";
    params.certification = filters.certification;
  }

  // Runtime range
  if (filters.runtimeGte !== undefined) {
    params["with_runtime.gte"] = filters.runtimeGte.toString();
  }
  if (filters.runtimeLte !== undefined) {
    params["with_runtime.lte"] = filters.runtimeLte.toString();
  }

  // Pagination
  if (filters.page) {
    params.page = filters.page.toString();
  }

  return params;
}
