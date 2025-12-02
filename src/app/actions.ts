"use server";

import { searchBooks, getBookById } from "@/lib/hardcover";
import { searchMoviesAndTv, searchMoviesOnly, searchTvSeries, getMediaById } from "@/lib/tmdb";
import { Book, Movie } from "@/types";
import { signIn, signOut, auth } from "@/auth";
import { createUser, getUserByEmail } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { userMovies, userBooks, userEpisodes } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function searchBooksAction(query: string): Promise<Book[]> {
  if (!query.trim()) return [];
  return await searchBooks(query);
}

export async function searchMoviesAction(query: string): Promise<Movie[]> {
  if (!query.trim()) return [];
  return await searchMoviesOnly(query);
}

export async function searchSeriesAction(query: string): Promise<Movie[]> {
  if (!query.trim()) return [];
  return await searchTvSeries(query);
}

export async function searchMultiAction(query: string): Promise<Movie[]> {
  if (!query.trim()) return [];
  return await searchMoviesAndTv(query);
}

// Auth Actions
export async function signUpAction(email: string, password: string) {
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    await createUser(email, password);
    
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Failed to sign in after registration" };
    }

    redirect("/");
  } catch (error) {
    // Re-throw redirect errors - they're how Next.js handles redirects
    if (error && typeof error === "object" && "digest" in error && typeof error.digest === "string" && error.digest.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Sign up error:", error);
    return { error: "Failed to create account" };
  }
}

