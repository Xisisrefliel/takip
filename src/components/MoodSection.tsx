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

export function MoodSection({
  initialMood,
  defaultMood,
  className,
}: MoodSectionProps) {
  const [selectedMood, setSelectedMood] = useState<string>(initialMood || defaultMood);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [availableMoods, setAvailableMoods] = useState<string[]>([]);
  const [isCheckingMoods, setIsCheckingMoods] = useState(true);
  const moodCache = useRef<Map<string, MoodCache>>(new Map());

  // Check which moods have movies on mount
  useEffect(() => {
    async function checkAvailableMoods() {
      setIsCheckingMoods(true);
      const available: string[] = [];
      const now = Date.now();

      // Check all moods in parallel
      const results = await Promise.all(
        MOODS.map(async (mood) => {
          try {
            const result = await getMoodRecommendationsAction(mood.id);
            if (result.movies && result.movies.length > 0) {
              // Cache the result
              moodCache.current.set(mood.id, { movies: result.movies, timestamp: now });
              return mood.id;
            }
            return null;
          } catch {
            return null;
          }
        })
      );

      for (const moodId of results) {
        if (moodId) available.push(moodId);
      }

      setAvailableMoods(available);
      setIsCheckingMoods(false);

      // Set initial mood to first available if current isn't available
      if (available.length > 0) {
        const currentMood = initialMood || defaultMood;
        if (!available.includes(currentMood)) {
          setSelectedMood(available[0]);
        }
      }
    }

    checkAvailableMoods();
  }, [initialMood, defaultMood]);

  // Update selected mood when initialMood changes
  useEffect(() => {
    if (initialMood && MOODS.some((m) => m.id === initialMood) && availableMoods.includes(initialMood)) {
      setSelectedMood(initialMood);
    }
  }, [initialMood, availableMoods]);

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
    if (!isCheckingMoods && selectedMood) {
      loadMoodMovies(selectedMood);
    }
  }, [selectedMood, loadMoodMovies, isCheckingMoods]);

  const handleMoodChange = (mood: string) => {
    setSelectedMood(mood);
  };

  // Don't render if no moods have movies
  if (!isCheckingMoods && availableMoods.length === 0) {
    return null;
  }

  const headerContent = (
    <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">
        Browse by Mood
      </h2>
      <MoodSelector
        initialMood={selectedMood}
        onMoodChange={handleMoodChange}
        availableMoods={isCheckingMoods ? undefined : availableMoods}
      />
    </div>
  );

  return (
    <div className={className}>
      <Carousel headerLeft={headerContent}>
        {isLoading || isCheckingMoods || !hasLoadedOnce
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
