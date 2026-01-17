"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Movie } from "@/types";
import { MovieCard } from "@/components/MovieCard";
import { Carousel } from "@/components/Carousel";
import { MoodSelector } from "@/components/MoodSelector";
import { MOOD_IDS } from "@/lib/constants";
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
  // Start with all moods available, hide them lazily when found empty
  const [unavailableMoods, setUnavailableMoods] = useState<Set<string>>(new Set());
  const moodCache = useRef<Map<string, MoodCache>>(new Map());

  // Compute available moods (all moods minus unavailable ones)
  const availableMoods = MOOD_IDS.filter(id => !unavailableMoods.has(id));

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

      if (result.movies && result.movies.length > 0) {
        setMovies(result.movies);
        moodCache.current.set(mood, { movies: result.movies, timestamp: now });
      } else {
        // Mark this mood as unavailable and switch to next available
        setUnavailableMoods(prev => new Set([...prev, mood]));
        setMovies([]);
      }
    } catch (error) {
      console.error("Error loading mood recommendations:", error);
      // Mark as unavailable on error too
      setUnavailableMoods(prev => new Set([...prev, mood]));
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  }, []);

  // Load movies when mood changes
  useEffect(() => {
    if (selectedMood) {
      loadMoodMovies(selectedMood);
    }
  }, [selectedMood, loadMoodMovies]);

  // Update selected mood when initialMood changes
  useEffect(() => {
    if (initialMood && MOOD_IDS.includes(initialMood as typeof MOOD_IDS[number]) && !unavailableMoods.has(initialMood)) {
      setSelectedMood(initialMood);
    }
  }, [initialMood, unavailableMoods]);

  // If current mood becomes unavailable, switch to first available
  useEffect(() => {
    if (unavailableMoods.has(selectedMood) && availableMoods.length > 0) {
      setSelectedMood(availableMoods[0]);
    }
  }, [unavailableMoods, selectedMood, availableMoods]);

  const handleMoodChange = (mood: string) => {
    setSelectedMood(mood);
  };

  // Hide section if all moods are unavailable
  if (availableMoods.length === 0 && hasLoadedOnce) {
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
        availableMoods={availableMoods}
      />
    </div>
  );

  return (
    <div className={className}>
      <Carousel headerLeft={headerContent}>
        {isLoading || !hasLoadedOnce
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
