"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, Edit2 } from "lucide-react";
import { getReviewsAction, getUserReviewAction, Review } from "@/app/actions";
import { ReviewForm } from "./ReviewForm";
import Image from "next/image";

interface ReviewsProps {
  mediaId?: string;
  mediaType?: "movie" | "tv";
  episodeId?: number;
  compact?: boolean;
}

export function Reviews({ mediaId, mediaType, episodeId, compact = false }: ReviewsProps) {
  const [session, setSession] = useState<{ user: { id: string } } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        setSession(data?.user ? { user: { id: data.user.id || data.user.email } } : null);
      } catch {
        setSession(null);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      const [reviewsResult, userReviewResult] = await Promise.all([
        getReviewsAction(mediaId, mediaType, episodeId),
        getUserReviewAction(mediaId, mediaType, episodeId),
      ]);

      if (reviewsResult.reviews) {
        setReviews(reviewsResult.reviews);
      }
      if (userReviewResult.review) {
        setUserReview(userReviewResult.review);
      }
      setIsLoading(false);
    };

    fetchReviews();
  }, [mediaId, mediaType, episodeId]);

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingReview(null);
    // Refresh reviews
    const fetchReviews = async () => {
      const [reviewsResult, userReviewResult] = await Promise.all([
        getReviewsAction(mediaId, mediaType, episodeId),
        getUserReviewAction(mediaId, mediaType, episodeId),
      ]);

      if (reviewsResult.reviews) {
        setReviews(reviewsResult.reviews);
      }
      if (userReviewResult.review) {
        setUserReview(userReviewResult.review);
      }
    };
    fetchReviews();
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-surface/50 rounded-lg animate-pulse" />
        <div className="h-32 bg-surface/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  const allReviews = userReview
    ? [userReview, ...reviews.filter((r) => r.id !== userReview.id)]
    : reviews;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-accent" />
          <h2 className="text-xl sm:text-2xl font-bold">Reviews</h2>
          {reviews.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({reviews.length})
            </span>
          )}
        </div>
        {averageRating > 0 && (
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">
              {averageRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* User's Review */}
      {session && (
        <div className="space-y-3">
          {userReview && !editingReview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-accent/20 bg-accent/5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
                    {userReview.userImage ? (
                      <Image
                        src={userReview.userImage}
                        alt={userReview.userName || "You"}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-accent font-semibold text-sm">
                        {userReview.userName?.[0]?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {userReview.userName || "You"}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={12}
                          className={
                            star <= userReview.rating
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground/20"
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setEditingReview(userReview)}
                  className="p-1.5 rounded-md hover:bg-surface-hover transition-colors"
                >
                  <Edit2 size={14} className="text-muted-foreground" />
                </button>
              </div>
              {userReview.text && (
                <p className="text-sm text-foreground/80 mt-2">
                  {userReview.text}
                </p>
              )}
            </motion.div>
          )}

          {(showForm || editingReview) && (
            <ReviewForm
              mediaId={mediaId}
              mediaType={mediaType}
              episodeId={episodeId}
              existingReview={editingReview || undefined}
              onCancel={() => {
                setShowForm(false);
                setEditingReview(null);
              }}
              onSuccess={handleFormSubmit}
              compact={compact}
            />
          )}

          {!userReview && !showForm && !editingReview && (
            <div>
              <ReviewForm
                mediaId={mediaId}
                mediaType={mediaType}
                episodeId={episodeId}
                onSuccess={handleFormSubmit}
                compact={true}
              />
            </div>
          )}
        </div>
      )}

      {/* Other Reviews */}
      {allReviews.length > 0 && (
        <div className="space-y-4">
          {allReviews.map((review, idx) => {
            const isUserReview = session?.user?.id === review.userId;
            if (isUserReview && userReview && review.id === userReview.id) {
              return null; // Already shown above
            }

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-xl border border-border bg-surface/30 hover:bg-surface/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center overflow-hidden shrink-0">
                    {review.userImage ? (
                      <Image
                        src={review.userImage}
                        alt={review.userName || "User"}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-foreground/60 font-semibold text-sm">
                        {review.userName?.[0]?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">
                        {review.userName || "Anonymous"}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={12}
                          className={
                            star <= review.rating
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground/20"
                          }
                        />
                      ))}
                    </div>
                    {review.text && (
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {review.text}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {allReviews.length === 0 && !session && (
        <div className="text-center py-12 text-muted-foreground bg-surface/30 rounded-xl border border-border">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No reviews yet. Be the first to review!</p>
        </div>
      )}
    </div>
  );
}

