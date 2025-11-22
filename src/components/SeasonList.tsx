"use client";

import { useState } from 'react';
import { Season } from '@/types';
import Image from 'next/image';
import { ChevronDown, Check, Heart, Bookmark, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeasonListProps {
  seasons: Season[];
}

export function SeasonList({ seasons }: SeasonListProps) {
  // Initialize with season 1 open (or first season if season 1 doesn't exist)
  const season1 = seasons.find(s => s.seasonNumber === 1);
  const [expandedSeasonId, setExpandedSeasonId] = useState<number | null>(season1?.id || seasons[0]?.id || null);
  
  // Local state for episode interactions (mocking backend persistence)
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<number>>(new Set());
  const [likedEpisodes, setLikedEpisodes] = useState<Set<number>>(new Set());
  const [watchlistEpisodes, setWatchlistEpisodes] = useState<Set<number>>(new Set());

  if (!seasons || seasons.length === 0) return null;

  const toggleSeason = (seasonId: number) => {
    setExpandedSeasonId(current => current === seasonId ? null : seasonId);
  };

  const toggleAction = (
    e: React.MouseEvent,
    id: number, 
    set: Set<number>, 
    setState: React.Dispatch<React.SetStateAction<Set<number>>>
  ) => {
    e.stopPropagation();
    const newSet = new Set(set);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setState(newSet);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
         <span className="w-1 h-8 bg-accent rounded-full"></span>
         Seasons
      </h2>

      <div className="space-y-4">
        {seasons.map((season) => {
          const isExpanded = expandedSeasonId === season.id;
          
          return (
            <div 
              key={season.id} 
              className="border border-white/5 rounded-xl bg-surface/30 overflow-hidden transition-colors hover:border-white/10"
            >
              <button
                onClick={() => toggleSeason(season.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="text-lg font-medium text-foreground">{season.name}</span>
                  <span className="text-sm text-muted-foreground">{season.episodeCount} Episodes</span>
                </div>
                <ChevronDown 
                  className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform duration-300",
                    isExpanded && "rotate-180 text-accent"
                  )} 
                />
              </button>

              <div 
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="p-4 pt-0 grid gap-4">
                    {season.episodes && season.episodes.length > 0 ? (
                      season.episodes.map((episode) => {
                        const isWatched = watchedEpisodes.has(episode.id);
                        const isLiked = likedEpisodes.has(episode.id);
                        const isInWatchlist = watchlistEpisodes.has(episode.id);

                        return (
                          <div 
                            key={episode.id}
                            className="group relative flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-black/40 hover:border-white/10 transition-all duration-300"
                          >
                            {/* Episode Image */}
                            <div className="relative shrink-0 w-full md:w-48 aspect-video rounded-lg overflow-hidden bg-surface/50">
                               {episode.stillPath ? (
                                 <Image
                                   src={episode.stillPath}
                                   alt={episode.name}
                                   fill
                                   className="object-cover transition-transform duration-500 group-hover:scale-105"
                                 />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-white/5">
                                   <span className="text-muted-foreground text-xs">No Image</span>
                                 </div>
                               )}
                            </div>
               
                            {/* Info */}
                            <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                               <div className="flex items-start justify-between gap-4 mb-2">
                                  <div className="flex-1 min-w-0">
                                     <h4 className="text-lg font-bold text-foreground truncate pr-4">
                                       <span className="text-accent mr-3">{episode.episodeNumber}.</span>
                                       {episode.name}
                                     </h4>
                                     <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-2">
                                       {episode.airDate && (
                                           <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                                               <Calendar size={12} />
                                               {new Date(episode.airDate).toLocaleDateString()}
                                           </span>
                                       )}
                                       {episode.runtime ? (
                                           <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                                               <Clock size={12} />
                                               {episode.runtime}m
                                           </span>
                                       ) : null}
                                     </div>
                                  </div>
                               </div>
                               <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                                  {episode.overview}
                               </p>

                               {/* Actions */}
                               <div className="flex items-center gap-2">
                                 <button
                                   onClick={(e) => toggleAction(e, episode.id, watchedEpisodes, setWatchedEpisodes)}
                                   className={cn(
                                     "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all border",
                                     isWatched 
                                       ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20" 
                                       : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground"
                                   )}
                                 >
                                   <Check size={14} />
                                   {isWatched ? 'Watched' : 'Mark as Watched'}
                                 </button>
                                 
                                 <div className="h-4 w-px bg-white/10 mx-2" />

                                 <button
                                   onClick={(e) => toggleAction(e, episode.id, likedEpisodes, setLikedEpisodes)}
                                   className={cn(
                                     "p-1.5 rounded-md transition-all border",
                                     isLiked
                                       ? "bg-pink-500/10 text-pink-500 border-pink-500/20 hover:bg-pink-500/20"
                                       : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground"
                                   )}
                                   title="Like"
                                 >
                                   <Heart size={14} className={isLiked ? "fill-current" : ""} />
                                 </button>

                                 <button
                                   onClick={(e) => toggleAction(e, episode.id, watchlistEpisodes, setWatchlistEpisodes)}
                                   className={cn(
                                     "p-1.5 rounded-md transition-all border",
                                     isInWatchlist
                                       ? "bg-accent/10 text-accent border-accent/20 hover:bg-accent/20"
                                       : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground"
                                   )}
                                   title="Add to Watchlist"
                                 >
                                   <Bookmark size={14} className={isInWatchlist ? "fill-current" : ""} />
                                 </button>
                               </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-muted-foreground bg-black/20 rounded-xl border border-white/5">
                        <p>No episodes available for this season.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

