ALTER TABLE "user_movies" ADD COLUMN "keywords" text;--> statement-breakpoint
ALTER TABLE "user_movies" ADD COLUMN "collectionId" integer;--> statement-breakpoint
ALTER TABLE "user_movies" ADD COLUMN "collectionName" text;--> statement-breakpoint
CREATE INDEX "idx_reviews_user_id" ON "reviews" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_user_books_user_watched" ON "user_books" USING btree ("userId","watched");--> statement-breakpoint
CREATE INDEX "idx_user_books_user_watchlist" ON "user_books" USING btree ("userId","watchlist");--> statement-breakpoint
CREATE INDEX "idx_user_books_user_liked" ON "user_books" USING btree ("userId","liked");--> statement-breakpoint
CREATE INDEX "idx_user_books_user_id" ON "user_books" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_user_episodes_user_watched" ON "user_episodes" USING btree ("userId","watched");--> statement-breakpoint
CREATE INDEX "idx_user_episodes_user_id" ON "user_episodes" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_user_movies_user_watched" ON "user_movies" USING btree ("userId","watched");--> statement-breakpoint
CREATE INDEX "idx_user_movies_user_watchlist" ON "user_movies" USING btree ("userId","watchlist");--> statement-breakpoint
CREATE INDEX "idx_user_movies_user_liked" ON "user_movies" USING btree ("userId","liked");--> statement-breakpoint
CREATE INDEX "idx_user_movies_user_id" ON "user_movies" USING btree ("userId");