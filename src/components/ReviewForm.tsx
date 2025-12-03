"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Star, X, Send } from "lucide-react";
import { createReviewAction, updateReviewAction, deleteReviewAction, Review } from "@/app/actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  mediaId?: string;
  mediaType?: "movie" | "tv";
  episodeId?: number;
  existingReview?: Review | null;
  onCancel?: () => void;
  onSuccess?: () => void;
  compact?: boolean;
}

export function ReviewForm({
  mediaId,
  mediaType,
  episodeId,
  existingReview,
  onCancel,
  onSuccess,
  compact = false,
}: ReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [text, setText] = useState(existingReview?.text || "");
  const [isExpanded, setIsExpanded] = useState(!compact || !!existingReview);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      return;
    }

    startTransition(async () => {
      let result;
      if (existingReview) {
        result = await updateReviewAction(existingReview.id, rating, text || null);
      } else {
        result = await createReviewAction(rating, text || null, mediaId, mediaType, episodeId);
      }

      if (result?.error) {
        console.error(result.error);
        // You could add toast notification here
      } else {
        router.refresh();
        if (onSuccess) {
          onSuccess();
        }
        if (onCancel) {
          onCancel();
        }
        if (compact && !existingReview) {
          setIsExpanded(false);
          setRating(0);
          setText("");
        }
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
        if (onSuccess) {
          onSuccess();
        }
        if (onCancel) {
          onCancel();
        }
      }
    });
  };

  if (compact && !isExpanded && !existingReview) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
      >
        Write a review
      </button>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className={cn(
        "space-y-4 p-4 sm:p-6 rounded-xl border border-border bg-surface/50",
        compact && "p-3 sm:p-4"
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {existingReview ? "Edit Review" : "Write a Review"}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-md hover:bg-surface-hover transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rating:</span>
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
                size={compact ? 20 : 24}
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
            <span className="ml-2 text-sm text-muted-foreground">
              {rating}/5
            </span>
          )}
        </div>
      </div>

      {/* Review Text */}
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your thoughts... (optional)"
          rows={compact ? 3 : 4}
          className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
          disabled={isPending}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <motion.button
          type="submit"
          disabled={isPending || rating === 0}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
            rating === 0
              ? "bg-muted-foreground/20 text-muted-foreground cursor-not-allowed"
              : "bg-accent text-accent-foreground hover:bg-accent/90",
            isPending && "opacity-50 cursor-not-allowed"
          )}
        >
          <Send size={16} />
          <span>{existingReview ? "Update" : "Submit"}</span>
        </motion.button>

        {existingReview && (
          <motion.button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded-lg font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </motion.button>
        )}

        {compact && !existingReview && (
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false);
              setRating(0);
              setText("");
            }}
            className="px-4 py-2 rounded-lg font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all"
          >
            Cancel
          </button>
        )}
      </div>
    </motion.form>
  );
}

