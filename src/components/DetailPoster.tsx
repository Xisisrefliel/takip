"use client";

import type { ComponentType, MouseEvent } from "react";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Eye, ClockPlus, ClockCheck, Heart, Check } from "lucide-react";
import { Movie, Book } from "@/types";
import { cn } from "@/lib/utils";
import {
  toggleWatchedAction,
  toggleWatchlistAction,
  toggleLikedAction,
} from "@/app/actions";
import { useRouter } from "next/navigation";

interface DetailPosterProps {
  item: Movie | Book;
  initialWatched?: boolean;
  initialWatchlist?: boolean;
  initialLiked?: boolean;
}

export function DetailPoster({
  item,
  initialWatched = false,
  initialWatchlist = false,
  initialLiked = false,
}: DetailPosterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [watched, setWatched] = useState(initialWatched);
  const [watchlist, setWatchlist] = useState(initialWatchlist);
  const [liked, setLiked] = useState(initialLiked);

  const mediaType =
    "posterUrl" in item ? (item.mediaType === "tv" ? "tv" : "movie") : "book";

  const handleWatched = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = !watched;
    setWatched(newValue); // Optimistic update
    startTransition(async () => {
      const result = await toggleWatchedAction(
        item.id,
        mediaType as "movie" | "tv" | "book",
        newValue
      );
      if (result?.error) {
        setWatched(!newValue); // Revert on error
      } else {
        router.refresh();
      }
    });
  };

  const handleWatchlist = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = !watchlist;
    setWatchlist(newValue); // Optimistic update
    startTransition(async () => {
      const result = await toggleWatchlistAction(
        item.id,
        mediaType as "movie" | "tv" | "book",
        newValue
      );
      if (result?.error) {
        setWatchlist(!newValue); // Revert on error
      } else {
        router.refresh();
      }
    });
  };

  const handleLiked = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = !liked;
    setLiked(newValue); // Optimistic update
    startTransition(async () => {
      const result = await toggleLikedAction(
        item.id,
        mediaType as "movie" | "tv" | "book",
        newValue
      );
      if (result?.error) {
        setLiked(!newValue); // Revert on error
      } else {
        router.refresh();
      }
    });
  };

  const posterUrl = "posterUrl" in item ? item.posterUrl : item.coverImage;

  return (
    <div className="relative aspect-2/3 rounded-[16px] sm:rounded-[20px] md:rounded-[24px] overflow-hidden shadow-2xl border border-white/10 transform transition-transform duration-500 hover:rotate-y-6 hover:scale-105">
      <Image
        src={posterUrl}
        alt={item.title}
        fill
        className="object-cover"
        priority
        sizes="(max-width: 640px) 240px, (max-width: 768px) 280px, 350px"
      />

      {/* Gradient Overlay for text visibility */}
      <div className="absolute inset-x-0 bottom-0 h-24 sm:h-32 bg-linear-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      {/* Actions - Always Visible */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-2 sm:gap-3 md:gap-4 pb-4 sm:pb-5 md:pb-6 z-10">
        <ActionButton
          active={watched}
          onClick={handleWatched}
          icon={watched ? Check : Eye}
          label="Watched"
          disabled={isPending}
        />
        <ActionButton
          active={liked}
          onClick={handleLiked}
          icon={Heart}
          label="Like"
          fill={liked}
          className={liked ? "text-red-500 bg-white" : ""}
          disabled={isPending}
        />
        <ActionButton
          active={watchlist}
          onClick={handleWatchlist}
          icon={watchlist ? ClockCheck : ClockPlus}
          label="Watchlist"
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
  disabled = false,
}: {
  active?: boolean;
  onClick: (e: MouseEvent) => void;
  icon: ComponentType<{ size?: number; fill?: string; className?: string }>;
  label: string;
  className?: string;
  fill?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.1 }}
      whileTap={disabled ? {} : { scale: 0.9 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all shadow-xl border hover:shadow-2xl",
        active
          ? "bg-white text-black border-white/40 hover:bg-white hover:text-black"
          : "bg-black/60 text-white border-white/20 hover:bg-black/70 hover:text-white hover:border-white/30",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      title={label}
      aria-label={label}
    >
      <Icon
        size={18}
        {...(fill ? { fill: "currentColor" } : {})}
      />
    </motion.button>
  );
}
