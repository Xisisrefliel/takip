"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Eye, Plus, Heart, Check } from "lucide-react";
import { Movie, Book } from "@/types";
import { cn } from "@/lib/utils";
import { toggleWatchedAction, toggleWatchlistAction, toggleLikedAction } from "@/app/actions";
import { useRouter } from "next/navigation";

interface DetailPosterProps {
  item: Movie | Book;
  initialWatched?: boolean;
  initialWatchlist?: boolean;
  initialLiked?: boolean;
}

export function DetailPoster({ item, initialWatched = false, initialWatchlist = false, initialLiked = false }: DetailPosterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [watched, setWatched] = useState(initialWatched);
  const [watchlist, setWatchlist] = useState(initialWatchlist);
  const [liked, setLiked] = useState(initialLiked);

  const mediaType = 'posterUrl' in item ? (item.mediaType === 'tv' ? 'tv' : 'movie') : 'book';
  
  const handleWatched = () => {
    const newValue = !watched;
    setWatched(newValue); // Optimistic update
    startTransition(async () => {
      const result = await toggleWatchedAction(item.id, mediaType as "movie" | "tv" | "book", newValue);
      if (result?.error) {
        setWatched(!newValue); // Revert on error
      } else {
        router.refresh();
      }
    });
  };

  const handleWatchlist = () => {
    const newValue = !watchlist;
    setWatchlist(newValue); // Optimistic update
    startTransition(async () => {
      const result = await toggleWatchlistAction(item.id, mediaType as "movie" | "tv" | "book", newValue);
      if (result?.error) {
        setWatchlist(!newValue); // Revert on error
      } else {
        router.refresh();
      }
    });
  };

  const handleLiked = () => {
    const newValue = !liked;
    setLiked(newValue); // Optimistic update
    startTransition(async () => {
      const result = await toggleLikedAction(item.id, mediaType as "movie" | "tv" | "book", newValue);
      if (result?.error) {
        setLiked(!newValue); // Revert on error
      } else {
        router.refresh();
      }
    });
  };

  const posterUrl = 'posterUrl' in item ? item.posterUrl : item.coverImage;

  return (
    <div className="relative aspect-2/3 rounded-[24px] overflow-hidden shadow-2xl border border-white/10 transform transition-transform duration-500 hover:rotate-y-6 hover:scale-105 group">
      <Image
        src={posterUrl}
        alt={item.title}
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
          onClick={handleWatched}
          icon={watched ? Check : Eye}
          label="Watched"
          size="lg"
          disabled={isPending}
        />
        <ActionButton
          active={liked}
          onClick={handleLiked}
          icon={Heart}
          label="Like"
          fill={liked}
          className={liked ? "text-red-500 bg-white border-white" : ""}
          size="lg"
          disabled={isPending}
        />
        <ActionButton
          active={watchlist}
          onClick={handleWatchlist}
          icon={Plus}
          label="Watchlist"
          size="lg"
          disabled={isPending}
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
  size = "md",
  disabled = false
}: { 
  active?: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string;
  className?: string;
  fill?: boolean;
  size?: "md" | "lg";
  disabled?: boolean;
}) {
  const sizeClasses = size === "lg" ? "w-12 h-12" : "w-9 h-9";
  const iconSize = size === "lg" ? 20 : 16;

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.1 }}
      whileTap={disabled ? {} : { scale: 0.9 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      className={cn(
        sizeClasses,
        "rounded-full flex items-center justify-center bg-black/40 text-white backdrop-blur-md hover:bg-white hover:text-black transition-all shadow-xl border border-white/20",
        active && "bg-white text-black border-white",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      title={label}
    >
      <Icon size={iconSize} fill={fill ? "currentColor" : "none"} />
    </motion.button>
  );
}

