CREATE TABLE "user_recommendations" (
	"userId" text PRIMARY KEY NOT NULL,
	"personalized" jsonb,
	"exploration" jsonb,
	"hiddenGems" jsonb,
	"moods" jsonb,
	"defaultMood" text,
	"updatedAt" timestamp with time zone DEFAULT now(),
	"isStale" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "user_recommendations" ADD CONSTRAINT "user_recommendations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;