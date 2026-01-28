"use client";

import { useEffect, useState } from "react";
import { Movie } from "@/types";
import { MovieCard } from "@/components/MovieCard";
import { Carousel } from "@/components/Carousel";
import { getSimilarMoviesAction } from "@/app/actions";

interface SimilarRecommendationsProps {
  mediaId: string;
  title?: string;
  className?: string;
  sourceCountries?: { iso: string; name: string }[];
}

export function SimilarRecommendations({
  mediaId,
  title = "You Might Also Like",
  className,
  sourceCountries,
}: SimilarRecommendationsProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSimilar() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getSimilarMoviesAction(mediaId, sourceCountries);

        if (result.error) {
          setError(result.error);
        } else if (result.movies) {
          setMovies(result.movies);
        }
      } catch (err) {
        setError("Failed to load similar movies");
        console.error("Error loading similar movies:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSimilar();
  }, [mediaId, sourceCountries]);

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-2/3 bg-surface rounded-xl mb-2" />
              <div className="h-3 bg-surface rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || movies.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Carousel title={title}>
        {movies.map((movie) => (
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
