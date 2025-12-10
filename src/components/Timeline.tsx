"use client";

import { Movie } from "@/types";
import { motion } from "framer-motion";
import { MovieCard } from "./MovieCard";
import { cn } from "@/lib/utils";

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
    <div className="max-w-5xl mx-auto py-12 px-4 relative">
      {/* Vertical Line - Minimal */}
      <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-border/50 transform md:-translate-x-1/2" />

      {Object.entries(groupedMovies).map(([dateGroup, groupMovies]) => (
        <div key={dateGroup} className="mb-16 relative">
          {/* Date Marker */}
          <div className="flex md:justify-center mb-8 pl-16 md:pl-0 sticky top-24 z-10 pointer-events-none">
            <div className="bg-surface border border-border px-4 py-1.5 rounded-full text-sm font-medium text-foreground/80 shadow-sm backdrop-blur-md">
              {dateGroup}
            </div>
          </div>

          <div className="space-y-12">
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
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "transform, opacity" }}
      className={cn(
        "flex flex-col md:flex-row items-center gap-8 md:gap-16",
        align === 'right' ? 'md:flex-row-reverse' : ''
      )}
    >
      {/* Content Text */}
      <div className={cn(
        "flex-1 w-full pl-16 md:pl-0 hidden md:block",
        align === 'left' ? 'md:text-right' : 'md:text-left'
      )}>
         <h3 className="text-xl font-bold leading-tight text-foreground">{movie.title}</h3>
         <p className="text-sm text-foreground/50 mt-1 font-medium">
            Watched on{" "}
            {new Intl.DateTimeFormat("en-US", {
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            }).format(new Date(movie.watchedDate!))}
         </p>
      </div>

      {/* Center Dot */}
      <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-background rounded-full border-[3px] border-accent transform -translate-x-1/2 z-10 shadow-[0_0_0_4px_var(--surface)]" />

      {/* Card Side */}
      <div className="flex-1 w-full pl-16 md:pl-0">
         <div className={cn(
           "w-full max-w-[280px]",
           align === 'left' ? 'mr-auto md:ml-0' : 'mr-auto md:ml-auto'
         )}>
            <MovieCard movie={movie} aspectRatio="portrait" />
            {/* Mobile Text */}
            <div className="md:hidden mt-3">
                <h3 className="text-lg font-bold leading-tight">{movie.title}</h3>
                <p className="text-xs text-foreground/60 mt-1">
                  {new Intl.DateTimeFormat("en-US", {
                    day: "numeric",
                    month: "long",
                    timeZone: "UTC",
                  }).format(new Date(movie.watchedDate!))}
                </p>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
