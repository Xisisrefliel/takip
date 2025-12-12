ALTER TABLE "user_movies" ADD COLUMN IF NOT EXISTS "title" text;--> statement-breakpoint
ALTER TABLE "user_movies" ADD COLUMN IF NOT EXISTS "year" integer;--> statement-breakpoint
ALTER TABLE "user_movies" ADD COLUMN IF NOT EXISTS "runtime" integer;--> statement-breakpoint
ALTER TABLE "user_movies" ADD COLUMN IF NOT EXISTS "posterUrl" text;--> statement-breakpoint
ALTER TABLE "user_movies" ADD COLUMN IF NOT EXISTS "genres" text;
