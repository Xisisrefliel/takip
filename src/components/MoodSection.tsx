"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Movie } from "@/types";
import { MovieCard } from "@/components/MovieCard";
import { Carousel } from "@/components/Carousel";
import { MoodSelector, MOODS } from "@/components/MoodSelector";
import { getMoodRecommendationsAction } from "@/app/actions";

interface MoodSectionProps {
  initialMood?: string;
  defaultMood: string;
  className?: string;
}

interface MoodCache {
  movies: Movie[];
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000;

export function MoodSection({
  initialMood,
  defaultMood,
  className,
}: MoodSectionProps) {
  const [selectedMood, setSelectedMood] = useState<string>(initialMood || defaultMood);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const moodCache = useRef<Map<string, MoodCache>>(new Map());

  useEffect(() => {
    if (initialMood && MOODS.some((m) => m.id === initialMood)) {
      setSelectedMood(initialMood);
    } else {
      setSelectedMood(defaultMood);
    }
  }, [initialMood, defaultMood]);

  const loadMoodMovies = useCallback(async (mood: string) => {
    const now = Date.now();
    const cached = moodCache.current.get(mood);

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setMovies(cached.movies);
      setIsLoading(false);
      setHasLoadedOnce(true);
      return;
    }

    setIsLoading(true);

    try {
      const result = await getMoodRecommendationsAction(mood);

      if (result.movies) {
        setMovies(result.movies);
        moodCache.current.set(mood, { movies: result.movies, timestamp: now });
      }
    } catch (error) {
      console.error("Error loading mood recommendations:", error);
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  }, []);

  useEffect(() => {
    loadMoodMovies(selectedMood);
  }, [selectedMood, loadMoodMovies]);

  const handleMoodChange = (mood: string) => {
    setSelectedMood(mood);
  };

  if (!hasLoadedOnce) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl font-bold">Browse by Mood</h2>
        </div>
        <MoodSelector onMoodChange={() => { }} className="mb-6" />
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

  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold">Browse by Mood</h2>
        <MoodSelector
          initialMood={selectedMood}
          onMoodChange={handleMoodChange}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-2/3 bg-surface rounded-xl mb-2" />
              <div className="h-3 bg-surface rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : movies.length > 0 ? (
        <Carousel>
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="min-w-[120px] w-[120px] sm:min-w-[140px] sm:w-[140px] md:min-w-[160px] md:w-[160px] lg:min-w-[180px] lg:w-[180px] snap-start"
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </Carousel>
      ) : (
        <div className="text-center py-12 text-foreground/50">
          <p>No movies found for this mood. Try another one!</p>
        </div>
      )}
    </div>
  );
}
