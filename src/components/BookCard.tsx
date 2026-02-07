"use client";

import { useState, type ComponentType } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Plus, Heart, Check, BookOpen } from "lucide-react";
import { Book } from "@/types";
import { cn } from "@/lib/utils";

interface BookCardProps {
  book: Book;
  className?: string;
}

export function BookCard({ book, className }: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [read, setRead] = useState(false);
  const [watchlist, setWatchlist] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
    <div className={cn("block w-full", className)}>
      <Link href={`/book/${book.id}`} className="block outline-none">
      <div
        id={`book-card-${book.id}`}
        className="group flex flex-col gap-3 w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Card Container */}
        <motion.div
          className={cn(
            "relative overflow-hidden rounded-[12px] md:rounded-[16px] bg-surface shadow-sm border border-transparent transition-colors duration-300 aspect-[2/3]",
            isHovered && "border-accent"
          )}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* Image */}
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            loading="lazy"
          />

          {/* Spine Effect */}
          <div className="absolute inset-y-0 left-0 w-1.5 md:w-2 bg-linear-to-r from-black/40 to-transparent opacity-60 pointer-events-none" />

          {/* Desktop Overlay Actions (hover) */}
          <div className={cn(
              "absolute inset-0 items-end justify-center gap-2 pb-3 transition-opacity duration-300 hidden md:flex",
              isHovered ? "opacity-100" : "opacity-0"
          )}>
              <ActionButton
                active={read}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRead(!read);
                }}
                icon={read ? Check : BookOpen}
                label="Read"
              />
              <ActionButton
                active={liked}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLiked(!liked);
                }}
                icon={Heart}
                label="Like"
                fill={liked}
                className={liked ? "text-red-500 bg-white" : ""}
              />
              <ActionButton
                active={watchlist}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setWatchlist(!watchlist);
                }}
                icon={Plus}
                label="Wishlist"
              />
          </div>

          {/* Mobile Action Strip (always visible) */}
          <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-1.5 py-1.5 z-20 bg-gradient-to-t from-black/70 via-black/40 to-transparent md:hidden">
              <ActionButton
                size="sm"
                active={read}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRead(!read);
                }}
                icon={read ? Check : BookOpen}
                label="Read"
              />
              <ActionButton
                size="sm"
                active={liked}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLiked(!liked);
                }}
                icon={Heart}
                label="Like"
                fill={liked}
                className={liked ? "text-red-500 bg-white" : ""}
              />
              <ActionButton
                size="sm"
                active={watchlist}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setWatchlist(!watchlist);
                }}
                icon={Plus}
                label="Wishlist"
              />
          </div>

          {/* Status Badges (Top Right) - Desktop only */}
          {!isHovered && (
             <div className="absolute top-3 right-3 hidden md:flex flex-col gap-2 pointer-events-none">
                {read && (
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
            {book.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-foreground/50">
            <span className="truncate">{book.author}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground/40">
            <span>{book.year}</span>
            {book.rating && (
              <>
                <span className="w-1 h-1 rounded-full bg-foreground/20" />
                <span className="flex items-center gap-1">
                  <span className="text-yellow-500/80">★</span> {book.rating.toFixed(1)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      </Link>
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
  size = "default",
}: {
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
  icon: ComponentType<{ size?: number; fill?: string; className?: string }>;
  label: string;
  className?: string;
  fill?: boolean;
  size?: "default" | "sm";
}) {
  const btnClass = cn(
    "rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-150",
    size === "sm" ? "w-7 h-7" : "w-9 h-9 sm:w-8 sm:h-8",
    active
      ? "bg-white/95 text-black shadow-md"
      : "bg-black/50 text-white/90 hover:bg-black/60 hover:text-white",
    className
  );
  const iconSize = size === "sm" ? 12 : 15;

  if (size === "sm") {
    return (
      <button onClick={onClick} className={btnClass} title={label}>
        <Icon size={iconSize} fill={fill ? "currentColor" : "none"} />
      </button>
    );
  }

  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      style={{ willChange: "transform, opacity" }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={onClick}
      className={btnClass}
      title={label}
    >
      <Icon size={iconSize} fill={fill ? "currentColor" : "none"} />
    </motion.button>
  );
}

