"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Plus, Heart, Check } from "lucide-react";
import { Movie } from "@/types";
import { cn } from "@/lib/utils";

interface MovieCardProps {
  movie: Movie;
  aspectRatio?: "portrait" | "landscape";
  className?: string;
}

export function MovieCard({ movie, aspectRatio = "portrait", className }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [watched, setWatched] = useState(movie.watched);
  const [watchlist, setWatchlist] = useState(movie.watchlist);
  const [liked, setLiked] = useState(movie.liked);

  return (
    <motion.div
      className={cn(
        "relative group overflow-hidden rounded-xl bg-surface cursor-pointer",
        aspectRatio === "portrait" ? "aspect-[2/3]" : "aspect-video",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Image */}
      <img
        src={movie.posterUrl}
        alt={movie.title}
        className="w-full h-full object-cover transition-transform duration-500"
      />

      {/* Gradient Overlay - Always visible slightly, fully on hover */}
      <div
        className={cn(
          "absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-60"
        )}
      />

      {/* Actions Overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 p-2.5 flex flex-col gap-1.5"
          >
             <h3 className="text-white font-serif text-base leading-tight drop-shadow-md line-clamp-1">
              {movie.title} <span className="text-white/60 text-xs font-sans ml-1">({movie.year})</span>
            </h3>
            
            <div className="flex items-center justify-between mt-1">
              <div className="flex gap-1.5">
                {/* Watched Toggle */}
                <ActionButton
                  active={watched}
                  onClick={() => setWatched(!watched)}
                  icon={watched ? Check : Eye}
                  label="Watched"
                />
                {/* Watchlist Toggle */}
                <ActionButton
                  active={watchlist}
                  onClick={() => setWatchlist(!watchlist)}
                  icon={Plus}
                  label="Watchlist"
                  className={watchlist ? "bg-accent/20 text-accent" : ""}
                />
                {/* Like Toggle */}
                <ActionButton
                  active={liked}
                  onClick={() => setLiked(!liked)}
                  icon={Heart}
                  label="Like"
                  className={liked ? "text-red-500" : ""}
                  fill={liked}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Status Indicators (visible when not hovering) */}
      {!isHovered && (
        <div className="absolute top-2 right-2 flex flex-col gap-1">
            {watched && <div className="bg-accent text-white p-1 rounded-full text-xs"><Eye size={12} /></div>}
            {liked && <div className="bg-red-500 text-white p-1 rounded-full text-xs"><Heart size={12} fill="currentColor" /></div>}
        </div>
      )}
    </motion.div>
  );
}

function ActionButton({ 
  active, 
  onClick, 
  icon: Icon, 
  label, 
  className,
  fill
}: { 
  active?: boolean; 
  onClick: (e: React.MouseEvent) => void; 
  icon: any; 
  label: string;
  className?: string;
  fill?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={cn(
        "p-1.5 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors text-white",
        active && "bg-white text-black",
        className
      )}
      title={label}
    >
      <Icon size={14} fill={fill ? "currentColor" : "none"} />
    </button>
  );
}

