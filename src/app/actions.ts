"use server";

import { searchBooks, getBookById } from "@/lib/hardcover";
import { searchMoviesAndTv, searchMoviesOnly, searchTvSeries, getMediaById } from "@/lib/tmdb";
import { Book, Movie } from "@/types";
import { signIn, signOut, auth } from "@/auth";
import { createUser, getUserByEmail } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { userMovies, userBooks, userEpisodes, reviews, users } from "@/db/schema";
import * as schema from "@/db/schema";
import { eq, and, inArray, or, isNull } from "drizzle-orm";
import { DEFAULT_REGION, SUPPORTED_REGION_CODES } from "@/data/regions";

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

export async function getPreferredRegionAction(): Promise<{
  region: string | null;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { region: null };
  }

  try {
    const [user] = await db
      .select({ preferredRegion: users.preferredRegion })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return { region: user?.preferredRegion ?? DEFAULT_REGION };
  } catch (error) {
    console.error("Get preferred region error:", error);
    return { region: DEFAULT_REGION };
  }
}

export async function updatePreferredRegionAction(region: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const normalizedRegion = region.toUpperCase();
  if (!SUPPORTED_REGION_CODES.includes(normalizedRegion)) {
    return { error: "Unsupported region" };
  }

  try {
    await db
      .update(users)
      .set({
        preferredRegion: normalizedRegion,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return { success: true, region: normalizedRegion };
  } catch (error) {
    console.error("Update preferred region error:", error);
    return { error: "Failed to save preferred region" };
  }
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

    // Revalidate pages that display movies
    revalidatePath("/");
    revalidatePath("/profile");

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

    // Revalidate pages that display movies
    revalidatePath("/");
    revalidatePath("/profile");

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

    // Revalidate pages that display movies
    revalidatePath("/");
    revalidatePath("/profile");

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
      const books: Book[] = (
        await Promise.all(
          userBooksData.map(async (userBook) => {
            const book = await getBookById(userBook.bookId);
            if (!book) return null;
            
            // Merge user-specific data
            return {
              ...book,
              watched: userBook.watched ?? false,
              liked: userBook.liked ?? false,
              watchlist: userBook.watchlist ?? false,
              readDate: userBook.readDate
                ? userBook.readDate.toISOString()
                : undefined,
            } as Book;
          })
        )
      ).flatMap((book) => (book ? [book] : []));

      return { books };
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
      const movies: Movie[] = (
        await Promise.all(
          userMoviesData.map(async (userMovie) => {
            const movie = await getMediaById(
              userMovie.movieId,
              userMovie.mediaType as "movie" | "tv"
            );
            if (!movie) return null;
            
            // Merge user-specific data
            return {
              ...movie,
              watched: userMovie.watched ?? false,
              liked: userMovie.liked ?? false,
              watchlist: userMovie.watchlist ?? false,
              watchedDate: userMovie.watchedDate
                ? userMovie.watchedDate.toISOString()
                : undefined,
            } as Movie;
          })
        )
      ).flatMap((movie) => (movie ? [movie] : []));

      return { movies };
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

export async function enrichMoviesWithUserStatus(movies: Movie[]): Promise<Movie[]> {
  const session = await auth();
  if (!session?.user?.id || !movies || movies.length === 0) {
    return movies;
  }

  const userId = session.user.id;

  try {
    // Group movies by mediaType and collect their IDs
    const movieIds: string[] = [];
    const tvIds: string[] = [];
    
    movies.forEach(movie => {
      if (movie.mediaType === 'movie') {
        movieIds.push(movie.id);
      } else if (movie.mediaType === 'tv') {
        tvIds.push(movie.id);
      }
    });

    // Fetch all user statuses in parallel
    const [movieStatuses, tvStatuses] = await Promise.all([
      movieIds.length > 0
        ? db
            .select()
            .from(userMovies)
            .where(
              and(
                eq(userMovies.userId, userId),
                eq(userMovies.mediaType, 'movie'),
                inArray(userMovies.movieId, movieIds)
              )
            )
        : [],
      tvIds.length > 0
        ? db
            .select()
            .from(userMovies)
            .where(
              and(
                eq(userMovies.userId, userId),
                eq(userMovies.mediaType, 'tv'),
                inArray(userMovies.movieId, tvIds)
              )
            )
        : [],
    ]);

    // Create a map for quick lookup
    const statusMap = new Map<string, { watched: boolean; liked: boolean; watchlist: boolean }>();
    
    [...movieStatuses, ...tvStatuses].forEach(status => {
      statusMap.set(status.movieId, {
        watched: status.watched ?? false,
        liked: status.liked ?? false,
        watchlist: status.watchlist ?? false,
      });
    });

    // Enrich movies with user status
    return movies.map(movie => {
      const status = statusMap.get(movie.id);
      if (status) {
        return {
          ...movie,
          watched: status.watched,
          liked: status.liked,
          watchlist: status.watchlist,
        };
      }
      return {
        ...movie,
        watched: false,
        liked: false,
        watchlist: false,
      };
    });
  } catch (error) {
    console.error("Enrich movies with user status error:", error);
    return movies;
  }
}

// Review Actions
export interface Review {
  id: string;
  userId: string;
  userName?: string;
  userImage?: string;
  mediaId?: string;
  mediaType?: "movie" | "tv";
  episodeId?: number;
  rating: number;
  text?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createReviewAction(
  rating: number,
  text: string | null,
  mediaId?: string,
  mediaType?: "movie" | "tv",
  episodeId?: number
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  if (rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5" };
  }

  if (!mediaId && !episodeId) {
    return { error: "Either mediaId or episodeId must be provided" };
  }

  if (mediaId && !mediaType) {
    return { error: "mediaType is required when mediaId is provided" };
  }

  const userId = session.user.id;
  const now = new Date();

  try {
    // Check if user already has a review for this item
    let existingReview;
    if (episodeId) {
      const [review] = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.userId, userId),
            eq(reviews.episodeId, episodeId),
            isNull(reviews.mediaId)
          )
        )
        .limit(1);
      existingReview = review;
    } else if (mediaId && mediaType) {
      const [review] = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.userId, userId),
            eq(reviews.mediaId, mediaId),
            eq(reviews.mediaType, mediaType),
            isNull(reviews.episodeId)
          )
        )
        .limit(1);
      existingReview = review;
    }

    if (existingReview) {
      // Update existing review
      await db
        .update(reviews)
        .set({
          rating,
          text: text || null,
          updatedAt: now,
        })
        .where(eq(reviews.id, existingReview.id));
    } else {
      // Create new review
      await db.insert(reviews).values({
        id: crypto.randomUUID(),
        userId,
        mediaId: mediaId || null,
        mediaType: mediaType || null,
        episodeId: episodeId || null,
        rating,
        text: text || null,
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Create review error:", error);
    return { error: "Failed to create review" };
  }
}

export async function updateReviewAction(
  reviewId: string,
  rating: number,
  text: string | null
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  if (rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5" };
  }

  const userId = session.user.id;
  const now = new Date();

  try {
    // Verify the review belongs to the user
    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
      .limit(1);

    if (!existingReview) {
      return { error: "Review not found or unauthorized" };
    }

    await db
      .update(reviews)
      .set({
        rating,
        text: text || null,
        updatedAt: now,
      })
      .where(eq(reviews.id, reviewId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Update review error:", error);
    return { error: "Failed to update review" };
  }
}

export async function deleteReviewAction(reviewId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  try {
    // Verify the review belongs to the user
    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
      .limit(1);

    if (!existingReview) {
      return { error: "Review not found or unauthorized" };
    }

    await db.delete(reviews).where(eq(reviews.id, reviewId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Delete review error:", error);
    return { error: "Failed to delete review" };
  }
}

export async function getReviewsAction(
  mediaId?: string,
  mediaType?: "movie" | "tv",
  episodeId?: number
): Promise<{ reviews: Review[]; error?: string }> {
  try {
    let reviewRecords;
    
    if (episodeId) {
      reviewRecords = await db
        .select({
          id: reviews.id,
          userId: reviews.userId,
          mediaId: reviews.mediaId,
          mediaType: reviews.mediaType,
          episodeId: reviews.episodeId,
          rating: reviews.rating,
          text: reviews.text,
          createdAt: reviews.createdAt,
          updatedAt: reviews.updatedAt,
          userName: schema.users.name,
          userImage: schema.users.image,
        })
        .from(reviews)
        .leftJoin(schema.users, eq(reviews.userId, schema.users.id))
        .where(
          and(
            eq(reviews.episodeId, episodeId),
            isNull(reviews.mediaId)
          )
        )
        .orderBy(reviews.createdAt);
    } else if (mediaId && mediaType) {
      reviewRecords = await db
        .select({
          id: reviews.id,
          userId: reviews.userId,
          mediaId: reviews.mediaId,
          mediaType: reviews.mediaType,
          episodeId: reviews.episodeId,
          rating: reviews.rating,
          text: reviews.text,
          createdAt: reviews.createdAt,
          updatedAt: reviews.updatedAt,
          userName: schema.users.name,
          userImage: schema.users.image,
        })
        .from(reviews)
        .leftJoin(schema.users, eq(reviews.userId, schema.users.id))
        .where(
          and(
            eq(reviews.mediaId, mediaId),
            eq(reviews.mediaType, mediaType),
            isNull(reviews.episodeId)
          )
        )
        .orderBy(reviews.createdAt);
    } else {
      return { reviews: [], error: "Either mediaId/mediaType or episodeId must be provided" };
    }

    const reviewsList: Review[] = reviewRecords.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName || undefined,
      userImage: r.userImage || undefined,
      mediaId: r.mediaId || undefined,
      mediaType: r.mediaType || undefined,
      episodeId: r.episodeId || undefined,
      rating: r.rating,
      text: r.text || undefined,
      createdAt: r.createdAt || new Date(),
      updatedAt: r.updatedAt || new Date(),
    }));

    return { reviews: reviewsList };
  } catch (error) {
    console.error("Get reviews error:", error);
    return { reviews: [], error: "Failed to fetch reviews" };
  }
}

export async function getUserReviewAction(
  mediaId?: string,
  mediaType?: "movie" | "tv",
  episodeId?: number
): Promise<{ review: Review | null; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { review: null };
  }

  const userId = session.user.id;

  try {
    let reviewRecord;
    
    if (episodeId) {
      const [review] = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.userId, userId),
            eq(reviews.episodeId, episodeId),
            isNull(reviews.mediaId)
          )
        )
        .limit(1);
      reviewRecord = review;
    } else if (mediaId && mediaType) {
      const [review] = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.userId, userId),
            eq(reviews.mediaId, mediaId),
            eq(reviews.mediaType, mediaType),
            isNull(reviews.episodeId)
          )
        )
        .limit(1);
      reviewRecord = review;
    } else {
      return { review: null, error: "Either mediaId/mediaType or episodeId must be provided" };
    }

    if (!reviewRecord) {
      return { review: null };
    }

    const review: Review = {
      id: reviewRecord.id,
      userId: reviewRecord.userId,
      mediaId: reviewRecord.mediaId || undefined,
      mediaType: reviewRecord.mediaType || undefined,
      episodeId: reviewRecord.episodeId || undefined,
      rating: reviewRecord.rating,
      text: reviewRecord.text || undefined,
      createdAt: reviewRecord.createdAt || new Date(),
      updatedAt: reviewRecord.updatedAt || new Date(),
    };

    return { review };
  } catch (error) {
    console.error("Get user review error:", error);
    return { review: null, error: "Failed to fetch review" };
  }
}
