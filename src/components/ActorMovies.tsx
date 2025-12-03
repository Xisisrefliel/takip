"use client";

import { useState, useEffect } from "react";
import { Movie } from "@/types";
import { MovieCard } from "@/components/MovieCard";
import { ArrowUpDown } from "lucide-react";

interface ActorMoviesProps {
  movies: Movie[];
  actorName: string;
}

type SortOption = "popularity" | "newest" | "oldest";

export function ActorMovies({ movies: initialMovies, actorName }: ActorMoviesProps) {
  const [sortOption, setSortOption] = useState<SortOption>("popularity");
  const [sortedMovies, setSortedMovies] = useState<Movie[]>(initialMovies);

  useEffect(() => {
    const sorted = [...initialMovies].sort((a, b) => {
      switch (sortOption) {
        case "popularity":
          // Polished popularity sort:
          // 1. Prioritize items with vote counts (valid movies) over empty/junk entries.
          // 2. If both have votes, use popularity metric.
          // 3. If one has 0 votes but is future released, treat as potentially high interest.
          
          const getWeight = (m: Movie) => {
            const hasVotes = (m.voteCount || 0) > 0;
            const isFuture = m.year > new Date().getFullYear();
            const hasPoster = m.posterUrl && !m.posterUrl.includes("placeholder");
            
            if (hasVotes) return 1000 + (m.popularity || 0);
            if (isFuture) return 500 + (m.popularity || 0); // Future movies without votes yet (hype)
            if (hasPoster) return 100 + (m.popularity || 0); // Has poster but no votes
            return -1000; // Junk
          };
          
          return getWeight(b) - getWeight(a);
        case "newest":
          return new Date(b.releaseDate || b.year.toString()).getTime() - new Date(a.releaseDate || a.year.toString()).getTime();
        case "oldest":
          return new Date(a.releaseDate || a.year.toString()).getTime() - new Date(b.releaseDate || b.year.toString()).getTime();
        default:
          return 0;
      }
    });
    setSortedMovies(sorted);
  }, [sortOption, initialMovies]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span className="text-muted-foreground font-medium block text-xl mb-1">Starring</span>
              {actorName}
            </h1>
            <p className="text-muted-foreground text-lg">{sortedMovies.length} movies</p>
        </div>

        <div className="flex items-center gap-3 bg-surface border border-white/10 rounded-lg px-4 py-2">
            <ArrowUpDown size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none text-foreground appearance-none pr-4"
            >
                <option value="popularity" className="bg-background">Popularity</option>
                <option value="newest" className="bg-background">Newest First</option>
                <option value="oldest" className="bg-background">Oldest First</option>
            </select>
        </div>
      </div>

      {sortedMovies.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
          {sortedMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No movies found for this actor.</p>
      )}
    </div>
  );
}

