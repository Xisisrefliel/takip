# Takip - Technical Documentation

This document provides detailed explanations of key architectural decisions, complex algorithms, and important utility functions in the Takip codebase.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Flow](#data-flow)
3. [TMDB Integration](#tmdb-integration)
4. [Server Actions](#server-actions)
5. [Recommendations Engine](#recommendations-engine)
6. [Component Patterns](#component-patterns)

---

## Architecture Overview

### Tech Stack Decisions

**Next.js 16 App Router**: Chosen for its server-side rendering capabilities, built-in caching, and seamless integration with React Server Components. The App Router enables efficient data fetching patterns with automatic request deduplication.

**Drizzle ORM**: Selected for its TypeScript-first approach, providing type-safe database queries without the overhead of a full ORM like Prisma. The `$inferSelect` and `$inferInsert` types ensure compile-time safety for database operations.

**Neon PostgreSQL**: Serverless Postgres that scales to zero, ideal for variable traffic patterns. Connection pooling is handled automatically.

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── [mediaType]/[id]/  # Dynamic routes for movie/tv/book details
│   └── actions.ts         # All server actions (mutations)
├── components/            # React components (client and server)
├── lib/                   # External API clients and utilities
│   ├── tmdb.ts           # TMDB API integration
│   ├── recommendations.ts # Personalization engine
│   └── hardcover.ts      # Book data API
├── db/                    # Database schema and connection
└── types/                 # TypeScript type definitions
```

---

## Data Flow

### Media Detail Page Flow

The media detail page (`/[mediaType]/[id]/page.tsx`) orchestrates multiple data sources:

1. **Initial Data Fetch**: Parallel fetching of media details and watch providers from TMDB
2. **User Status Enrichment**: If authenticated, fetches user's watched/liked/watchlist status from database
3. **Review Loading**: Parallel fetch of public reviews and user's personal review
4. **Recommendation Personalization**: Filters out already-watched titles and boosts genres the user likes

```
Request → Auth Check → Parallel Data Fetch → Status Enrichment → Personalization → Render
```

### Metadata Caching Strategy

User movie metadata (title, year, poster, genres, cast, crew) is cached in the `userMovies` table to avoid repeated TMDB API calls. The `shouldBackfillMetadata` function determines when to refresh this cache:

```typescript
function shouldBackfillMetadata(record): boolean {
  // Returns true if any critical field is missing
  return !record?.title || !record?.posterUrl || record?.year == null || ...
}
```

This pattern reduces API calls by 80-90% for returning users viewing their library.

---

## TMDB Integration

### Caching Strategy

The `fetchTMDB` function implements intelligent caching based on endpoint type:

| Endpoint Type | Cache TTL | Rationale |
|--------------|-----------|-----------|
| Trending | 1 hour | Frequently changing |
| Search | 5 minutes | Query-specific, short-lived |
| Details | 24 hours | Movie metadata rarely changes |
| Providers | 12 hours | Provider availability changes slowly |
| Person | 24 hours | Actor/director info is stable |

### Image URL Construction

TMDB images use size-specific base URLs for performance:

```typescript
const IMAGE_SIZES = {
  ORIGINAL: "https://image.tmdb.org/t/p/original",  // Full resolution
  W500: "https://image.tmdb.org/t/p/w500",          // Posters, thumbnails
  W1280: "https://image.tmdb.org/t/p/w1280",        // Backdrops
  W185: "https://image.tmdb.org/t/p/w185",          // Profile photos
}
```

### Trailer Selection Priority

The `pickTrailer` function selects the best available trailer:

1. Official YouTube trailer (highest priority)
2. Any YouTube trailer
3. Any YouTube video (fallback)

---

## Server Actions

### Import Matching Algorithm

The `pickBestMatch` function in `actions.ts` uses a scoring system to find the correct TMDB movie when importing from external sources (e.g., Letterboxd):

**Scoring Factors:**
- Exact title match: +60 points
- Partial title overlap: +35 points
- Year match: +40 points (exact), +25 (off by 1), +10 (off by 2)
- Popularity bonus: up to +20 points
- Vote count bonus: up to +10 points

This multi-factor approach handles edge cases like remakes, re-releases, and international titles.

### Toggle Action Pattern

The `toggleWatchedAction`, `toggleWatchlistAction`, and `toggleLikedAction` share a common pattern:

1. Authenticate user via `auth()`
2. Check for existing record in database
3. If exists: update the specific field
4. If not exists: create new record with all fields
5. Optionally backfill metadata if missing
6. Invalidate relevant caches

This pattern ensures consistency while minimizing database writes.

---

## Recommendations Engine

### Personalization Algorithm

The `personalizeRecommendations` function in `recommendations.ts`:

1. **Filters seen movies**: Removes any movie already in user's library
2. **Boosts preferred genres**: Scores movies higher if they match user's liked genres

```typescript
function personalizeRecommendations(movies, watchedIds, preferredGenres) {
  const unseen = movies.filter(m => !watchedIds.has(m.id));
  // Score each movie based on genre overlap with user preferences
  // Sort by score descending
}
```

### Quality Thresholds

The `getEnhancedSimilarTitles` and `getEnhancedRecommendations` functions apply quality filters:

| Category | Min Rating | Min Votes |
|----------|-----------|-----------|
| Similar | 6.0 | 1,000 |
| Recommended | 7.0 | 2,000 |

This prevents low-quality or obscure titles from appearing in recommendations.

### Similar Movies Scoring

The `scoreSimilarMovie` function combines multiple signals:

```
score = (rating * 3) + log10(popularity) * 13 + log10(voteCount) * 3.3 + genreBonus
```

Genre bonus adds 5 points per matching genre (max 10), prioritizing movies similar in style to the source.

---

## Component Patterns

### SeasonList State Management

The SeasonList component manages multiple independent state categories:

- `watchedEpisodes`: Set of episode IDs the user has watched
- `likedEpisodes`: Set of episode IDs the user has liked (local only)
- `watchlistEpisodes`: Set of episode IDs in watchlist (local only)
- `expandedSeasonId`: Currently expanded season
- `episodeReviews`: Map of episode ID to review data

The component uses a ref (`hasFetched`) to prevent duplicate API calls on React strict mode re-renders.

### ProfilePage Data Loading

The ProfilePage implements lazy loading per tab:

1. Initial load fetches current tab's data
2. Tab switches trigger fetch only if data not already loaded
3. `loadedTabs` Set tracks which combinations are cached

```typescript
const fetchTabData = useCallback(async (type, tab) => {
  const key = `${type}-${tab}`;
  if (loadedTabs.has(key)) return; // Already cached
  // Fetch and cache data
});
```

### CastAndCrew Tab System

The CastAndCrew component dynamically builds available tabs based on data:

```typescript
const tabs = [];
if (hasCast) tabs.push({ id: "cast", label: "Cast" });
if (hasCrew) tabs.push({ id: "crew", label: "Crew" });
// ... etc
```

This prevents showing empty tabs and ensures the component gracefully handles incomplete data.

---

## Error Handling Patterns

### Graceful Degradation

Most async operations use `.catch()` chaining to provide fallback values:

```typescript
const session = await auth().catch(() => null);
const data = await fetchTMDB(endpoint).catch(() => ({ results: [] }));
```

This pattern ensures the page renders even when individual data sources fail.

### User Status Enrichment

The `enrichMoviesWithUserStatus` function batches status lookups:

1. Collects all movie IDs from input array
2. Performs single database query per media type
3. Builds lookup map for O(1) access
4. Maps status onto each movie

This reduces N+1 queries to a constant 2 queries regardless of movie count.

---

## Constants and Configuration

### Genre Mappings

Two genre mappings exist for different purposes:

- `GENRES` in `tmdb.ts`: Maps TMDB genre IDs to display names
- `GENRE_IDS` in `constants.ts`: Maps genre names to IDs for discovery queries

### Country Data

Country codes are mapped to:
- Full names (`COUNTRY_NAMES` in `tmdb.ts`)
- Flag emojis (`COUNTRY_FLAGS` in `CastAndCrew.tsx`)

These enable localized display of release information and production countries.

---

## Performance Optimizations

1. **Request Deduplication**: React's `cache()` wrapper prevents duplicate TMDB requests
2. **Parallel Fetching**: `Promise.all()` for independent data sources
3. **Lazy Tab Loading**: ProfilePage only loads data when tab is activated
4. **Metadata Caching**: User library stores TMDB metadata to avoid re-fetching
5. **Image Size Selection**: Appropriate image sizes reduce bandwidth
6. **ISR Caching**: Pages revalidate every 24 hours (`revalidate = 86400`)
