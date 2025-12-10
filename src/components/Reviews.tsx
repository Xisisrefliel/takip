"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, Edit2 } from "lucide-react";
import type { Review } from "@/app/actions";
import { ReviewForm } from "./ReviewForm";
import Image from "next/image";

interface ReviewsProps {
  mediaId?: string;
  mediaType?: "movie" | "tv";
  episodeId?: number;
  compact?: boolean;
  initialReviews?: Review[];
  initialUserReview?: Review | null;
  sessionUserId?: string | null;
}

export function Reviews({
  mediaId,
  mediaType,
  episodeId,
  compact = false,
  initialReviews = [],
  initialUserReview = null,
  sessionUserId: sessionUserIdProp = null,
}: ReviewsProps) {
  const [sessionUserId, setSessionUserId] = useState<string | null>(sessionUserIdProp);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [userReview, setUserReview] = useState<Review | null>(initialUserReview);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    setReviews(initialReviews);
    setUserReview(initialUserReview);
    setIsLoading(false);
  }, [initialReviews, initialUserReview]);

  useEffect(() => {
    setSessionUserId(sessionUserIdProp);
  }, [sessionUserIdProp]);

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingReview(null);
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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 sm:h-8 bg-accent rounded-full"></div>
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Reviews
            </h2>
            {reviews.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-surface border border-border text-xs sm:text-sm text-muted-foreground font-medium">
                {reviews.length}
              </span>
            )}
          </div>
        </div>
        {averageRating > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border"
          >
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-semibold text-foreground">
              {averageRating.toFixed(1)}
            </span>
          </motion.div>
        )}
      </div>

      {/* User's Review */}
      {sessionUserId && (
        <div className="space-y-4">
          {userReview && !editingReview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 sm:p-6 rounded-xl border border-accent/30 bg-gradient-to-br from-accent/10 via-accent/5 to-surface/50 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center overflow-hidden shrink-0">
                    {userReview.userImage ? (
                      <Image
                        src={userReview.userImage}
                        alt={userReview.userName || "You"}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-accent font-bold text-base sm:text-lg">
                        {userReview.userName?.[0]?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm sm:text-base text-foreground">
                        {userReview.userName || "You"}
                      </p>
                      <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] sm:text-xs font-medium">
                        Your Review
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
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
                  className="p-2 rounded-lg hover:bg-accent/20 transition-colors group"
                  aria-label="Edit review"
                >
                  <Edit2 size={16} className="text-muted-foreground group-hover:text-accent transition-colors" />
                </button>
              </div>
              {userReview.text && (
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed pl-0 sm:pl-16">
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center py-8 sm:py-10"
            >
              <motion.button
                onClick={() => setShowForm(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group flex items-center gap-2.5 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-surface border-2 border-border hover:border-accent text-foreground font-semibold transition-all shadow-sm hover:shadow-md"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-accent group-hover:scale-110 transition-transform" />
                <span className="text-sm sm:text-base">Write a review</span>
              </motion.button>
            </motion.div>
          )}
        </div>
      )}

      {/* Other Reviews */}
      {allReviews.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          {allReviews.map((review, idx) => {
            const isUserReview = sessionUserId === review.userId;
            if (isUserReview && userReview && review.id === userReview.id) {
              return null; // Already shown above
            }

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group p-4 sm:p-5 rounded-xl border border-border bg-surface/50 hover:bg-surface/70 hover:border-accent/30 transition-all duration-300"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden shrink-0 group-hover:border-accent/30 transition-colors">
                    {review.userImage ? (
                      <Image
                        src={review.userImage}
                        alt={review.userName || "User"}
                        width={44}
                        height={44}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-foreground/60 font-semibold text-sm sm:text-base">
                        {review.userName?.[0]?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <p className="font-semibold text-sm sm:text-base text-foreground">
                        {review.userName || "Anonymous"}
                      </p>
                      <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-2.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={13}
                          className={
                            star <= review.rating
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground/20"
                          }
                        />
                      ))}
                    </div>
                    {review.text && (
                      <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
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

      {allReviews.length === 0 && !sessionUserId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 sm:py-16 text-muted-foreground bg-surface/30 rounded-xl border border-border"
        >
          <MessageSquare className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 opacity-40" />
          <p className="text-sm sm:text-base font-medium">No reviews yet. Be the first to review!</p>
        </motion.div>
      )}
    </div>
  );
}

