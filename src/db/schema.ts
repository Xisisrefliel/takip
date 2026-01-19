import {
  pgEnum,
  pgTable,
  text,
  integer,
  primaryKey,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

const mediaTypeEnum = pgEnum("media_type", ["movie", "tv"]);

// NextAuth tables
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { withTimezone: true, mode: "date" }),
  image: text("image"),
  password: text("password"), // hashed password for credentials provider
  preferredRegion: text("preferredRegion").default("US"),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.identifier, table.token] }),
}));

// User media tables
export const userMovies = pgTable("user_movies", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  movieId: text("movieId").notNull(),
  title: text("title"),
  year: integer("year"),
  runtime: integer("runtime"),
  posterUrl: text("posterUrl"),
  genres: text("genres"),
  cast: text("cast"),
  crew: text("crew"),
  keywords: text("keywords"), // JSON array of keyword strings for theme matching
  collectionId: integer("collectionId"), // Franchise/collection ID from TMDB
  collectionName: text("collectionName"), // Franchise/collection name
  productionCompanies: text("productionCompanies"), // JSON array of production companies
  productionCountries: text("productionCountries"), // JSON array of production countries
  watchProviders: text("watchProviders"), // JSON object of watch providers by region
  mediaType: mediaTypeEnum("mediaType").notNull(),
  watched: boolean("watched").default(false),
  watchedDate: timestamp("watchedDate", { withTimezone: true, mode: "date" }),
  liked: boolean("liked").default(false),
  watchlist: boolean("watchlist").default(false),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow(),
}, (table) => [
  index("idx_user_movies_user_watched").on(table.userId, table.watched),
  index("idx_user_movies_user_watchlist").on(table.userId, table.watchlist),
  index("idx_user_movies_user_liked").on(table.userId, table.liked),
  index("idx_user_movies_user_id").on(table.userId),
]);

export const userBooks = pgTable("user_books", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bookId: text("bookId").notNull(),
  watched: boolean("watched").default(false), // "read"
  readDate: timestamp("readDate", { withTimezone: true, mode: "date" }),
  liked: boolean("liked").default(false),
  watchlist: boolean("watchlist").default(false),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow(),
}, (table) => [
  index("idx_user_books_user_watched").on(table.userId, table.watched),
  index("idx_user_books_user_watchlist").on(table.userId, table.watchlist),
  index("idx_user_books_user_liked").on(table.userId, table.liked),
  index("idx_user_books_user_id").on(table.userId),
]);

export const userEpisodes = pgTable("user_episodes", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  episodeId: integer("episodeId").notNull(),
  watched: boolean("watched").default(false),
  watchedDate: timestamp("watchedDate", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow(),
}, (table) => [
  index("idx_user_episodes_user_watched").on(table.userId, table.watched),
  index("idx_user_episodes_user_id").on(table.userId),
]);

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // For movies/TV series reviews
  mediaId: text("mediaId"), // null if episode/album review
  mediaType: mediaTypeEnum("mediaType"), // null if episode/album review
  // For episode reviews
  episodeId: integer("episodeId"), // null if media/album review
  // For album reviews
  albumId: text("albumId"), // null if media/episode review
  albumType: text("albumType"), // 'album' | 'single' | 'compilation' - null if media/episode review
  // Review content
  rating: integer("rating").notNull(), // 1-5 stars
  text: text("text"), // optional review text
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow(),
}, (table) => [
  index("idx_reviews_user_id").on(table.userId),
]);

// Negative signals for recommendation learning (tracks what users don't like)
export const negativeSignals = pgTable("negative_signals", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  movieId: text("movieId").notNull(),
  mediaType: mediaTypeEnum("mediaType").notNull(),
  signalType: text("signalType").notNull(), // 'low_rating', 'skipped_recommendation'
  signalValue: integer("signalValue"), // For low_rating: the actual rating (1-2)
  context: text("context"), // JSON - what was happening when signal occurred
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow(),
}, (table) => [
  index("idx_negative_signals_user").on(table.userId),
  index("idx_negative_signals_movie").on(table.movieId),
]);

