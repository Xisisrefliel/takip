"use client";

import { Movie } from "@/types";
import { MovieCard } from "@/components/MovieCard";
import { Sparkles } from "lucide-react";

interface ResultsGridProps {
  results: Movie[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const SKELETON_COUNT = 20;

function SkeletonGrid() {
  return (
    <>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-2/3 bg-surface rounded-xl mb-2" />
          <div className="h-3 bg-surface rounded w-3/4" />
        </div>
      ))}
    </>
  );
}

export default function ResultsGrid({
  results,
  isLoading,
  hasMore,
  onLoadMore,
}: ResultsGridProps) {
  if (isLoading && results.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        <SkeletonGrid />
      </div>
    );
  }

  if (results.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Sparkles className="w-12 h-12 text-foreground/20 mb-4" />
        <h3 className="text-lg font-medium text-foreground/60 mb-2">
          No results found
        </h3>
        <p className="text-sm text-foreground/40">
          Try adjusting your filters to discover more content
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-5 lg:gap-6">
        {results.map((movie) => (
          <MovieCard key={`${movie.id}-${movie.mediaType}`} movie={movie} />
        ))}
        {isLoading && <SkeletonGrid />}
      </div>

      {hasMore && !isLoading && (
        <div className="flex justify-center pt-4 pb-8">
          <button
            onClick={onLoadMore}
            className="px-6 py-3 bg-foreground text-background rounded-full font-medium hover:opacity-90 transition-all duration-200 shadow-sm btn-press"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
