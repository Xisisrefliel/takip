"use client";

import { Movie } from "@/types";
import { motion } from "framer-motion";
import { MovieCard } from "./MovieCard";

interface TimelineProps {
  movies: Movie[];
}

export function Timeline({ movies }: TimelineProps) {
  // Group movies by Month Year
  const groupedMovies = movies.reduce((acc, movie) => {
    if (!movie.watchedDate) return acc;
    const date = new Date(movie.watchedDate);
    const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(movie);
    return acc;
  }, {} as Record<string, Movie[]>);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 relative">
      {/* Vertical Line */}
      <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-white/10 to-transparent transform -translate-x-1/2" />

      {Object.entries(groupedMovies).map(([dateGroup, groupMovies], groupIndex) => (
        <div key={dateGroup} className="mb-10 relative">
          {/* Date Marker */}
          <div className="flex justify-center mb-6 sticky top-20 z-10">
            <div className="bg-surface/80 backdrop-blur-md border border-white/10 px-3 py-0.5 rounded-full text-xs font-serif text-accent shadow-sm">
              {dateGroup}
            </div>
          </div>

          <div className="space-y-8">
            {groupMovies.map((movie, index) => (
              <TimelineItem 
                key={movie.id} 
                movie={movie} 
                align={index % 2 === 0 ? "left" : "right"} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineItem({ movie, align }: { movie: Movie; align: "left" | "right" }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768; // Simple check, better with hook
  // Forcing left align on mobile would be better via CSS
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className={`flex flex-col md:flex-row items-center gap-4 ${align === 'right' ? 'md:flex-row-reverse' : ''}`}
    >
      {/* Content Side */}
      <div className={`flex-1 w-full ${align === 'left' ? 'md:text-right' : 'md:text-left'} pl-10 md:pl-0`}>
        <div className="hidden md:block">
           <h3 className="text-lg font-serif leading-tight">{movie.title}</h3>
           <p className="text-xs text-foreground/60">Watched on {new Date(movie.watchedDate!).toLocaleDateString()}</p>
           <p className="text-xs text-foreground/40 mt-1 line-clamp-2">A fantastic journey through time and space...</p>
        </div>
      </div>

      {/* Center Dot */}
      <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-accent rounded-full border-2 border-background transform -translate-x-1/2 z-10" />

      {/* Card Side */}
      <div className="flex-1 w-full pl-10 md:pl-0">
         <div className={`w-32 md:w-36 ${align === 'left' ? 'mr-auto' : 'ml-auto'}`}>
            <MovieCard movie={movie} aspectRatio="portrait" />
            {/* Mobile Text shown below card */}
            <div className="md:hidden mt-2">
                <h3 className="text-base font-serif leading-tight">{movie.title}</h3>
                <p className="text-[10px] text-foreground/60">{new Date(movie.watchedDate!).toLocaleDateString()}</p>
            </div>
         </div>
      </div>
    </motion.div>
  );
}