// User behavior patterns (cached analysis for faster recommendations)
export const userBehaviorPatterns = pgTable("user_behavior_patterns", {
  userId: text("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  // Behavioral metrics
  watchingVelocity: integer("watchingVelocity"), // Movies per week * 100 (stored as integer)
  explorationScore: integer("explorationScore"), // 0-100: how much they explore new genres
  consistencyScore: integer("consistencyScore"), // 0-100: taste consistency
  // JSON fields for rich pattern data
  temporalPatterns: text("temporalPatterns"), // JSON: hour/day preferences
  bingePatterns: text("bingePatterns"), // JSON: series binging behavior
  ratingDistribution: text("ratingDistribution"), // JSON: histogram of ratings
  genreProgression: text("genreProgression"), // JSON: how tastes evolve over time
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow(),
});

export const userStats = pgTable("user_stats", {
  userId: text("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  totals: jsonb("totals"),
  filmsByYear: jsonb("filmsByYear"),
  genres: jsonb("genres"),
  decades: jsonb("decades"),
  ratings: jsonb("ratings"),
  actors: jsonb("actors"),
  directors: jsonb("directors"),
  favorites: jsonb("favorites"),
  recent: jsonb("recent"),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow(),
});

// Cached recommendations - pre-computed for instant loading
export const userRecommendations = pgTable("user_recommendations", {
  userId: text("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  // Pre-computed recommendation sets (stored as JSON arrays of movie objects)
  personalized: jsonb("personalized"), // "Recommended For You"
  exploration: jsonb("exploration"), // "Try Something New"
  hiddenGems: jsonb("hiddenGems"), // "Hidden Gems"
  // Mood-based recommendations (keyed by mood ID)
  moods: jsonb("moods"), // { uplifting: [...], "mind-bending": [...], ... }
  // Default mood based on user's preferences
  defaultMood: text("defaultMood"),
  // Cache metadata
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow(),
  // Flag to indicate if recommendations need refresh
  isStale: boolean("isStale").default(false),
});

// Music/Spotify tables
export const userAlbums = pgTable("user_albums", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  albumId: text("albumId").notNull(), // Spotify album ID
  title: text("title").notNull(),
  artist: text("artist").notNull(), // Primary artist
  artists: text("artists"), // JSON array of all artists
  year: integer("year"),
  coverUrl: text("coverUrl"),
  genres: text("genres"), // JSON array
  totalTracks: integer("totalTracks"),
  spotifyUrl: text("spotifyUrl"),
  albumType: text("albumType"), // 'album' | 'single' | 'compilation'
  // User tracking
  liked: boolean("liked").default(false),
  addedDate: timestamp("addedDate", { withTimezone: true, mode: "date" }).defaultNow(),
  syncSource: text("syncSource"), // 'recently_played' | 'top_items' | 'manual' | 'currently_playing'
  lastSyncedAt: timestamp("lastSyncedAt", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow(),
}, (table) => [
  index("idx_user_albums_user_id").on(table.userId),
  index("idx_user_albums_user_liked").on(table.userId, table.liked),
  index("idx_user_albums_user_synced").on(table.userId, table.lastSyncedAt),
  index("idx_user_albums_album_id").on(table.albumId),
]);

export const userTracks = pgTable("user_tracks", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  trackId: text("trackId").notNull(), // Spotify track ID
  albumId: text("albumId").notNull(), // Spotify album ID
  trackName: text("trackName").notNull(),
  artistName: text("artistName").notNull(),
  durationMs: integer("durationMs"),
  spotifyUrl: text("spotifyUrl"),
  // Listening history
  playedAt: timestamp("playedAt", { withTimezone: true, mode: "date" }).notNull(),
  playCount: integer("playCount").default(1),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow(),
}, (table) => [
  index("idx_user_tracks_user_id").on(table.userId),
  index("idx_user_tracks_played_at").on(table.userId, table.playedAt),
  index("idx_user_tracks_album_id").on(table.userId, table.albumId),
]);

export const userMusicStats = pgTable("user_music_stats", {
  userId: text("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  // Aggregated statistics (JSONB for flexibility)
  topArtists: jsonb("topArtists"), // { short_term: [...], medium_term: [...], long_term: [...] }
  topTracks: jsonb("topTracks"), // { short_term: [...], medium_term: [...], long_term: [...] }
  topGenres: jsonb("topGenres"), // [{ genre: "rock", count: 42 }, ...]
  listeningByMonth: jsonb("listeningByMonth"), // [{ month: "2024-01", count: 150 }, ...]
  // Currently playing state
  currentlyPlaying: jsonb("currentlyPlaying"), // { track, album, artist, progress, isPlaying }
  // Sync timestamps
  lastFullSync: timestamp("lastFullSync", { withTimezone: true, mode: "date" }),
  lastRecentlyPlayedSync: timestamp("lastRecentlyPlayedSync", { withTimezone: true, mode: "date" }),
  lastTopItemsSync: timestamp("lastTopItemsSync", { withTimezone: true, mode: "date" }),
  lastCurrentlyPlayingSync: timestamp("lastCurrentlyPlayingSync", { withTimezone: true, mode: "date" }),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow(),
});

export const spotifySyncLog = pgTable("spotify_sync_log", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  syncType: text("syncType").notNull(), // 'recently_played' | 'top_items' | 'currently_playing' | 'full'
  status: text("status").notNull(), // 'started' | 'completed' | 'failed'
  itemsProcessed: integer("itemsProcessed").default(0),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt", { withTimezone: true, mode: "date" }).notNull(),
  completedAt: timestamp("completedAt", { withTimezone: true, mode: "date" }),
}, (table) => [
  index("idx_spotify_sync_user_id").on(table.userId),
  index("idx_spotify_sync_status").on(table.userId, table.status),
]);

