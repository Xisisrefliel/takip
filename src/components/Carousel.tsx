"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  hideHeader?: boolean;
  hideControls?: boolean;
}

export function Carousel({
  title,
  children,
  className,
  hideHeader = false,
  hideControls = false,
}: CarouselProps) {
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

  const renderButton = (direction: "left" | "right") => (
    <button
      onClick={() => scroll(direction)}
      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-surface border border-border hover:bg-surface-hover text-foreground/70 hover:text-foreground transition-colors shadow-sm"
      aria-label={`Scroll ${direction}`}
    >
      {direction === "left" ? (
        <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
      ) : (
        <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
      )}
    </button>
  );

  return (
    <div className={cn("py-6 sm:py-8 w-full", className)}>
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-2">
          {title ? (
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
          ) : (
            <div />
          )}
          {!hideControls && (
            <div className="flex gap-1.5 sm:gap-2">
              {renderButton("left")}
              {renderButton("right")}
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex h-full overflow-x-auto gap-4 sm:gap-6 pb-6 sm:pb-8 -mx-4 px-4 hide-scrollbar snap-x snap-mandatory"
        >
          {children}
        </div>
        {hideHeader && !hideControls && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="flex h-full items-center justify-between px-2">
              <div className="pointer-events-auto">{renderButton("left")}</div>
              <div className="pointer-events-auto">{renderButton("right")}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
