"use client";

import { Carousel } from "@/components/Carousel";
import { MovieCard } from "@/components/MovieCard";
import { motion } from "framer-motion";
import { Play, Plus } from "lucide-react";
import { Movie } from "@/types";
import Image from "next/image";

interface HomePageProps {
  trendingMovies: Movie[];
  popularSeries: Movie[];
}

export function HomePage({ trendingMovies, popularSeries }: HomePageProps) {
  const heroMovie = trendingMovies[0]; 

  if (!heroMovie) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-foreground/50">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section - Card Style */}
      <section className="relative w-full rounded-[32px] md:rounded-[48px] overflow-hidden aspect-4/5 md:h-[75vh] shadow-2xl shadow-black/20 group">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={heroMovie.backdropUrl || heroMovie.posterUrl}
            alt={heroMovie.title}
            fill
            priority
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            style={{ willChange: "transform" }}
          />
          {/* Gradient Overlay - Minimal, just for text legibility */}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-black/60 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ willChange: "transform, opacity" }}
            className="max-w-3xl space-y-6"
          >
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-xs font-medium uppercase tracking-wider">
                <span>Trending Now</span>
             </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-sm">
              {heroMovie.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm md:text-base font-medium">
               <span>{heroMovie.year}</span>
               <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
               <span>{heroMovie.genre.join(", ")}</span>
               <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
               <span className="flex items-center gap-1 text-yellow-400">
                 ★ {heroMovie.rating}
               </span>
            </div>
            
            <p className="text-lg text-white/80 line-clamp-2 max-w-2xl font-light leading-relaxed">
              Dive into the cinematic experience that has captivated audiences worldwide. A journey of emotion and spectacle awaits.
            </p>

            <div className="flex items-center gap-4 pt-4">
               <button className="h-14 px-8 rounded-full bg-white text-black font-semibold flex items-center gap-2 hover:bg-white/90 transition-all transform hover:scale-105 shadow-lg shadow-white/10">
                  <Play size={20} fill="currentColor" />
                  Watch Trailer
               </button>
               <button className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all hover:scale-105">
                  <Plus size={24} />
               </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trending Movies Carousel */}
      <section>
         <Carousel title="Trending Movies">
            {trendingMovies.map((movie) => (
               <div key={movie.id} className="min-w-[140px] w-[140px] md:min-w-[180px] md:w-[180px] snap-start">
                  <MovieCard movie={movie} />
               </div>
            ))}
         </Carousel>
      </section>

      {/* Popular Series Carousel */}
      <section>
         <Carousel title="Popular Series">
            {popularSeries.map((movie) => (
               <div key={movie.id} className="min-w-[200px] w-[200px] md:min-w-[280px] md:w-[280px] snap-start">
                   {/* Using landscape for series */}
                  <MovieCard movie={movie} aspectRatio="landscape" />
               </div>
            ))}
         </Carousel>
      </section>
    </div>
  );
}
