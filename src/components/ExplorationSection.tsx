"use client";

import { Movie } from "@/types";
import { MovieCard } from "@/components/MovieCard";
import { Carousel } from "@/components/Carousel";
import { getExplorationRecommendationsAction } from "@/app/actions";
import { useLazyLoad } from "@/hooks/useLazyLoad";

interface ExplorationSectionProps {
  className?: string;
}

function SkeletonCard() {
  return (
    <div className="min-w-[120px] w-[120px] sm:min-w-[140px] sm:w-[140px] md:min-w-[160px] md:w-[160px] lg:min-w-[180px] lg:w-[180px] snap-start">
      <div className="animate-pulse">
        <div className="aspect-2/3 bg-surface rounded-xl mb-2" />
        <div className="h-3 bg-surface rounded w-3/4" />
      </div>
    </div>
  );
}

export function ExplorationSection({ className }: ExplorationSectionProps) {
  const { data: movies, isLoading, error, ref } = useLazyLoad<Movie[]>(
    async () => {
      const result = await getExplorationRecommendationsAction();
      if (result.error || !result.movies) {
        throw new Error(result.error || "Failed to load recommendations");
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
      <Carousel title="Try Something New">
        {isLoading || !movies
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : movies.map((movie) => (
              <div
                key={movie.id}
                className="min-w-[120px] w-[120px] sm:min-w-[140px] sm:w-[140px] md:min-w-[160px] md:w-[160px] lg:min-w-[180px] lg:w-[180px] snap-start"
              >
                <MovieCard movie={movie} />
              </div>
            ))}
      </Carousel>
    </div>
  );
}
