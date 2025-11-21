"use client";

import { useRef } from "react";
import { motion, useScroll } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselProps {
  title: string;
  children: React.ReactNode;
}

export function Carousel({ title, children }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = current.clientWidth * 0.8;
      current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="py-4 w-full">
      <div className="flex items-center justify-between mb-2 px-4 md:px-6">
        <h2 className="text-xl md:text-2xl font-serif tracking-wide text-foreground">
          {title}
        </h2>
        <div className="flex gap-1.5">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-foreground/70 hover:text-foreground"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-foreground/70 hover:text-foreground"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-3 px-4 md:px-6 hide-scrollbar snap-x snap-mandatory pb-2"
        style={{ scrollBehavior: "smooth" }}
      >
        {children}
      </div>
    </div>
  );
}

