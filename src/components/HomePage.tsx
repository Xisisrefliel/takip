"use client";

import { Carousel } from "@/components/Carousel";
import { MovieCard } from "@/components/MovieCard";
import { motion } from "framer-motion";
import { Play, Plus } from "lucide-react";
import { Movie } from "@/types";

interface HomePageProps {
  trendingMovies: Movie[];
  popularSeries: Movie[];
}

export function HomePage({ trendingMovies, popularSeries }: HomePageProps) {
  const heroMovie = trendingMovies[0]; 

  if (!heroMovie) {
    return (
      <div className="h-screen flex items-center justify-center text-white/50">
        Loading or no content available...
      </div>
    );
  }

  return (
    <div className="pb-12 w-2/3 mx-auto">
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroMovie.backdropUrl || heroMovie.posterUrl}
            alt={heroMovie.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-background via-background/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-16 md:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl space-y-4"
          >
             <div className="flex items-center gap-3 text-accent font-medium tracking-widest uppercase text-xs">
                <span className="w-6 h-px bg-accent" />
                Trending Now
             </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight text-white drop-shadow-lg">
              {heroMovie.title}
            </h1>
            <div className="flex items-center gap-3 text-white/80 text-sm">
               <span>{heroMovie.year}</span>
               <span className="w-1 h-1 bg-white/40 rounded-full" />
               <span>{heroMovie.genre.join(", ")}</span>
               <span className="w-1 h-1 bg-white/40 rounded-full" />
               <span className="text-yellow-400 font-bold">★ {heroMovie.rating}</span>
            </div>
            <p className="text-base text-white/70 line-clamp-2 md:line-clamp-none max-w-lg">
              Experience the cinematic masterpiece that has everyone talking. Dive into a world of adventure and intrigue.
            </p>

            <div className="flex items-center gap-3 pt-2">
               <button className="px-6 py-2 bg-accent text-white font-bold rounded-full flex items-center gap-2 hover:bg-accent/90 transition-all transform hover:scale-105 text-sm">
                  <Play size={16} fill="currentColor" />
                  Watch Trailer
               </button>
               <button className="px-6 py-2 bg-white/10 backdrop-blur-md text-white font-bold rounded-full flex items-center gap-2 hover:bg-white/20 transition-all border border-white/10 text-sm">
                  <Plus size={16} />
                  Add to Watchlist
               </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trending Movies Carousel */}
      <section className="mt-[-40px] relative z-10 pl-4">
         <Carousel title="Trending Movies">
            {trendingMovies.map((movie) => (
               <div key={movie.id} className="min-w-[140px] w-[140px] md:min-w-[180px] md:w-[180px] snap-start">
                  <MovieCard movie={movie} />
               </div>
            ))}
         </Carousel>
      </section>

      {/* Popular Series Carousel */}
      <section className="mt-4 pl-4">
         <Carousel title="Popular Series">
            {popularSeries.map((movie) => (
               <div key={movie.id} className="min-w-[200px] w-[200px] md:min-w-[260px] md:w-[260px] snap-start">
                   {/* Using landscape for series just for variety */}
                  <MovieCard movie={movie} aspectRatio="landscape" />
               </div>
            ))}
         </Carousel>
      </section>
    </div>
  );
}

