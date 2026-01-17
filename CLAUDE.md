# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Takip is a movie/TV/book tracking application built with Next.js 16. Users can track what they've watched, maintain watchlists, rate content, and get personalized recommendations.

## Commands

```bash
bun dev              # Start development server
bun build            # Production build
bun lint             # Run ESLint (run this before committing)
bun db:generate      # Generate Drizzle migrations
bun db:migrate       # Apply migrations to database
```

## Architecture

### Tech Stack
- **Runtime**: Bun
- **Framework**: Next.js 16 (App Router) with React 19
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Drizzle ORM
- **Auth**: NextAuth v5 (Auth.js) with credentials provider
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components
- `src/lib/` - External API clients (TMDB, Hardcover) and utilities
- `src/db/` - Drizzle schema and database connection
- `src/types/` - TypeScript type definitions

### Data Flow

**External APIs:**
- **TMDB** (`src/lib/tmdb.ts`): All movie/TV data fetching. Uses `fetchTMDB()` helper with 1-hour caching.
- **Hardcover** (`src/lib/hardcover.ts`): Book data via GraphQL.

**Server Actions** (`src/app/actions.ts`):
- All mutations (toggle watched/liked/watchlist, reviews, auth) are server actions marked with `"use server"`
- Actions use `auth()` from NextAuth to verify session
- User media metadata (title, year, poster, genres, cast, crew) is cached in `user_movies` table to avoid repeated TMDB calls

**Database Schema** (`src/db/schema.ts`):
- `users`, `accounts`, `sessions`, `verificationTokens` - NextAuth tables
- `userMovies` - Stores watched/liked/watchlist status with cached metadata
- `userBooks` - Book tracking
- `userEpisodes` - Individual TV episode tracking
- `reviews` - User ratings (1-5 stars) and optional text reviews
- `userStats` - Cached statistics (JSONB columns for aggregated data)

### Media Types
The `Movie` type (`src/types/index.ts`) represents both movies and TV series via `mediaType: 'movie' | 'tv'`. Dynamic routes use `[mediaType]/[id]` pattern.

### Recommendations Engine
`src/lib/recommendations.ts` provides:
- Personalized recommendations based on watch history
- Mood-based discovery (uplifting, mind-bending, dark-intense, etc.)
- "Hidden gems" - critically acclaimed but less popular titles
- Genre exploration suggestions

## Environment Variables

Required:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `TMDB_API_KEY` - The Movie Database API key
- `AUTH_SECRET` - NextAuth secret for JWT signing

## Design Guidelines

From `.cursor/rules/design.mdc`: Avoid generic "AI slop" aesthetics. Make distinctive, creative frontend choices. Prefer unique typography over Inter/Roboto, use cohesive color palettes with sharp accents, and add meaningful animations for high-impact moments.
