"use client";

import { useRef } from "react";
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
    <div className="py-8 w-full">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface border border-border hover:bg-surface-hover text-foreground/70 hover:text-foreground transition-colors shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface border border-border hover:bg-surface-hover text-foreground/70 hover:text-foreground transition-colors shadow-sm"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-6 pb-8 -mx-4 px-4 hide-scrollbar snap-x snap-mandatory"
      >
        {children}
      </div>
    </div>
  );
}
