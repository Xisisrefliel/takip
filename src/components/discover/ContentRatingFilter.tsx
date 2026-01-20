"use client";

interface ContentRatingFilterProps {
  value?: string;
  mediaType: "movie" | "tv";
  onChange: (certification?: string) => void;
}

const MOVIE_RATINGS = ["G", "PG", "PG-13", "R", "NC-17"];
const TV_RATINGS = ["TV-Y", "TV-G", "TV-PG", "TV-14", "TV-MA"];

export default function ContentRatingFilter({
  value,
  mediaType,
  onChange,
}: ContentRatingFilterProps) {
  const ratings = mediaType === "movie" ? MOVIE_RATINGS : TV_RATINGS;

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider">
        Content Rating
      </label>
      <div className="flex flex-wrap gap-2">
        {ratings.map((rating) => {
          const isSelected = value === rating;
          return (
            <button
              key={rating}
              onClick={() => onChange(isSelected ? undefined : rating)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 btn-press ${
                isSelected
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-surface border border-border/30 text-foreground/60 hover:bg-surface-hover hover:text-foreground hover:border-border"
              }`}
            >
              {rating}
            </button>
          );
        })}
        {value && (
          <button
            onClick={() => onChange(undefined)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface border border-border/30 text-foreground/60 hover:bg-surface-hover hover:text-foreground hover:border-border transition-all duration-200 btn-press"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
