CREATE TABLE "negative_signals" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"movieId" text NOT NULL,
	"mediaType" "media_type" NOT NULL,
	"signalType" text NOT NULL,
	"signalValue" integer,
	"context" text,
	"createdAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_behavior_patterns" (
	"userId" text PRIMARY KEY NOT NULL,
	"watchingVelocity" integer,
	"explorationScore" integer,
	"consistencyScore" integer,
	"temporalPatterns" text,
	"bingePatterns" text,
	"ratingDistribution" text,
	"genreProgression" text,
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_movies" ADD COLUMN "productionCompanies" text;--> statement-breakpoint
ALTER TABLE "user_movies" ADD COLUMN "productionCountries" text;--> statement-breakpoint
ALTER TABLE "user_movies" ADD COLUMN "watchProviders" text;--> statement-breakpoint
ALTER TABLE "negative_signals" ADD CONSTRAINT "negative_signals_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_behavior_patterns" ADD CONSTRAINT "user_behavior_patterns_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_negative_signals_user" ON "negative_signals" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_negative_signals_movie" ON "negative_signals" USING btree ("movieId");