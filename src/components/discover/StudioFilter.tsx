"use client";

import { useState } from "react";
import { MAJOR_STUDIOS } from "@/data/studios";
import { ChevronDown, ChevronUp } from "lucide-react";

interface StudioFilterProps {
  selectedStudios: number[];
  onChange: (studios: number[]) => void;
}

export default function StudioFilter({
  selectedStudios,
  onChange,
}: StudioFilterProps) {
  const [showAll, setShowAll] = useState(false);
  const displayStudios = showAll ? MAJOR_STUDIOS : MAJOR_STUDIOS.slice(0, 12);

  const toggleStudio = (studioId: number) => {
    if (selectedStudios.includes(studioId)) {
      onChange(selectedStudios.filter((id) => id !== studioId));
    } else {
      onChange([...selectedStudios, studioId]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider">
        Studios
        {selectedStudios.length > 0 && (
          <span className="ml-2 text-foreground font-semibold">
            ({selectedStudios.length})
          </span>
        )}
      </label>
      <div className="flex flex-wrap gap-2">
        {displayStudios.map((studio) => {
          const isSelected = selectedStudios.includes(studio.id);
          return (
            <button
              key={studio.id}
              onClick={() => toggleStudio(studio.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 btn-press ${
                isSelected
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-surface border border-border/30 text-foreground/60 hover:bg-surface-hover hover:text-foreground hover:border-border"
              }`}
            >
              {studio.name}
            </button>
          );
        })}
      </div>
      {MAJOR_STUDIOS.length > 12 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1.5 text-xs font-medium text-foreground/60 hover:text-foreground transition-all duration-200 px-2 py-1 rounded-lg hover:bg-surface-hover"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Show more ({MAJOR_STUDIOS.length - 12})
            </>
          )}
        </button>
      )}
    </div>
  );
}
