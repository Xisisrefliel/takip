-- Performance indexes for user_movies table
CREATE INDEX IF NOT EXISTS idx_user_movies_user_watched ON "user_movies" ("userId", "watched");
CREATE INDEX IF NOT EXISTS idx_user_movies_user_watchlist ON "user_movies" ("userId", "watchlist");
CREATE INDEX IF NOT EXISTS idx_user_movies_user_liked ON "user_movies" ("userId", "liked");
CREATE INDEX IF NOT EXISTS idx_user_movies_user_id ON "user_movies" ("userId");

-- Performance indexes for user_books table
CREATE INDEX IF NOT EXISTS idx_user_books_user_watched ON "user_books" ("userId", "watched");
CREATE INDEX IF NOT EXISTS idx_user_books_user_watchlist ON "user_books" ("userId", "watchlist");
CREATE INDEX IF NOT EXISTS idx_user_books_user_liked ON "user_books" ("userId", "liked");
CREATE INDEX IF NOT EXISTS idx_user_books_user_id ON "user_books" ("userId");

-- Performance indexes for user_episodes table
CREATE INDEX IF NOT EXISTS idx_user_episodes_user_watched ON "user_episodes" ("userId", "watched");
CREATE INDEX IF NOT EXISTS idx_user_episodes_user_id ON "user_episodes" ("userId");

-- Performance indexes for reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON "reviews" ("userId");
