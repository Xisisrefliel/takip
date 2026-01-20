"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { DiscoverFilters } from "@/types/discover";
import GenreFilter from "./GenreFilter";
import StudioFilter from "./StudioFilter";
import RuntimeFilter from "./RuntimeFilter";
import ProviderFilter from "./ProviderFilter";
import LanguageFilter from "./LanguageFilter";
import ContentRatingFilter from "./ContentRatingFilter";
import VoteCountFilter from "./VoteCountFilter";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DiscoverFilters;
  onFilterChange: (filters: Partial<DiscoverFilters>) => void;
  onClearAll: () => void;
}

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClearAll,
}: MobileFilterDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/30 rounded-t-3xl z-50 lg:hidden max-h-[85vh] overflow-hidden flex flex-col overscroll-contain shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30 sticky top-0 bg-background/95 backdrop-blur-xl z-10">
              <h2 className="text-lg font-semibold text-foreground">Filters</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClearAll}
                  className="text-sm font-medium text-foreground/60 hover:text-foreground transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-surface-hover"
                >
                  Clear all
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-surface-hover rounded-full transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 scrollbar-hide">
              <GenreFilter
                selectedGenres={filters.genres}
                onChange={(genres) => onFilterChange({ genres })}
              />

              <StudioFilter
                selectedStudios={filters.withCompanies || []}
                onChange={(withCompanies) => onFilterChange({ withCompanies })}
              />

              <RuntimeFilter
                runtimeGte={filters.runtimeGte}
                runtimeLte={filters.runtimeLte}
                onChange={(runtimeGte, runtimeLte) =>
                  onFilterChange({ runtimeGte, runtimeLte })
                }
              />

              <VoteCountFilter
                value={filters.minVotes}
                onChange={(minVotes) => onFilterChange({ minVotes })}
              />

              <ProviderFilter
                selectedProviders={filters.withProviders || []}
                region={filters.region}
                onChange={(withProviders, region) =>
                  onFilterChange({ withProviders, region })
                }
              />

              <LanguageFilter
                value={filters.originalLanguage}
                onChange={(originalLanguage) =>
                  onFilterChange({ originalLanguage })
                }
              />

              <ContentRatingFilter
                value={filters.certification}
                mediaType={filters.mediaType}
                onChange={(certification) => onFilterChange({ certification })}
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/30 bg-background/95 backdrop-blur-xl sticky bottom-0">
              <button
                onClick={onClose}
                className="w-full py-3 bg-foreground text-background rounded-full font-semibold hover:opacity-90 transition-all duration-200 shadow-sm btn-press"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
