import type { Movie } from "@/types";

export interface DiscoverFilters {
  mediaType: "movie" | "tv";
  sortBy: string; // e.g., "popularity.desc"
  genres: number[];
  withCompanies?: number[]; // Studio/production company IDs
  minRating?: number;
  maxRating?: number;
  minVotes?: number;
  releaseDateGte?: string; // YYYY-MM-DD
  releaseDateLte?: string;
  withProviders?: number[];
  region?: string; // ISO country code
  originalLanguage?: string; // ISO 639-1
  certification?: string;
  runtimeGte?: number;
  runtimeLte?: number;
  page?: number;
}

export interface DiscoverResult {
  results: Movie[];
  page: number;
  total_pages: number;
  total_results: number;
}
