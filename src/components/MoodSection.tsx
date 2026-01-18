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
  cachedMoodMovies?: Record<string, Movie[]>;
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
  cachedMoodMovies = {},
  className,
}: MoodSectionProps) {
  // Initialize cache with server-provided data immediately
  const moodCache = useRef<Map<string, MoodCache>>(new Map());

  // Populate cache on mount
  if (moodCache.current.size === 0 && Object.keys(cachedMoodMovies).length > 0) {
    for (const [moodId, moodMovies] of Object.entries(cachedMoodMovies)) {
      if (moodMovies && moodMovies.length > 0) {
        moodCache.current.set(moodId, { movies: moodMovies, timestamp: Date.now() });
      }
    }
  }

  // Find first mood that has cached data, or fall back to default
  const getInitialMood = () => {
    const preferredMood = initialMood || defaultMood;
    // If preferred mood has cached data, use it
    if (cachedMoodMovies[preferredMood]?.length) {
      return preferredMood;
    }
    // Otherwise, find first mood with data
    const firstAvailableMood = Object.keys(cachedMoodMovies).find(
      (moodId) => cachedMoodMovies[moodId]?.length > 0
    );
    return firstAvailableMood || preferredMood;
  };

  const initialMoodWithData = getInitialMood();

  const [selectedMood, setSelectedMood] = useState<string>(initialMoodWithData);
  const [movies, setMovies] = useState<Movie[]>(
    cachedMoodMovies[initialMoodWithData] || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(
    !!(cachedMoodMovies[initialMoodWithData]?.length)
  );
  const [unavailableMoods, setUnavailableMoods] = useState<Set<string>>(new Set());

  // Compute available moods (all moods minus unavailable ones)
  const availableMoods = MOOD_IDS.filter(id => !unavailableMoods.has(id));

  const loadMoodMovies = useCallback(async (mood: string) => {
    const now = Date.now();
    const cached = moodCache.current.get(mood);

    // Check cache first (including server cache)
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setMovies(cached.movies);
      setIsLoading(false);
      setHasLoadedOnce(true);
      return;
    }

    // If we have it from server but it's not in our ref cache, use it
    if (cachedMoodMovies[mood] && cachedMoodMovies[mood].length > 0) {
      setMovies(cachedMoodMovies[mood]);
      moodCache.current.set(mood, { movies: cachedMoodMovies[mood], timestamp: now });
      setIsLoading(false);
      setHasLoadedOnce(true);
      return;
    }

    // Only fetch if we don't have cached data
    setIsLoading(true);

    try {
      const result = await getMoodRecommendationsAction(mood);

      if (result.movies && result.movies.length > 0) {
        setMovies(result.movies);
        moodCache.current.set(mood, { movies: result.movies, timestamp: now });
        setHasLoadedOnce(true);
      } else {
        // Mark this mood as unavailable
        setUnavailableMoods(prev => new Set([...prev, mood]));
        setMovies([]);
        setHasLoadedOnce(true);
      }
    } catch (error) {
      console.error("Error loading mood recommendations:", error);
      // Mark as unavailable on error
      setUnavailableMoods(prev => new Set([...prev, mood]));
      setMovies([]);
      setHasLoadedOnce(true);
    } finally {
      setIsLoading(false);
    }
  }, [cachedMoodMovies]);

  // Load movies when mood changes (skip initial mount if we already have cached data)
  const isInitialMount = useRef(true);
  const hasInitialData = useRef(movies.length > 0);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Skip loading on initial mount if we already have cached data
      if (hasInitialData.current) {
        return;
      }
    }
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

  // Handle when a movie is marked as watched
  // Just remove it from display - replacement will happen on next page load
  const handleMovieWatched = useCallback((movieId: string, newValue: boolean) => {
    if (!newValue) return; // Only act when marking as watched (not unwatching)

    // Optimistically remove the movie from the list
    setMovies(prevMovies => prevMovies.filter(m => m.id !== movieId));

    // Update local cache to remove the movie
    const updatedMovies = movies.filter(m => m.id !== movieId);
    moodCache.current.set(selectedMood, {
      movies: updatedMovies,
      timestamp: Date.now()
    });
  }, [selectedMood, movies]);

  // Hide section only if all moods are unavailable and we have no cached data
  if (availableMoods.length === 0 && Object.keys(cachedMoodMovies).length === 0 && hasLoadedOnce) {
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
        {isLoading || (!hasLoadedOnce && movies.length === 0)
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : movies.map((movie) => (
              <div
                key={movie.id}
                className="min-w-[120px] w-[120px] sm:min-w-[140px] sm:w-[140px] md:min-w-[160px] md:w-[160px] lg:min-w-[180px] lg:w-[180px] snap-start"
              >
                <MovieCard movie={movie} onWatchedChange={handleMovieWatched} />
              </div>
            ))}
      </Carousel>
    </div>
  );
}
