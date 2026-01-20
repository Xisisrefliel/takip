"use client";

import { motion } from "framer-motion";
import type { DiscoverFilters } from "@/types/discover";
import SortDropdown from "./SortDropdown";
import GenreFilter from "./GenreFilter";
import StudioFilter from "./StudioFilter";
import RuntimeFilter from "./RuntimeFilter";
import ProviderFilter from "./ProviderFilter";
import LanguageFilter from "./LanguageFilter";
import ContentRatingFilter from "./ContentRatingFilter";
import VoteCountFilter from "./VoteCountFilter";
import { X } from "lucide-react";
import { getDefaultFilters } from "@/lib/discover-utils";

interface FilterBarProps {
  filters: DiscoverFilters;
  onFilterChange: (filters: Partial<DiscoverFilters>) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const hasActiveFilters = () => {
    const defaults = getDefaultFilters();
    return (
      filters.genres.length > 0 ||
      (filters.withCompanies && filters.withCompanies.length > 0) ||
      filters.minRating !== undefined ||
      filters.maxRating !== undefined ||
      filters.minVotes !== undefined ||
      filters.runtimeGte !== undefined ||
      filters.runtimeLte !== undefined ||
      (filters.withProviders && filters.withProviders.length > 0) ||
      filters.originalLanguage !== undefined ||
      filters.certification !== undefined ||
      filters.sortBy !== defaults.sortBy
    );
  };

  const clearAllFilters = () => {
    const defaults = getDefaultFilters();
    onFilterChange({
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
  };

  return (
    <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0 border-r border-border/30">
      <div className="sticky top-0 h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide overscroll-contain">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="space-y-6 px-4 xl:px-6 py-6 pb-12"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Filters</h2>
            {hasActiveFilters() && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-foreground/60 hover:text-foreground transition-colors rounded-full hover:bg-surface-hover"
              >
                <X className="w-3 h-3" />
                Clear
              </motion.button>
            )}
          </div>

          {/* Sort */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="space-y-2"
          >
            <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider">
              Sort By
            </label>
            <SortDropdown
              value={filters.sortBy}
              onChange={(sortBy) => onFilterChange({ sortBy })}
            />
          </motion.div>

          {/* Divider */}
          <div className="border-t border-border/30" />

          {/* Genres */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <GenreFilter
              selectedGenres={filters.genres}
              onChange={(genres) => onFilterChange({ genres })}
            />
          </motion.div>

          {/* Divider */}
          <div className="border-t border-border/30" />

          {/* Studios */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <StudioFilter
              selectedStudios={filters.withCompanies || []}
              onChange={(withCompanies) => onFilterChange({ withCompanies })}
            />
          </motion.div>

          {/* Divider */}
          <div className="border-t border-border/30" />

          {/* Streaming Providers */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <ProviderFilter
              selectedProviders={filters.withProviders || []}
              region={filters.region}
              onChange={(withProviders, region) =>
                onFilterChange({ withProviders, region })
              }
            />
          </motion.div>

          {/* Divider */}
          <div className="border-t border-border/30" />

          {/* Runtime */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <RuntimeFilter
              runtimeGte={filters.runtimeGte}
              runtimeLte={filters.runtimeLte}
              onChange={(runtimeGte, runtimeLte) =>
                onFilterChange({ runtimeGte, runtimeLte })
              }
            />
          </motion.div>

          {/* Divider */}
          <div className="border-t border-border/30" />

          {/* Vote Count */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <VoteCountFilter
              value={filters.minVotes}
              onChange={(minVotes) => onFilterChange({ minVotes })}
            />
          </motion.div>

          {/* Divider */}
          <div className="border-t border-border/30" />

          {/* Language */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <LanguageFilter
              value={filters.originalLanguage}
              onChange={(originalLanguage) =>
                onFilterChange({ originalLanguage })
              }
            />
          </motion.div>

          {/* Divider */}
          <div className="border-t border-border/30" />

          {/* Content Rating */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <ContentRatingFilter
              value={filters.certification}
              mediaType={filters.mediaType}
              onChange={(certification) => onFilterChange({ certification })}
            />
          </motion.div>
        </motion.div>
      </div>
    </aside>
  );
}
