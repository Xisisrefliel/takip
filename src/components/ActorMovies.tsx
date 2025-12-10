"use client";

import { useMemo, useState, useEffect } from "react";
import { Movie } from "@/types";
import { MovieCard } from "@/components/MovieCard";
import { ArrowUpDown } from "lucide-react";

interface ActorMoviesProps {
  movies: Movie[];
  actorName: string;
  actorDetails?: {
    profileUrl?: string;
    biography?: string;
    birthday?: string;
    deathday?: string | null;
    placeOfBirth?: string;
    knownForDepartment?: string;
  };
}

type SortOption = "popularity" | "newest" | "oldest";

const calculateAge = (birthday?: string, deathday?: string | null) => {
  if (!birthday) return undefined;
  const start = new Date(birthday);
  if (Number.isNaN(start.getTime())) return undefined;

  const end = deathday ? new Date(deathday) : new Date();
  if (Number.isNaN(end.getTime())) return undefined;

  let age = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < start.getDate())) {
    age -= 1;
  }
  return age;
};

const formatDate = (value?: string | null) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function ActorMovies({ movies: initialMovies, actorName, actorDetails }: ActorMoviesProps) {
  const [sortOption, setSortOption] = useState<SortOption>("popularity");
  const [sortedMovies, setSortedMovies] = useState<Movie[]>(initialMovies);
  const [showFullBio, setShowFullBio] = useState(false);

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

  const age = useMemo(
    () => calculateAge(actorDetails?.birthday, actorDetails?.deathday),
    [actorDetails]
  );

  const bioPreview = useMemo(() => {
    if (!actorDetails?.biography) return undefined;
    const clean = actorDetails.biography.trim();
    if (clean.length <= 260) return clean;
    return `${clean.slice(0, 260)}…`;
  }, [actorDetails]);

  const bioFull = actorDetails?.biography?.trim();
  const hasLongBio = !!bioFull && bioFull.length > 260;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 md:p-6 shadow-lg">
        <div className="flex flex-col gap-5 md:gap-6">
          <div className="grid gap-5 md:gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)] items-start">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Starring</p>
                <h1 className="text-3xl md:text-4xl font-semibold leading-tight">{actorName}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <span className="rounded-full border border-white/10 px-3 py-1 bg-white/5">{sortedMovies.length} movies</span>
                  {actorDetails?.knownForDepartment && (
                    <span className="rounded-full border border-white/10 px-3 py-1 bg-white/5">
                      Known for {actorDetails.knownForDepartment.toLowerCase()}
                    </span>
                  )}
                  {age !== undefined && (
                    <span className="rounded-full border border-white/10 px-3 py-1 bg-white/5">
                      {age} {actorDetails?.deathday ? "yrs (at passing)" : "years old"}
                    </span>
                  )}
                </div>
              </div>

              <div className="max-w-2xl text-sm text-muted-foreground space-y-1">
                {actorDetails?.placeOfBirth && (
                  <p className="text-foreground">From {actorDetails.placeOfBirth}</p>
                )}
                {formatDate(actorDetails?.birthday) && (
                  <p>Born {formatDate(actorDetails?.birthday)}</p>
                )}
                {formatDate(actorDetails?.deathday) && (
                  <p>Passed {formatDate(actorDetails?.deathday)}</p>
                )}
                {bioPreview && (
                  <p className="pt-1 leading-relaxed text-foreground/80">
                    {showFullBio && bioFull ? bioFull : bioPreview}
                    {hasLongBio && !showFullBio && (
                      <button
                        type="button"
                        className="ml-2 text-foreground/80 underline underline-offset-4 hover:text-foreground"
                        onClick={() => setShowFullBio(true)}
                      >
                        Read more
                      </button>
                    )}
                    {hasLongBio && showFullBio && (
                      <button
                        type="button"
                        className="ml-2 text-foreground/80 underline underline-offset-4 hover:text-foreground"
                        onClick={() => setShowFullBio(false)}
                      >
                        Show less
                      </button>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="flex lg:justify-end">
              <div className="w-auto max-w-[240px] h-28 md:h-32 lg:h-full overflow-hidden rounded-xl border border-white/10 bg-surface/60 shadow-sm flex items-center justify-center">
                {actorDetails?.profileUrl ? (
                  <img
                    src={actorDetails.profileUrl}
                    alt={actorName}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No portrait
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Filmography sorted your way.
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <ArrowUpDown size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sort by</span>
              <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none text-foreground appearance-none pr-4"
              >
                  <option value="popularity" className="bg-background text-foreground">Popularity</option>
                  <option value="newest" className="bg-background text-foreground">Newest First</option>
                  <option value="oldest" className="bg-background text-foreground">Oldest First</option>
              </select>
            </div>
          </div>
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

