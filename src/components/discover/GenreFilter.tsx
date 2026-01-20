"use client";

import { GENRE_IDS } from "@/lib/constants";

interface GenreFilterProps {
  selectedGenres: number[];
  onChange: (genres: number[]) => void;
}

export default function GenreFilter({
  selectedGenres,
  onChange,
}: GenreFilterProps) {
  const genres = Object.entries(GENRE_IDS).map(([name, id]) => ({
    id,
    name,
  }));

  const toggleGenre = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      onChange(selectedGenres.filter((id) => id !== genreId));
    } else {
      onChange([...selectedGenres, genreId]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider">
        Genres
        {selectedGenres.length > 0 && (
          <span className="ml-2 text-foreground font-semibold">({selectedGenres.length})</span>
        )}
      </label>
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => {
          const isSelected = selectedGenres.includes(genre.id);
          return (
            <button
              key={genre.id}
              onClick={() => toggleGenre(genre.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 btn-press ${
                isSelected
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-surface border border-border/30 text-foreground/60 hover:bg-surface-hover hover:text-foreground hover:border-border"
              }`}
            >
              {genre.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
