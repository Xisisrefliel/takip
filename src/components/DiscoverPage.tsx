"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Movie } from "@/types";
import type { DiscoverFilters } from "@/types/discover";
import {
  serializeFiltersToURL,
  buildTMDBDiscoverParams,
  getDefaultFilters,
} from "@/lib/discover-utils";
import { discoverMediaAction } from "@/app/actions";
import FilterBar from "@/components/discover/FilterBar";
import ResultsGrid from "@/components/discover/ResultsGrid";
import MobileFilterDrawer from "@/components/discover/MobileFilterDrawer";
import SortDropdown from "@/components/discover/SortDropdown";
import { Film, Tv, Filter } from "lucide-react";
import { motion } from "framer-motion";

interface DiscoverPageProps {
  initialResults: Movie[];
  initialFilters: DiscoverFilters;
}

export default function DiscoverPage({
  initialResults,
  initialFilters,
}: DiscoverPageProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<DiscoverFilters>(initialFilters);
  const [results, setResults] = useState<Movie[]>(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Debounce timer for filter updates
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Calculate active filter count for mobile badge
  const activeFilterCount = useCallback(() => {
    let count = 0;
    if (filters.genres.length > 0) count++;
    if (filters.withCompanies && filters.withCompanies.length > 0) count++;
    if (filters.minRating !== undefined || filters.maxRating !== undefined) count++;
    if (filters.minVotes !== undefined) count++;
    if (filters.runtimeGte !== undefined || filters.runtimeLte !== undefined) count++;
    if (filters.withProviders && filters.withProviders.length > 0) count++;
    if (filters.originalLanguage) count++;
    if (filters.certification) count++;
    return count;
  }, [filters]);

  // Update URL when filters change
  const updateURL = useCallback(
    (newFilters: DiscoverFilters) => {
      const queryString = serializeFiltersToURL(newFilters);
      router.push(`/discover${queryString ? `?${queryString}` : ""}`, {
        scroll: false,
      });
    },
    [router]
  );

  // Fetch results with current filters
  const fetchResults = useCallback(
    async (currentFilters: DiscoverFilters, append = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = buildTMDBDiscoverParams(currentFilters);
        const result = await discoverMediaAction({
          mediaType: currentFilters.mediaType,
          params,
        });

        if (result.error) {
          setError(result.error);
        } else if (result.results) {
          setResults((prev) =>
            append ? [...prev, ...result.results!] : result.results!
          );
          // TMDB typically returns 20 results per page
          setTotalPages(Math.ceil(result.results.length / 20));
        }
      } catch (err) {
        setError("Failed to fetch results");
        console.error("Discover error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Handle filter changes with debouncing
  const handleFilterChange = useCallback(
    (newFilters: Partial<DiscoverFilters>) => {
      // Clear existing debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const updatedFilters: DiscoverFilters = {
        ...filters,
        ...newFilters,
        // Reset to page 1 when filters change (unless it's a page change)
        page: newFilters.page !== undefined ? newFilters.page : 1,
      };

      setFilters(updatedFilters);
      updateURL(updatedFilters);

      // Debounce API calls (300ms)
      const timer = setTimeout(() => {
        fetchResults(updatedFilters, newFilters.page !== undefined);
      }, 300);

      setDebounceTimer(timer);
    },
    [filters, debounceTimer, updateURL, fetchResults]
  );

  // Handle media type toggle
  const handleMediaTypeChange = useCallback(
    (mediaType: "movie" | "tv") => {
      handleFilterChange({ mediaType });
    },
    [handleFilterChange]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const defaults = getDefaultFilters();
    handleFilterChange({
      genres: [],
      withCompanies: undefined,
      minRating: undefined,
      maxRating: undefined,
      minVotes: undefined,
      runtimeGte: undefined,
      runtimeLte: undefined,
      withProviders: undefined,
      region: undefined,
      originalLanguage: undefined,
      certification: undefined,
      sortBy: defaults.sortBy,
    });
  }, [handleFilterChange]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    const nextPage = (filters.page || 1) + 1;
    handleFilterChange({ page: nextPage });
  }, [filters.page, handleFilterChange]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <div className="flex min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-6rem)] w-full">
      {/* Sidebar Filters (Desktop) */}
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
            {/* Header */}
            <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="mb-8 sm:mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground tracking-tight mb-1">
                  Discover
                </h1>
                <p className="text-sm text-foreground/50">
                  Explore movies and series
                </p>
              </div>

              {/* Result count (desktop only) */}
              {results.length > 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border/50 text-sm text-foreground/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  {results.length} results
                </motion.div>
              )}
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Media Type Toggle */}
              <div className="inline-flex items-center gap-1 p-1 bg-surface border border-border/50 rounded-full shadow-sm">
                <button
                  onClick={() => handleMediaTypeChange("movie")}
                  className="relative px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-sm font-medium transition-all duration-200"
                >
                  {filters.mediaType === "movie" && (
                    <motion.div
                      layoutId="mediaType"
                      className="absolute inset-0 bg-foreground rounded-full shadow-sm"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span
                    className={`relative z-10 flex items-center gap-1.5 sm:gap-2 ${
                      filters.mediaType === "movie"
                        ? "text-background"
                        : "text-foreground/60"
                    }`}
                  >
                    <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Movies</span>
                  </span>
                </button>
                <button
                  onClick={() => handleMediaTypeChange("tv")}
                  className="relative px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-sm font-medium transition-all duration-200"
                >
                  {filters.mediaType === "tv" && (
                    <motion.div
                      layoutId="mediaType"
                      className="absolute inset-0 bg-foreground rounded-full shadow-sm"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span
                    className={`relative z-10 flex items-center gap-1.5 sm:gap-2 ${
                      filters.mediaType === "tv"
                        ? "text-background"
                        : "text-foreground/60"
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Series</span>
                  </span>
                </button>
              </div>

              {/* Mobile Sort & Filter */}
              <div className="lg:hidden flex items-center gap-2 ml-auto">
                <SortDropdown
                  value={filters.sortBy}
                  onChange={(sortBy) => handleFilterChange({ sortBy })}
                />
                <button
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-surface border border-border/50 rounded-full text-sm font-medium text-foreground hover:bg-surface-hover transition-all shadow-sm"
                >
                  <Filter className="w-4 h-4" />
                  {activeFilterCount() > 0 && (
                    <span className="bg-accent text-accent-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">
                      {activeFilterCount()}
                    </span>
                  )}
                </button>
              </div>
            </div>
            </motion.div>

            {/* Error State */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6"
              >
                <p className="text-red-500 text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {/* Results Grid */}
            <ResultsGrid
              results={results}
              isLoading={isLoading}
              hasMore={(filters.page || 1) < totalPages}
              onLoadMore={handleLoadMore}
            />
        </div>
      </main>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearAll={clearAllFilters}
      />
    </div>
  );
}
