"use client";

import { Movie } from "@/types";
import { MovieCard } from "@/components/MovieCard";
import { Carousel } from "@/components/Carousel";
import { getHiddenGemsAction } from "@/app/actions";
import { useLazyLoad } from "@/hooks/useLazyLoad";

interface HiddenGemsSectionProps {
  className?: string;
}

export function HiddenGemsSection({ className }: HiddenGemsSectionProps) {
  const { data: movies, isLoading, error, ref } = useLazyLoad<Movie[]>(
    async () => {
      const result = await getHiddenGemsAction();
      if (result.error || !result.movies) {
        throw new Error(result.error || "Failed to load hidden gems");
      }
      return result.movies;
    },
    { rootMargin: "400px" }
  );

  if (error || (movies && movies.length === 0)) {
    return null;
  }

  return (
    <div ref={ref} className={className}>
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-xl font-bold">Hidden Gems</h2>
      </div>

      {isLoading || !movies ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-2/3 bg-surface rounded-xl mb-2" />
              <div className="h-3 bg-surface rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <Carousel title="Hidden Gems">
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="min-w-[120px] w-[120px] sm:min-w-[140px] sm:w-[140px] md:min-w-[160px] md:w-[160px] lg:min-w-[180px] lg:w-[180px] snap-start"
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </Carousel>
      )}
    </div>
  );
}
