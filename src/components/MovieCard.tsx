"use client";

import { useState, useTransition, useCallback, useEffect, memo, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, ClockPlus, ClockCheck, Heart, Check } from "lucide-react";
import { Movie } from "@/types";
import { cn } from "@/lib/utils";
import { toggleWatchedAction, toggleWatchlistAction, toggleLikedAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useLongPress } from "@/hooks/useLongPress";

interface MovieCardProps {
  movie: Movie;
  aspectRatio?: "portrait" | "landscape";
  className?: string;
  onWatchedChange?: (movieId: string, newValue: boolean) => void;
  onLikedChange?: (movieId: string, newValue: boolean) => void;
  onWatchlistChange?: (movieId: string, newValue: boolean) => void;
}

function MovieCardInner({
  movie,
  aspectRatio = "portrait",
  className,
  onWatchedChange,
  onLikedChange,
  onWatchlistChange,
}: MovieCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isHovered, setIsHovered] = useState(false);
  const [watched, setWatched] = useState(movie.watched ?? false);
  const [watchlist, setWatchlist] = useState(movie.watchlist ?? false);
  const [liked, setLiked] = useState(movie.liked ?? false);

  const mediaType = movie.mediaType === 'tv' ? 'tv' : 'movie';

  const handleWatched = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = !watched;
    setWatched(newValue);
    startTransition(async () => {
      const result = await toggleWatchedAction(movie.id, mediaType as "movie" | "tv" | "book", newValue);
      if (result?.error) {
        setWatched(!newValue);
      } else {
        onWatchedChange?.(movie.id, newValue);
        router.refresh();
      }
    });
  }, [movie.id, mediaType, router, watched, onWatchedChange]);

  const handleWatchlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = !watchlist;
    setWatchlist(newValue);
    startTransition(async () => {
      const result = await toggleWatchlistAction(movie.id, mediaType as "movie" | "tv" | "book", newValue);
      if (result?.error) {
        setWatchlist(!newValue);
      } else {
        onWatchlistChange?.(movie.id, newValue);
        router.refresh();
      }
    });
  }, [movie.id, mediaType, router, watchlist, onWatchlistChange]);

  const handleLiked = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = !liked;
    setLiked(newValue);
    startTransition(async () => {
      const result = await toggleLikedAction(movie.id, mediaType as "movie" | "tv" | "book", newValue);
      if (result?.error) {
        setLiked(!newValue);
      } else {
        onLikedChange?.(movie.id, newValue);
        router.refresh();
      }
    });
  }, [movie.id, mediaType, router, liked, onLikedChange]);

  const { isLongPressed, dismiss: dismissLongPress, handlers: longPressHandlers } = useLongPress(300);
  const showActions = isHovered || isLongPressed;

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  // Dismiss long press when tapping outside
  useEffect(() => {
    if (!isLongPressed) return;
    const handleTouch = (e: TouchEvent) => {
      const target = e.target as Node;
      const card = document.getElementById(`movie-card-${movie.id}`);
      if (card && !card.contains(target)) {
        dismissLongPress();
      }
    };
    document.addEventListener("touchstart", handleTouch);
    return () => document.removeEventListener("touchstart", handleTouch);
  }, [isLongPressed, dismissLongPress, movie.id]);

  return (
    <Link href={`/${movie.mediaType}/${movie.id}`} className={cn("block", className)} {...longPressHandlers}>
      <div
        id={`movie-card-${movie.id}`}
        className={cn("group flex flex-col gap-3", isLongPressed && "scale-[0.97] transition-transform duration-150")}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Card Container */}
        <div
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
            <div
              className={`absolute inset-0 flex items-end justify-center gap-2 pb-3 z-20 transition-opacity duration-150 ease-out ${showActions ? 'opacity-100' : 'opacity-0'}`}
            >
              {isLongPressed && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              )}
              <ActionButton
                active={watched}
                onClick={(e) => { handleWatched(e); dismissLongPress(); }}
                icon={watched ? Check : Eye}
                label="Watched"
                disabled={isPending}
              />
              <ActionButton
                active={liked}
                onClick={(e) => { handleLiked(e); dismissLongPress(); }}
                icon={Heart}
                label="Like"
                fill={liked}
                className={liked ? "text-red-500 bg-white" : ""}
                disabled={isPending}
              />
              <ActionButton
                active={watchlist}
                onClick={(e) => { handleWatchlist(e); dismissLongPress(); }}
                icon={watchlist ? ClockCheck : ClockPlus}
                label="Watchlist"
                disabled={isPending}
              />
            </div>

            {/* Status Badges (Top Right) */}
            {!showActions && (
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
        </div>

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

// Memoized MovieCard - prevents re-renders when parent re-renders with same movie data
export const MovieCard = memo(MovieCardInner, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.movie.id === nextProps.movie.id &&
    prevProps.movie.watched === nextProps.movie.watched &&
    prevProps.movie.liked === nextProps.movie.liked &&
    prevProps.movie.watchlist === nextProps.movie.watchlist &&
    prevProps.aspectRatio === nextProps.aspectRatio &&
    prevProps.className === nextProps.className &&
    prevProps.onWatchedChange === nextProps.onWatchedChange &&
    prevProps.onLikedChange === nextProps.onLikedChange &&
    prevProps.onWatchlistChange === nextProps.onWatchlistChange
  );
});

MovieCard.displayName = "MovieCard";

const ActionButton = memo(function ActionButton({
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
  icon: ComponentType<{ size?: number; fill?: string; className?: string }>;
  label: string;
  className?: string;
  fill?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-150 backdrop-blur-sm btn-press",
        active
          ? "bg-white/95 text-black shadow-md"
          : "bg-black/50 text-white/90 hover:bg-black/60 hover:text-white",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      title={label}
    >
      <Icon
        size={15}
        {...(fill ? { fill: "currentColor" } : {})}
      />
    </button>
  );
});
