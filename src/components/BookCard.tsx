"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Eye, Plus, Heart, Check, BookOpen } from "lucide-react";
import { Book } from "@/types";
import { cn } from "@/lib/utils";

interface BookCardProps {
  book: Book;
  className?: string;
}

export function BookCard({ book, className }: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [read, setRead] = useState(false); // Default to false since not in Book type
  const [watchlist, setWatchlist] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
    <div className={cn("block w-full", className)}>
      <Link href={`/book/${book.id}`} className="block outline-none">
      <div 
        className={cn("group flex flex-col gap-3 w-full")}
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

          {/* Overlay Actions - Minimal */}
          <div className={cn(
              "absolute inset-0 flex items-end justify-center gap-2 pb-3 transition-opacity duration-300",
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

          {/* Status Badges (Top Right) */}
          {!isHovered && (
             <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-none">
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
      onClick={onClick}
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

