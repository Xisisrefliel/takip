"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Season } from "@/types";
import Image from "next/image";
import {
  ChevronDown,
  Check,
  Heart,
  Bookmark,
  Calendar,
  Clock,
  CheckCircle2,
  MessageSquare,
  Star,
  X,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  toggleEpisodeWatchedAction,
  markSeasonAsWatchedAction,
  getWatchedEpisodesAction,
  getUserReviewAction,
  getReviewsAction,
  createReviewAction,
  updateReviewAction,
  deleteReviewAction,
  Review,
} from "@/app/actions";
import { useRouter } from "next/navigation";

interface SeasonListProps {
  seasons: Season[];
}

export function SeasonList({ seasons }: SeasonListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Start with all seasons collapsed by default
  const [expandedSeasonId, setExpandedSeasonId] = useState<number | null>(null);

  // Local state for episode interactions
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<number>>(
    new Set()
  );
  const [likedEpisodes, setLikedEpisodes] = useState<Set<number>>(new Set());
  const [watchlistEpisodes, setWatchlistEpisodes] = useState<Set<number>>(
    new Set()
  );
  const [expandedEpisodeReviews, setExpandedEpisodeReviews] = useState<
    Set<number>
  >(new Set());
  const [episodeReviews, setEpisodeReviews] = useState<
    Map<
      number,
      {
        review: Review | null;
        reviews: Review[];
        averageRating: number;
        count: number;
        loading?: boolean;
      }
    >
  >(new Map());
  const [showReviewForm, setShowReviewForm] = useState<Set<number>>(new Set());
  const [session, setSession] = useState<{ user: { id: string } } | null>(null);

  // Fetch session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        setSession(
          data?.user ? { user: { id: data.user.id || data.user.email } } : null
        );
      } catch {
        setSession(null);
      }
    };
    fetchSession();
  }, []);

  // Fetch watched episodes on mount
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      const allEpisodeIds = seasons
        .flatMap((season) => season.episodes || [])
        .map((episode) => episode.id);

      if (allEpisodeIds.length > 0) {
        const watched = await getWatchedEpisodesAction(allEpisodeIds);
        setWatchedEpisodes(watched);
      }
    };

    fetchData();
  }, [seasons]);

  // Lazy-load reviews for a single episode
  const loadEpisodeReviews = async (episodeId: number) => {
    setEpisodeReviews((prev) => {
      const next = new Map(prev);
      const existing = next.get(episodeId);
      if (existing?.loading) return prev;
      next.set(episodeId, {
        review: existing?.review ?? null,
        reviews: existing?.reviews ?? [],
        averageRating: existing?.averageRating ?? 0,
        count: existing?.count ?? 0,
        loading: true,
      });
      return next;
    });

    const [userReviewResult, reviewsResult] = await Promise.all([
      getUserReviewAction(undefined, undefined, episodeId),
      getReviewsAction(undefined, undefined, episodeId),
    ]);

    const reviews = reviewsResult.reviews || [];
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    setEpisodeReviews((prev) => {
      const next = new Map(prev);
      next.set(episodeId, {
        review: userReviewResult.review,
        reviews,
        averageRating,
        count: reviews.length,
        loading: false,
      });
      return next;
    });
  };

  if (!seasons || seasons.length === 0) return null;

  const toggleSeason = (e: React.MouseEvent, seasonId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSeasonId((current) => (current === seasonId ? null : seasonId));
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

    const episodeIds = season.episodes.map((ep) => ep.id);

    // Capture previous state for potential revert
    const previousWatched = new Set(watchedEpisodes);

    // Optimistic update
    const newSet = new Set(watchedEpisodes);
    episodeIds.forEach((id) => newSet.add(id));
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
          const seasonEpisodeIds = season.episodes?.map((ep) => ep.id) || [];
          const watchedCount = seasonEpisodeIds.filter((id) =>
            watchedEpisodes.has(id)
          ).length;
          const allEpisodesWatched =
            seasonEpisodeIds.length > 0 &&
            watchedCount === seasonEpisodeIds.length;

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
                      <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                        {season.name}
                      </h3>
                      <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {season.episodeCount}{" "}
                          {season.episodeCount === 1 ? "Episode" : "Episodes"}
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
                        {allEpisodesWatched
                          ? "All Watched"
                          : "Mark Season as Watched"}
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
                          opacity: { duration: 0.2, delay: 0.1 },
                        },
                      },
                      collapsed: {
                        opacity: 0,
                        height: 0,
                        transition: {
                          height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                          opacity: { duration: 0.15 },
                        },
                      },
                    }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 space-y-3 sm:space-y-4">
                      {season.episodes && season.episodes.length > 0 ? (
                        season.episodes.map((episode, idx) => {
                          const isWatched = watchedEpisodes.has(episode.id);
                          const isLiked = likedEpisodes.has(episode.id);
                          const isInWatchlist = watchlistEpisodes.has(
                            episode.id
                          );

                          return (
                            <motion.div
                              key={episode.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: idx * 0.03,
                                duration: 0.2,
                                ease: [0.4, 0, 0.2, 1],
                              }}
                              className="group relative rounded-xl bg-black/10 border border-white/5 hover:bg-black/20 hover:border-white/10 transition-all duration-200"
                            >
                              {/* Main Episode Content */}
                              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
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
                                      <span className="text-muted-foreground text-xs">
                                        No Image
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 py-1 flex flex-col justify-between gap-3">
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
                                          <span className="text-accent mr-2">
                                            {episode.episodeNumber}.
                                          </span>
                                          <span className="break-words">
                                            {episode.name}
                                          </span>
                                        </h4>
                                        <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium text-muted-foreground mt-2 flex-wrap">
                                          {episode.airDate && (
                                            <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                                              <Calendar size={12} />
                                              <span className="hidden sm:inline">
                                                {new Intl.DateTimeFormat(
                                                  "en-US",
                                                  {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                    timeZone: "UTC",
                                                  }
                                                ).format(
                                                  new Date(episode.airDate)
                                                )}
                                              </span>
                                              <span className="sm:hidden">
                                                {new Intl.DateTimeFormat(
                                                  "en-US",
                                                  {
                                                    month: "short",
                                                    day: "numeric",
                                                    timeZone: "UTC",
                                                  }
                                                ).format(
                                                  new Date(episode.airDate)
                                                )}
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
                                      onClick={(e) =>
                                        toggleWatched(e, episode.id)
                                      }
                                      disabled={isPending}
                                      className={cn(
                                        "flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all border",
                                        isWatched
                                          ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                                          : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground",
                                        isPending &&
                                          "opacity-50 cursor-not-allowed"
                                      )}
                                    >
                                      <Check size={14} />
                                      <span className="hidden sm:inline">
                                        {isWatched
                                          ? "Watched"
                                          : "Mark as Watched"}
                                      </span>
                                      <span className="sm:hidden">
                                        {isWatched ? "Watched" : "Watch"}
                                      </span>
                                    </motion.button>

                                    <div className="h-4 w-px bg-white/10" />

                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) =>
                                        toggleAction(
                                          e,
                                          episode.id,
                                          likedEpisodes,
                                          setLikedEpisodes
                                        )
                                      }
                                      className={cn(
                                        "p-1.5 rounded-md transition-all border",
                                        isLiked
                                          ? "bg-pink-500/10 text-pink-500 border-pink-500/20 hover:bg-pink-500/20"
                                          : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground"
                                      )}
                                      title="Like"
                                    >
                                      <Heart
                                        size={14}
                                        className={
                                          isLiked ? "fill-current" : ""
                                        }
                                      />
                                    </motion.button>

                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) =>
                                        toggleAction(
                                          e,
                                          episode.id,
                                          watchlistEpisodes,
                                          setWatchlistEpisodes
                                        )
                                      }
                                      className={cn(
                                        "p-1.5 rounded-md transition-all border",
                                        isInWatchlist
                                          ? "bg-accent/10 text-accent border-accent/20 hover:bg-accent/20"
                                          : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground"
                                      )}
                                      title="Add to Watchlist"
                                    >
                                      <Bookmark
                                        size={14}
                                        className={
                                          isInWatchlist ? "fill-current" : ""
                                        }
                                      />
                                    </motion.button>

                                    <div className="h-4 w-px bg-white/10" />

                                    {session && (
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          loadEpisodeReviews(episode.id);
                                          const newSet = new Set(
                                            showReviewForm
                                          );
                                          if (newSet.has(episode.id)) {
                                            newSet.delete(episode.id);
                                            setEditingReviewId((prev) => {
                                              const next = new Map(prev);
                                              next.delete(episode.id);
                                              return next;
                                            });
                                          } else {
                                            newSet.add(episode.id);
                                            const userReview =
                                              episodeReviews.get(
                                                episode.id
                                              )?.review;
                                            if (userReview) {
                                              setEditingReviewId((prev) =>
                                                new Map(prev).set(
                                                  episode.id,
                                                  userReview.id
                                                )
                                              );
                                            }
                                          }
                                          setShowReviewForm(newSet);
                                        }}
                                        className={cn(
                                          "p-1.5 rounded-md transition-all border flex items-center gap-1",
                                          showReviewForm.has(episode.id)
                                            ? "bg-accent/10 text-accent border-accent/20 hover:bg-accent/20"
                                            : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground"
                                        )}
                                        title="Write a review"
                                      >
                                        <MessageSquare size={14} />
                                      </motion.button>
                                    )}

                                    <>
                                      <div className="h-4 w-px bg-white/10" />
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          loadEpisodeReviews(episode.id);
                                          const newSet = new Set(
                                            expandedEpisodeReviews
                                          );
                                          if (newSet.has(episode.id)) {
                                            newSet.delete(episode.id);
                                          } else {
                                            newSet.add(episode.id);
                                          }
                                          setExpandedEpisodeReviews(newSet);
                                        }}
                                        className={cn(
                                          "p-1.5 rounded-md transition-all border flex items-center gap-1",
                                          expandedEpisodeReviews.has(episode.id)
                                            ? "bg-accent/10 text-accent border-accent/20 hover:bg-accent/20"
                                            : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground"
                                        )}
                                        title="View reviews"
                                      >
                                        <Star
                                          size={12}
                                          className="text-yellow-500 fill-yellow-500"
                                        />
                                        <span className="text-[10px]">
                                          {episodeReviews.get(episode.id)
                                            ?.count ?? "Reviews"}
                                        </span>
                                      </motion.button>
                                    </>
                                  </div>
                                </div>
                              </div>

                              {/* Inline Review Form */}
                              <AnimatePresence>
                                {showReviewForm.has(episode.id) && session && (
                                  <EpisodeReviewForm
                                    key={
                                      episodeReviews.get(episode.id)?.review?.id ??
                                      episode.id
                                    }
                                    episodeId={episode.id}
                                    existingReview={
                                      episodeReviews.get(episode.id)?.review ||
                                      null
                                    }
                                    onSuccess={async () => {
                                      await loadEpisodeReviews(episode.id);
                                      // Close form after successful submit
                                      setShowReviewForm((prev) => {
                                        const next = new Set(prev);
                                        next.delete(episode.id);
                                        return next;
                                      });
                                      setEditingReviewId((prev) => {
                                        const next = new Map(prev);
                                        next.delete(episode.id);
                                        return next;
                                      });
                                    }}
                                    onCancel={() => {
                                      setShowReviewForm((prev) => {
                                        const next = new Set(prev);
                                        next.delete(episode.id);
                                        return next;
                                      });
                                      setEditingReviewId((prev) => {
                                        const next = new Map(prev);
                                        next.delete(episode.id);
                                        return next;
                                      });
                                    }}
                                  />
                                )}
                              </AnimatePresence>

                              {/* Episode Reviews List */}
                              <AnimatePresence>
                                {expandedEpisodeReviews.has(episode.id) && (
                                  <EpisodeReviewsList
                                    episodeReviews={episodeReviews.get(
                                      episode.id
                                    )}
                                    onToggle={() => {
                                      const newSet = new Set(
                                        expandedEpisodeReviews
                                      );
                                      if (newSet.has(episode.id)) {
                                        newSet.delete(episode.id);
                                      } else {
                                        newSet.add(episode.id);
                                      }
                                      setExpandedEpisodeReviews(newSet);
                                    }}
                                  />
                                )}
                              </AnimatePresence>
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

