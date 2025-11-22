"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Eye, Plus, Heart, Check } from "lucide-react";
import { Movie } from "@/types";
import { cn } from "@/lib/utils";

interface DetailPosterProps {
  movie: Movie;
}

export function DetailPoster({ movie }: DetailPosterProps) {
  const [watched, setWatched] = useState(movie.watched);
  const [watchlist, setWatchlist] = useState(movie.watchlist);
  const [liked, setLiked] = useState(movie.liked);

  return (
    <div className="relative aspect-2/3 rounded-[24px] overflow-hidden shadow-2xl border border-white/10 transform transition-transform duration-500 hover:rotate-y-6 hover:scale-105 group">
      <Image
        src={movie.posterUrl}
        alt={movie.title}
        fill
        className="object-cover"
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {/* Gradient Overlay for text visibility */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      {/* Actions - Always Visible */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-4 pb-6 z-10">
        <ActionButton
          active={watched}
          onClick={() => setWatched(!watched)}
          icon={watched ? Check : Eye}
          label="Watched"
          size="lg"
        />
        <ActionButton
          active={liked}
          onClick={() => setLiked(!liked)}
          icon={Heart}
          label="Like"
          fill={liked}
          className={liked ? "text-red-500 bg-white border-white" : ""}
          size="lg"
        />
        <ActionButton
          active={watchlist}
          onClick={() => setWatchlist(!watchlist)}
          icon={Plus}
          label="Watchlist"
          size="lg"
        />
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
  fill,
  size = "md"
}: { 
  active?: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string;
  className?: string;
  fill?: boolean;
  size?: "md" | "lg";
}) {
  const sizeClasses = size === "lg" ? "w-12 h-12" : "w-9 h-9";
  const iconSize = size === "lg" ? 20 : 16;

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        sizeClasses,
        "rounded-full flex items-center justify-center bg-black/40 text-white backdrop-blur-md hover:bg-white hover:text-black transition-all shadow-xl border border-white/20",
        active && "bg-white text-black border-white",
        className
      )}
      title={label}
    >
      <Icon size={iconSize} fill={fill ? "currentColor" : "none"} />
    </motion.button>
  );
}

