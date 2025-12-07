-- Reset existing objects (safe for empty/fresh Neon instance)
DROP TABLE IF EXISTS "accounts" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "reviews" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "sessions" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "user_books" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "user_episodes" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "user_movies" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "users" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "verification_tokens" CASCADE;
--> statement-breakpoint
DROP TYPE IF EXISTS "media_type";
--> statement-breakpoint
--> statement-breakpoint
CREATE TYPE "media_type" AS ENUM ('movie', 'tv');
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"mediaId" text,
	"mediaType" "media_type",
	"episodeId" integer,
	"rating" integer NOT NULL,
	"text" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_books" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"bookId" text NOT NULL,
	"watched" boolean DEFAULT false,
	"readDate" timestamp with time zone,
	"liked" boolean DEFAULT false,
	"watchlist" boolean DEFAULT false,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_episodes" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"episodeId" integer NOT NULL,
	"watched" boolean DEFAULT false,
	"watchedDate" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_movies" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"movieId" text NOT NULL,
	"mediaType" "media_type" NOT NULL,
	"watched" boolean DEFAULT false,
	"watchedDate" timestamp with time zone,
	"liked" boolean DEFAULT false,
	"watchlist" boolean DEFAULT false,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp with time zone,
	"image" text,
	"password" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_episodes" ADD CONSTRAINT "user_episodes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_movies" ADD CONSTRAINT "user_movies_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;