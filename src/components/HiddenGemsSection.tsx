"use client";

import { Movie } from "@/types";
import { MovieCard } from "@/components/MovieCard";
import { Carousel } from "@/components/Carousel";

interface HiddenGemsSectionProps {
  cachedMovies?: Movie[];
  className?: string;
}

export function HiddenGemsSection({ cachedMovies, className }: HiddenGemsSectionProps) {
  // If no movies provided or empty array, don't render
  if (!cachedMovies || cachedMovies.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Carousel title="Hidden Gems">
        {cachedMovies.map((movie) => (
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
