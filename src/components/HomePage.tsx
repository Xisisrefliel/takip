"use client";

import { useMemo } from "react";
import { Carousel } from "@/components/Carousel";
import { MovieCard } from "@/components/MovieCard";
import { motion } from "framer-motion";
import { Play, Plus } from "lucide-react";
import { Movie } from "@/types";
import Image from "next/image";
import { MoodSection } from "@/components/MoodSection";
import { ExplorationSection } from "@/components/ExplorationSection";
import { HiddenGemsSection } from "@/components/HiddenGemsSection";

interface HomePageProps {
  trendingMovies: Movie[];
  popularSeries: Movie[];
  recommendedMovies?: Movie[];
  explorationMovies?: Movie[];
  hiddenGemsMovies?: Movie[];
  moodMovies?: Record<string, Movie[]>;
  isAuthenticated?: boolean;
  watchedCount?: number;
  defaultMood?: string;
}

export function HomePage({
  trendingMovies,
  popularSeries,
  recommendedMovies,
  explorationMovies,
  hiddenGemsMovies,
  moodMovies,
  isAuthenticated,
  watchedCount = 0,
  defaultMood = "uplifting",
}: HomePageProps) {
  const orderedTrending = useMemo(() => trendingMovies, [trendingMovies]);

  const heroMovie = orderedTrending[0];

  if (!heroMovie) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-foreground/50">
        Loading...
      </div>
    );
  }

  const heroDescription =
    heroMovie.overview?.trim() ||
    "Dive into the cinematic experience that has captivated audiences worldwide. A journey of emotion and spectacle awaits.";

  const trailerUrl =
    heroMovie.trailerUrl ||
    `https://www.youtube.com/results?search_query=${encodeURIComponent(`${heroMovie.title} trailer`)}`;

  const showExploration = isAuthenticated && watchedCount >= 100;
  const showHiddenGems = isAuthenticated && watchedCount >= 50;

  return (
    <div className="space-y-8 sm:space-y-12 pb-20">
      {/* Hero Section - Card Style */}
      <section className="relative w-full rounded-[24px] sm:rounded-[32px] md:rounded-[48px] overflow-hidden aspect-4/5 sm:aspect-video md:h-[75vh] shadow-2xl shadow-black/20 group">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={heroMovie.backdropUrl || heroMovie.posterUrl}
            alt={heroMovie.title}
            fill
            priority
            sizes="100vw"
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            style={{ willChange: "transform" }}
          />
          {/* Gradient Overlay - Minimal, just for text legibility */}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-black/60 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-12 lg:p-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ willChange: "transform, opacity" }}
            className="max-w-3xl space-y-4 sm:space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-[10px] sm:text-xs font-medium uppercase tracking-wider">
              <span>Trending Now</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white drop-shadow-sm leading-tight">
              {heroMovie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-white/90 text-xs sm:text-sm md:text-base font-medium">
              <span>{heroMovie.year}</span>
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white/40 rounded-full" />
              <span className="line-clamp-1">{heroMovie.genre.join(", ")}</span>
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white/40 rounded-full" />
              <span className="flex items-center gap-1 text-yellow-400">
                ★ {heroMovie.rating}
              </span>
            </div>

            <p className="text-sm sm:text-base md:text-lg text-white/80 line-clamp-2 sm:line-clamp-3 max-w-2xl font-light leading-relaxed">
              {heroDescription}
            </p>

            <div className="flex items-center gap-3 sm:gap-4 pt-2 sm:pt-4">
              <a
                href={trailerUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="h-11 sm:h-12 md:h-14 px-5 sm:px-6 md:px-8 rounded-full bg-white text-black font-semibold flex items-center gap-2 hover:bg-white/90 transition-all transform hover:scale-105 shadow-lg shadow-white/10 text-sm sm:text-base"
              >
                <Play size={18} className="sm:w-5 sm:h-5" fill="currentColor" />
                <span className="hidden sm:inline">Watch Trailer</span>
                <span className="sm:hidden">Watch</span>
              </a>
              <button className="h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all hover:scale-105">
                <Plus size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Personalized Recommendations - only show for authenticated users */}
      {isAuthenticated && recommendedMovies && recommendedMovies.length > 0 && (
        <section>
          <Carousel title="Recommended For You">
            {recommendedMovies.map((movie) => (
              <div
                key={movie.id}
                className="min-w-[120px] w-[120px] sm:min-w-[140px] sm:w-[140px] md:min-w-[160px] md:w-[160px] lg:min-w-[180px] lg:w-[180px] snap-start"
              >
                <MovieCard movie={movie} />
              </div>
            ))}
          </Carousel>
        </section>
      )}

      {/* Mood Section - only show for authenticated users */}
      {isAuthenticated && (
        <MoodSection
          defaultMood={defaultMood}
          cachedMoodMovies={moodMovies}
          className="pt-4"
        />
      )}

      {/* Try Something New - only show if watched >= 100 */}
      {showExploration && (
        <ExplorationSection cachedMovies={explorationMovies} />
      )}

      {/* Hidden Gems - only show if watched >= 50 */}
      {showHiddenGems && (
        <HiddenGemsSection cachedMovies={hiddenGemsMovies} />
      )}

      {/* Trending Movies Carousel */}
      <section>
        <Carousel title="Trending Movies">
          {orderedTrending.map((movie) => (
            <div key={movie.id} className="min-w-[120px] w-[120px] sm:min-w-[140px] sm:w-[140px] md:min-w-[160px] md:w-[160px] lg:min-w-[180px] lg:w-[180px] snap-start">
              <MovieCard movie={movie} />
            </div>
          ))}
        </Carousel>
      </section>

      {/* Popular Series Carousel */}
      <section>
        <Carousel title="Popular Series">
          {popularSeries.map((movie) => (
            <div key={movie.id} className="min-w-[120px] w-[120px] sm:min-w-[140px] sm:w-[140px] md:min-w-[160px] md:w-[160px] lg:min-w-[180px] lg:w-[180px] snap-start">
              <MovieCard movie={movie} aspectRatio="portrait" />
            </div>
          ))}
        </Carousel>
      </section>
    </div>
  );
}
