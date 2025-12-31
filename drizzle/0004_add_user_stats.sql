CREATE TABLE "user_stats" (
	"userId" text PRIMARY KEY NOT NULL,
	"totals" jsonb,
	"filmsByYear" jsonb,
	"genres" jsonb,
	"decades" jsonb,
	"ratings" jsonb,
	"actors" jsonb,
	"directors" jsonb,
	"favorites" jsonb,
	"recent" jsonb,
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;