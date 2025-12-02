"use client";

import { useState, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Season } from '@/types';
import Image from 'next/image';
import { ChevronDown, Check, Heart, Bookmark, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleEpisodeWatchedAction, markSeasonAsWatchedAction, getWatchedEpisodesAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface SeasonListProps {
  seasons: Season[];
}

export function SeasonList({ seasons }: SeasonListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Initialize with season 1 open (or first season if season 1 doesn't exist)
  const season1 = seasons.find(s => s.seasonNumber === 1);
  const [expandedSeasonId, setExpandedSeasonId] = useState<number | null>(season1?.id || seasons[0]?.id || null);
  
  // Local state for episode interactions
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<number>>(new Set());
  const [likedEpisodes, setLikedEpisodes] = useState<Set<number>>(new Set());
  const [watchlistEpisodes, setWatchlistEpisodes] = useState<Set<number>>(new Set());
  const [isLoadingWatched, setIsLoadingWatched] = useState(true);

  // Fetch watched episodes on mount
  useEffect(() => {
    const fetchWatchedEpisodes = async () => {
      const allEpisodeIds = seasons
        .flatMap(season => season.episodes || [])
        .map(episode => episode.id);
      
      if (allEpisodeIds.length > 0) {
        const watched = await getWatchedEpisodesAction(allEpisodeIds);
        setWatchedEpisodes(watched);
      }
      setIsLoadingWatched(false);
    };

    fetchWatchedEpisodes();
  }, [seasons]);

  if (!seasons || seasons.length === 0) return null;

  const toggleSeason = (e: React.MouseEvent, seasonId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSeasonId(current => current === seasonId ? null : seasonId);
  };

  const toggleWatched = async (e: React.MouseEvent, episodeId: number) => {
    e.stopPropagation();
    const isWatched = watchedEpisodes.has(episodeId);
    const newSet = new Set(watchedEpisodes);
    
    if (isWatched) {
      newSet.delete(episodeId);
    } else {
      newSet.add(episodeId);
    }
    
    setWatchedEpisodes(newSet); // Optimistic update
    
    startTransition(async () => {
      const result = await toggleEpisodeWatchedAction(episodeId, !isWatched);
      if (result?.error) {
        // Revert on error
        const revertedSet = new Set(watchedEpisodes);
        if (!isWatched) {
          revertedSet.delete(episodeId);
        } else {
          revertedSet.add(episodeId);
        }
        setWatchedEpisodes(revertedSet);
      } else {
        router.refresh();
      }
    });
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

  const markSeasonAsWatched = async (e: React.MouseEvent, season: Season) => {
    e.stopPropagation();
    
    if (!season.episodes || season.episodes.length === 0) return;
    
    const episodeIds = season.episodes.map(ep => ep.id);
    
    // Capture previous state for potential revert
    const previousWatched = new Set(watchedEpisodes);
    
    // Optimistic update
    const newSet = new Set(watchedEpisodes);
    episodeIds.forEach(id => newSet.add(id));
    setWatchedEpisodes(newSet);
    
    startTransition(async () => {
      const result = await markSeasonAsWatchedAction(episodeIds);
      if (result?.error) {
        // Revert on error
        setWatchedEpisodes(previousWatched);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
         <span className="w-1 h-8 bg-accent rounded-full"></span>
         Seasons
      </h2>

      <div className="space-y-3">
        {seasons.map((season) => {
          const isExpanded = expandedSeasonId === season.id;
          const seasonEpisodeIds = season.episodes?.map(ep => ep.id) || [];
          const watchedCount = seasonEpisodeIds.filter(id => watchedEpisodes.has(id)).length;
          const allEpisodesWatched = seasonEpisodeIds.length > 0 && watchedCount === seasonEpisodeIds.length;
          
          return (
            <motion.div 
              key={season.id}
              initial={false}
              className="border border-border/50 rounded-2xl bg-surface/40 overflow-hidden backdrop-blur-sm transition-all duration-200 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
            >
              {/* Header - Clickable area */}
              <div className="w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-3 hover:bg-surface-hover/50 transition-colors group">
                <button
                  onClick={(e) => toggleSeason(e, season.id)}
                  className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left min-w-0"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="shrink-0"
                    >
                      <ChevronDown 
                        className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" 
                      />
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                        {season.name}
                      </h3>
                      <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {season.episodeCount} {season.episodeCount === 1 ? 'Episode' : 'Episodes'}
                        </span>
                        {watchedCount > 0 && (
                          <>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="text-xs text-muted-foreground">
                              {watchedCount}/{seasonEpisodeIds.length} watched
                            </span>
                          </>
                        )}
                        {allEpisodesWatched && (
                          <>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              Complete
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
                
                {/* Action buttons - separate from toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  {season.episodes && season.episodes.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => markSeasonAsWatched(e, season)}
                      disabled={isPending || allEpisodesWatched}
                      className={cn(
                        "hidden sm:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all border whitespace-nowrap",
                        allEpisodesWatched
                          ? "bg-green-500/10 text-green-500 border-green-500/20 cursor-default"
                          : "bg-white/5 text-foreground border-white/10 hover:bg-white/10 hover:border-white/20",
                        isPending && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <CheckCircle2 size={14} />
                      <span className="hidden lg:inline">
                        {allEpisodesWatched ? 'All Watched' : 'Mark Season as Watched'}
                      </span>
                      <span className="lg:hidden">Mark All</span>
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Content - Animated accordion */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                      open: { 
                        opacity: 1, 
                        height: "auto",
                        transition: { 
                          height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                          opacity: { duration: 0.2, delay: 0.1 }
                        }
                      },
                      collapsed: { 
                        opacity: 0, 
                        height: 0,
                        transition: { 
                          height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                          opacity: { duration: 0.15 }
                        }
                      }
                    }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 space-y-3 sm:space-y-4">
                      {season.episodes && season.episodes.length > 0 ? (
                        season.episodes.map((episode, idx) => {
                          const isWatched = watchedEpisodes.has(episode.id);
                          const isLiked = likedEpisodes.has(episode.id);
                          const isInWatchlist = watchlistEpisodes.has(episode.id);

                          return (
                            <motion.div
                              key={episode.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ 
                                delay: idx * 0.03,
                                duration: 0.2,
                                ease: [0.4, 0, 0.2, 1]
                              }}
                              className="group relative flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-black/10 border border-white/5 hover:bg-black/20 hover:border-white/10 transition-all duration-200"
                            >
                              {/* Episode Image */}
                              <div className="relative shrink-0 w-full sm:w-40 lg:w-48 aspect-video rounded-lg overflow-hidden bg-surface/50">
                                {episode.stillPath ? (
                                  <Image
                                    src={episode.stillPath}
                                    alt={episode.name}
                                    fill
                                    sizes="(max-width: 640px) 100vw, 192px"
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                                    <span className="text-muted-foreground text-xs">No Image</span>
                                  </div>
                                )}
                              </div>
             
                              {/* Info */}
                              <div className="flex-1 min-w-0 py-1 flex flex-col justify-between gap-3">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
                                        <span className="text-accent mr-2">{episode.episodeNumber}.</span>
                                        <span className="break-words">{episode.name}</span>
                                      </h4>
                                      <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium text-muted-foreground mt-2 flex-wrap">
                                        {episode.airDate && (
                                          <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                                            <Calendar size={12} />
                                            <span className="hidden sm:inline">
                                              {new Date(episode.airDate).toLocaleDateString()}
                                            </span>
                                            <span className="sm:hidden">
                                              {new Date(episode.airDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                          </span>
                                        )}
                                        {episode.runtime && (
                                          <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                                            <Clock size={12} />
                                            {episode.runtime}m
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {episode.overview && (
                                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 leading-relaxed">
                                      {episode.overview}
                                    </p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => toggleWatched(e, episode.id)}
                                    disabled={isPending}
                                    className={cn(
                                      "flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all border",
                                      isWatched 
                                        ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20" 
                                        : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground",
                                      isPending && "opacity-50 cursor-not-allowed"
                                    )}
                                  >
                                    <Check size={14} />
                                    <span className="hidden sm:inline">
                                      {isWatched ? 'Watched' : 'Mark as Watched'}
                                    </span>
                                    <span className="sm:hidden">{isWatched ? 'Watched' : 'Watch'}</span>
                                  </motion.button>
                                  
                                  <div className="h-4 w-px bg-white/10" />

                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
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
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
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
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-muted-foreground bg-black/10 rounded-xl border border-white/5">
                          <p>No episodes available for this season.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