// Inline Episode Review Form Component
interface EpisodeReviewFormProps {
  episodeId: number;
  existingReview: Review | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function EpisodeReviewForm({
  episodeId,
  existingReview,
  onSuccess,
  onCancel,
}: EpisodeReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [text, setText] = useState(existingReview?.text || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      return;
    }

    startTransition(async () => {
      let result;
      if (existingReview) {
        result = await updateReviewAction(
          existingReview.id,
          rating,
          text || null
        );
      } else {
        result = await createReviewAction(
          rating,
          text || null,
          undefined,
          undefined,
          episodeId
        );
      }

      if (result?.error) {
        console.error(result.error);
      } else {
        router.refresh();
        onSuccess();
      }
    });
  };

  const handleDelete = async () => {
    if (!existingReview?.id) return;

    startTransition(async () => {
      const result = await deleteReviewAction(existingReview.id);
      if (result?.error) {
        console.error(result.error);
      } else {
        router.refresh();
        onSuccess();
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="w-full px-3 sm:px-4 pb-3 sm:pb-4 border-t border-white/10 overflow-hidden"
    >
      <motion.form
        initial={{ y: -10 }}
        animate={{ y: 0 }}
        exit={{ y: -10 }}
        transition={{ duration: 0.2 }}
        onSubmit={handleSubmit}
        className="space-y-3 p-3 rounded-lg bg-black/20 border border-white/10 mt-3"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">
            {existingReview ? "Edit Review" : "Write a Review"}
          </h4>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>

        {/* Star Rating */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rating:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
                disabled={isPending}
              >
                <Star
                  size={16}
                  className={cn(
                    "transition-colors",
                    star <= (hoveredRating || rating)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                {rating}/5
              </span>
            )}
          </div>
        </div>

        {/* Review Text */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your thoughts... (optional)"
          rows={2}
          className="w-full px-3 py-2 rounded-md bg-background/50 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent transition-all resize-none"
          disabled={isPending}
        />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            type="submit"
            disabled={isPending || rating === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              rating === 0
                ? "bg-muted-foreground/20 text-muted-foreground cursor-not-allowed"
                : "bg-accent text-accent-foreground hover:bg-accent/90",
              isPending && "opacity-50 cursor-not-allowed"
            )}
          >
            <Send size={12} />
            <span>{existingReview ? "Update" : "Submit"}</span>
          </motion.button>

          {existingReview && (
            <motion.button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </motion.button>
          )}
        </div>
      </motion.form>
    </motion.div>
  );
}

// Episode Reviews List Component
interface EpisodeReviewsListProps {
  episodeReviews?: {
    review: Review | null;
    reviews: Review[];
    averageRating: number;
    count: number;
    loading?: boolean;
  };
  onToggle: () => void;
}

function EpisodeReviewsList({
  episodeReviews,
  onToggle,
}: EpisodeReviewsListProps) {
  const loading = episodeReviews?.loading;
  const allReviews = (episodeReviews?.reviews || []).filter(
    (r) => !episodeReviews?.review || r.id !== episodeReviews.review.id
  );

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full mt-3 pt-3 border-t border-white/10 overflow-hidden"
      >
        <div className="h-8 bg-surface/50 rounded-lg animate-pulse" />
      </motion.div>
    );
  }

  if (allReviews.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="w-full px-3 sm:px-4 pb-3 sm:pb-4 border-t border-white/10 overflow-hidden"
    >
      <motion.div
        initial={{ y: -10 }}
        animate={{ y: 0 }}
        exit={{ y: -10 }}
        transition={{ duration: 0.2 }}
        className="space-y-2 pt-3"
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageSquare size={14} className="text-accent" />
            Other Reviews ({allReviews.length})
          </h4>
          <button
            onClick={onToggle}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Hide
          </button>
        </div>
        {allReviews.map((review, idx) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="p-2.5 rounded-lg border border-white/5 bg-black/10"
          >
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center overflow-hidden shrink-0">
                {review.userImage ? (
                  <Image
                    src={review.userImage}
                    alt={review.userName || "User"}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-foreground/60 font-semibold text-xs">
                    {review.userName?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-xs">
                    {review.userName || "Anonymous"}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    }).format(new Date(review.createdAt))}
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={10}
                      className={
                        star <= review.rating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-muted-foreground/20"
                      }
                    />
                  ))}
                </div>
                {review.text && (
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {review.text}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
