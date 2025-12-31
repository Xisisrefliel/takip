import {
  pgEnum,
  pgTable,
  text,
  integer,
  primaryKey,
  boolean,
  timestamp,
  jsonb,
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
  mediaType: mediaTypeEnum("mediaType").notNull(),
  watched: boolean("watched").default(false),
  watchedDate: timestamp("watchedDate", { withTimezone: true, mode: "date" }),
  liked: boolean("liked").default(false),
  watchlist: boolean("watchlist").default(false),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow(),
});

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
});

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
});

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // For movies/TV series reviews
  mediaId: text("mediaId"), // null if episode review
  mediaType: mediaTypeEnum("mediaType"), // null if episode review
  // For episode reviews
  episodeId: integer("episodeId"), // null if media review
  // Review content
  rating: integer("rating").notNull(), // 1-5 stars
  text: text("text"), // optional review text
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow(),
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

