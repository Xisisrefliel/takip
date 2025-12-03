"use client";

import { useState, useTransition, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Plus, Heart } from "lucide-react";
import { Movie } from "@/types";
import { cn } from "@/lib/utils";
import { toggleWatchedAction, toggleWatchlistAction, toggleLikedAction } from "@/app/actions";
import { useRouter } from "next/navigation";

interface MovieCardProps {
  movie: Movie;
  aspectRatio?: "portrait" | "landscape";
  className?: string;
}

export function MovieCard({ movie, aspectRatio = "portrait", className }: MovieCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isHovered, setIsHovered] = useState(false);
  const [watched, setWatched] = useState(movie.watched ?? false);
  const [watchlist, setWatchlist] = useState(movie.watchlist ?? false);
  const [liked, setLiked] = useState(movie.liked ?? false);

  // Sync state with props when they change (e.g., after router.refresh())
  useEffect(() => {
    setWatched(movie.watched ?? false);
    setWatchlist(movie.watchlist ?? false);
    setLiked(movie.liked ?? false);
  }, [movie.watched, movie.watchlist, movie.liked]);

  const mediaType = movie.mediaType === 'tv' ? 'tv' : 'movie';

  const handleWatched = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = !watched;
    setWatched(newValue);
    startTransition(async () => {
      const result = await toggleWatchedAction(movie.id, mediaType as "movie" | "tv" | "book", newValue);
      if (result?.error) {
        setWatched(!newValue);
      } else {
        router.refresh();
      }
    });
  };

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = !watchlist;
    setWatchlist(newValue);
    startTransition(async () => {
      const result = await toggleWatchlistAction(movie.id, mediaType as "movie" | "tv" | "book", newValue);
      if (result?.error) {
        setWatchlist(!newValue);
      } else {
        router.refresh();
      }
    });
  };

  const handleLiked = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = !liked;
    setLiked(newValue);
    startTransition(async () => {
      const result = await toggleLikedAction(movie.id, mediaType as "movie" | "tv" | "book", newValue);
      if (result?.error) {
        setLiked(!newValue);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <Link href={`/${movie.mediaType}/${movie.id}`} className={cn("block", className)}>
      <div 
        className={cn("group flex flex-col gap-3")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Card Container */}
        <motion.div
          className={cn(
            "relative rounded-[16px] hover-border",
            isHovered && "hover-border-active"
          )}
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-[16px] bg-surface shadow-sm",
              aspectRatio === "portrait" ? "aspect-2/3" : "aspect-video"
            )}
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
            <motion.div
                className="absolute inset-0 flex items-end justify-center gap-2 pb-3 z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                style={{ willChange: "opacity" }}
            >
                <ActionButton
                  active={watched}
                  onClick={handleWatched}
                  icon={watched ? EyeOff : Eye}
                  label="Watched"
                  fill={watched}
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
                  icon={Plus}
                  label="Watchlist"
                  fill={watchlist}
                  disabled={isPending}
                />
            </motion.div>

            {/* Status Badges (Top Right) */}
            {!isHovered && (
               <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-none z-20">
                  {watched && (
                      <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] shadow-accent/50" />
                  )}
                  {liked && (
                      <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] shadow-red-500/50" />
                  )}
               </div>
            )}
          </div>
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
    </Link>
  );
}

function ActionButton({ 
  active, 
  onClick, 
  icon: Icon, 
  label, 
  className,
  fill,
  disabled = false
}: { 
  active?: boolean; 
  onClick: (e: React.MouseEvent) => void; 
  icon: any; 
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
        "w-9 h-9 rounded-full flex items-center justify-center bg-black/60 text-white backdrop-blur-sm hover:bg-white hover:text-black transition-all shadow-xl border border-white/20",
        active && "bg-white text-black",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      title={label}
    >
      <Icon size={16} fill={fill ? "currentColor" : "none"} />
    </motion.button>
  );
}
