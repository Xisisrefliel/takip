"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { FavoriteStat } from "../actions";
import { motion } from "motion/react";

type Props = {
  data?: FavoriteStat[];
};

export function FavoritesGrid({ data }: Props) {
  if (!data || data.length === 0) return null;

  const highlighted = data.slice(0, 5);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {highlighted.map((movie, idx) => {
        const hasRating = typeof movie.rating === "number";
        return (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="group relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-white/10 shadow-lg shadow-black/5"
          >
            <div className="aspect-[2/3] w-full">
              {movie.posterUrl ? (
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  width={360}
                  height={540}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width: 768px) 45vw, (max-width: 1280px) 30vw, 20vw"
                  priority={idx < 2}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-black/5 dark:bg-white/5 px-2 text-center text-xs font-semibold uppercase tracking-tight text-foreground/60">
                  {movie.title.slice(0, 24)}
                </div>
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <p className="line-clamp-2 text-sm font-semibold text-white">{movie.title}</p>
              {hasRating ? (
                <div className="mt-1 flex items-center gap-1 text-[0.65rem] uppercase tracking-wide text-white/75">
                  <Star className="h-3 w-3 text-amber-300" />
                  <span>{movie.rating}/5</span>
                </div>
              ) : (
                <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-white/40">No rating yet</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
