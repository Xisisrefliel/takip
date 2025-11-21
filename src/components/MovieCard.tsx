"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
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
    <div 
      className={cn("group flex flex-col gap-3", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Container */}
      <motion.div
        className={cn(
          "relative overflow-hidden rounded-[16px] bg-surface shadow-sm border border-transparent transition-colors duration-300",
          isHovered && "border-accent",
          aspectRatio === "portrait" ? "aspect-2/3" : "aspect-video"
        )}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Image */}
        <Image
          src={movie.posterUrl}
          alt={movie.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          loading="lazy"
        />

        {/* Overlay Actions - Minimal */}
        <div className={cn(
            "absolute inset-0 flex items-end justify-center gap-2 pb-3 transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            <ActionButton
              active={watched}
              onClick={() => setWatched(!watched)}
              icon={watched ? Check : Eye}
              label="Watched"
            />
            <ActionButton
              active={liked}
              onClick={() => setLiked(!liked)}
              icon={Heart}
              label="Like"
              fill={liked}
              className={liked ? "text-red-500 bg-white" : ""}
            />
            <ActionButton
              active={watchlist}
              onClick={() => setWatchlist(!watchlist)}
              icon={Plus}
              label="Watchlist"
            />
        </div>

        {/* Status Badges (Top Right) */}
        {!isHovered && (
           <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-none">
              {watched && (
                  <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] shadow-accent/50" />
              )}
              {liked && (
                  <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] shadow-red-500/50" />
              )}
           </div>
        )}
      </motion.div>

      {/* Info Below */}
      <div className="px-1 space-y-0.5">
        <h3 className="font-semibold text-foreground/90 text-base leading-tight truncate group-hover:text-accent transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-foreground/50">
          <span>{movie.year}</span>
          {movie.rating && (
            <>
              <span className="w-1 h-1 rounded-full bg-foreground/20" />
              <span className="flex items-center gap-1">
                <span className="text-yellow-500/80">★</span> {movie.rating}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
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
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{ willChange: "transform, opacity" }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center bg-black/60 text-white backdrop-blur-sm hover:bg-white hover:text-black transition-all shadow-xl border border-white/20",
        active && "bg-white text-black",
        className
      )}
      title={label}
    >
      <Icon size={16} fill={fill ? "currentColor" : "none"} />
    </motion.button>
  );
}