export async function signInAction(email: string, password: string) {
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Invalid email or password" };
    }

    redirect("/");
  } catch (error) {
    // Re-throw redirect errors - they're how Next.js handles redirects
    if (error && typeof error === "object" && "digest" in error && typeof error.digest === "string" && error.digest.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Sign in error:", error);
    return { error: "Failed to sign in" };
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

// Media Actions
export async function toggleWatchedAction(
  mediaId: string,
  mediaType: "movie" | "tv" | "book",
  isWatched: boolean
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;
  const now = new Date();

  try {
    if (mediaType === "book") {
      const existing = await db
        .select()
        .from(userBooks)
        .where(and(eq(userBooks.userId, userId), eq(userBooks.bookId, mediaId)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(userBooks)
          .set({
            watched: isWatched,
            readDate: isWatched ? now : null,
            updatedAt: now,
          })
          .where(eq(userBooks.id, existing[0].id));
      } else {
        await db.insert(userBooks).values({
          id: crypto.randomUUID(),
          userId,
          bookId: mediaId,
          watched: isWatched,
          readDate: isWatched ? now : null,
        });
      }
    } else {
      const existing = await db
        .select()
        .from(userMovies)
        .where(
          and(
            eq(userMovies.userId, userId),
            eq(userMovies.movieId, mediaId),
            eq(userMovies.mediaType, mediaType)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(userMovies)
          .set({
            watched: isWatched,
            watchedDate: isWatched ? now : null,
            updatedAt: now,
          })
          .where(eq(userMovies.id, existing[0].id));
      } else {
        await db.insert(userMovies).values({
          id: crypto.randomUUID(),
          userId,
          movieId: mediaId,
          mediaType: mediaType as "movie" | "tv",
          watched: isWatched,
          watchedDate: isWatched ? now : null,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Toggle watched error:", error);
    return { error: "Failed to update watched status" };
  }
}

export async function toggleWatchlistAction(
  mediaId: string,
  mediaType: "movie" | "tv" | "book",
  isWatchlist: boolean
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;
  const now = new Date();

  try {
    if (mediaType === "book") {
      const existing = await db
        .select()
        .from(userBooks)
        .where(and(eq(userBooks.userId, userId), eq(userBooks.bookId, mediaId)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(userBooks)
          .set({
            watchlist: isWatchlist,
            updatedAt: now,
          })
          .where(eq(userBooks.id, existing[0].id));
      } else {
        await db.insert(userBooks).values({
          id: crypto.randomUUID(),
          userId,
          bookId: mediaId,
          watchlist: isWatchlist,
        });
      }
    } else {
      const existing = await db
        .select()
        .from(userMovies)
        .where(
          and(
            eq(userMovies.userId, userId),
            eq(userMovies.movieId, mediaId),
            eq(userMovies.mediaType, mediaType)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(userMovies)
          .set({
            watchlist: isWatchlist,
            updatedAt: now,
          })
          .where(eq(userMovies.id, existing[0].id));
      } else {
        await db.insert(userMovies).values({
          id: crypto.randomUUID(),
          userId,
          movieId: mediaId,
          mediaType: mediaType as "movie" | "tv",
          watchlist: isWatchlist,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Toggle watchlist error:", error);
    return { error: "Failed to update watchlist" };
  }
}

export async function toggleLikedAction(
  mediaId: string,
  mediaType: "movie" | "tv" | "book",
  isLiked: boolean
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;
  const now = new Date();

  try {
    if (mediaType === "book") {
      const existing = await db
        .select()
        .from(userBooks)
        .where(and(eq(userBooks.userId, userId), eq(userBooks.bookId, mediaId)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(userBooks)
          .set({
            liked: isLiked,
            updatedAt: now,
          })
          .where(eq(userBooks.id, existing[0].id));
      } else {
        await db.insert(userBooks).values({
          id: crypto.randomUUID(),
          userId,
          bookId: mediaId,
          liked: isLiked,
        });
      }
    } else {
      const existing = await db
        .select()
        .from(userMovies)
        .where(
          and(
            eq(userMovies.userId, userId),
            eq(userMovies.movieId, mediaId),
            eq(userMovies.mediaType, mediaType)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(userMovies)
          .set({
            liked: isLiked,
            updatedAt: now,
          })
          .where(eq(userMovies.id, existing[0].id));
      } else {
        await db.insert(userMovies).values({
          id: crypto.randomUUID(),
          userId,
          movieId: mediaId,
          mediaType: mediaType as "movie" | "tv",
          liked: isLiked,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Toggle liked error:", error);
    return { error: "Failed to update liked status" };
  }
}

export async function getUserMediaAction(
  mediaType: "movies" | "books",
  filter: "watched" | "watchlist" | "favorites"
): Promise<{ movies?: Movie[]; books?: Book[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  try {
    if (mediaType === "books") {
      let conditions = [eq(userBooks.userId, userId)];
      
      if (filter === "watched") {
        conditions.push(eq(userBooks.watched, true));
      } else if (filter === "watchlist") {
        conditions.push(eq(userBooks.watchlist, true));
      } else if (filter === "favorites") {
        conditions.push(eq(userBooks.liked, true));
      }

      const userBooksData = await db
        .select()
        .from(userBooks)
        .where(and(...conditions));
      
      // Fetch full book data from Hardcover API
      const books = await Promise.all(
        userBooksData.map(async (userBook) => {
          const book = await getBookById(userBook.bookId);
          if (!book) return null;
          
          // Merge user-specific data
          return {
            ...book,
            watched: userBook.watched ?? false,
            liked: userBook.liked ?? false,
            watchlist: userBook.watchlist ?? false,
            readDate: userBook.readDate?.toISOString(),
          };
        })
      );

      return { books: books.filter((b): b is Book => b !== null) };
    } else {
      let conditions = [eq(userMovies.userId, userId)];
      
      if (filter === "watched") {
        conditions.push(eq(userMovies.watched, true));
      } else if (filter === "watchlist") {
        conditions.push(eq(userMovies.watchlist, true));
      } else if (filter === "favorites") {
        conditions.push(eq(userMovies.liked, true));
      }

      const userMoviesData = await db
        .select()
        .from(userMovies)
        .where(and(...conditions));
      
      // Fetch full movie/TV data from TMDB
      const movies = await Promise.all(
        userMoviesData.map(async (userMovie) => {
          const movie = await getMediaById(userMovie.movieId, userMovie.mediaType as "movie" | "tv");
          if (!movie) return null;
          
          // Merge user-specific data
          return {
            ...movie,
            watched: userMovie.watched ?? false,
            liked: userMovie.liked ?? false,
            watchlist: userMovie.watchlist ?? false,
            watchedDate: userMovie.watchedDate?.toISOString(),
          };
        })
      );

      return { movies: movies.filter((m): m is Movie => m !== null) };
    }
  } catch (error) {
    console.error("Get user media error:", error);
    return { error: "Failed to fetch user media" };
  }
}

export async function toggleEpisodeWatchedAction(
  episodeId: number,
  isWatched: boolean
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;
  const now = new Date();

  try {
    const existing = await db
      .select()
      .from(userEpisodes)
      .where(and(eq(userEpisodes.userId, userId), eq(userEpisodes.episodeId, episodeId)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userEpisodes)
        .set({
          watched: isWatched,
          watchedDate: isWatched ? now : null,
          updatedAt: now,
        })
        .where(eq(userEpisodes.id, existing[0].id));
    } else {
      await db.insert(userEpisodes).values({
        id: crypto.randomUUID(),
        userId,
        episodeId,
        watched: isWatched,
        watchedDate: isWatched ? now : null,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Toggle episode watched error:", error);
    return { error: "Failed to update episode watched status" };
  }
}

export async function getUserMediaStatusAction(
  mediaId: string,
  mediaType: "movie" | "tv" | "book"
): Promise<{ watched: boolean; liked: boolean; watchlist: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { watched: false, liked: false, watchlist: false };
  }

  const userId = session.user.id;

  try {
    if (mediaType === "book") {
      const [record] = await db
        .select()
        .from(userBooks)
        .where(and(eq(userBooks.userId, userId), eq(userBooks.bookId, mediaId)))
        .limit(1);

      return {
        watched: record?.watched ?? false,
        liked: record?.liked ?? false,
        watchlist: record?.watchlist ?? false,
      };
    } else {
      const [record] = await db
        .select()
        .from(userMovies)
        .where(
          and(
            eq(userMovies.userId, userId),
            eq(userMovies.movieId, mediaId),
            eq(userMovies.mediaType, mediaType)
          )
        )
        .limit(1);

      return {
        watched: record?.watched ?? false,
        liked: record?.liked ?? false,
        watchlist: record?.watchlist ?? false,
      };
    }
  } catch (error) {
    console.error("Get media status error:", error);
    return { watched: false, liked: false, watchlist: false };
  }
}

export async function markSeasonAsWatchedAction(episodeIds: number[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;
  const now = new Date();

  if (!episodeIds || episodeIds.length === 0) {
    return { error: "No episodes provided" };
  }

  try {
    // Get existing watched episodes for this user
    const existing = await db
      .select()
      .from(userEpisodes)
      .where(
        and(
          eq(userEpisodes.userId, userId),
          inArray(userEpisodes.episodeId, episodeIds)
        )
      );

    const existingEpisodeIds = new Set(existing.map(e => e.episodeId));
    const episodesToInsert = episodeIds.filter(id => !existingEpisodeIds.has(id));
    const episodesToUpdate = existing.filter(e => !e.watched);

    // Update existing records that aren't watched
    if (episodesToUpdate.length > 0) {
      await Promise.all(
        episodesToUpdate.map(ep => 
          db
            .update(userEpisodes)
            .set({
              watched: true,
              watchedDate: now,
              updatedAt: now,
            })
            .where(eq(userEpisodes.id, ep.id))
        )
      );
    }

    // Insert new records for episodes that don't exist
    if (episodesToInsert.length > 0) {
      await db.insert(userEpisodes).values(
        episodesToInsert.map(episodeId => ({
          id: crypto.randomUUID(),
          userId,
          episodeId,
          watched: true,
          watchedDate: now,
        }))
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Mark season as watched error:", error);
    return { error: "Failed to mark season as watched" };
  }
}

export async function getWatchedEpisodesAction(episodeIds: number[]): Promise<Set<number>> {
  const session = await auth();
  if (!session?.user?.id || !episodeIds || episodeIds.length === 0) {
    return new Set();
  }

  const userId = session.user.id;

  try {
    const watched = await db
      .select()
      .from(userEpisodes)
      .where(
        and(
          eq(userEpisodes.userId, userId),
          eq(userEpisodes.watched, true),
          inArray(userEpisodes.episodeId, episodeIds)
        )
      );

    return new Set(watched.map(e => e.episodeId));
  } catch (error) {
    console.error("Get watched episodes error:", error);
    return new Set();
  }
}
