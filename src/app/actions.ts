"use server";

import { searchBooks } from "@/lib/hardcover";
import {
  searchMoviesAndTv,
  searchMoviesOnly,
  searchMoviesWithYear,
  searchTvSeries,
  getMediaById,
} from "@/lib/tmdb";
import { Book, Movie } from "@/types";
import { signIn, signOut, auth } from "@/auth";
import { createUser, getUserByEmail, hashPassword } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { userMovies, userBooks, userEpisodes, reviews, users } from "@/db/schema";
import * as schema from "@/db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { DEFAULT_REGION, SUPPORTED_REGION_CODES } from "@/data/regions";

export type CsvImportRow = {
  title: string;
  year: number;
  watchedDate?: string | null;
  letterboxdUri?: string | null;
  rating?: number | null;
  watchlist?: boolean;
  watched?: boolean;
  rewatch?: boolean;
  source?: string | null;
};

export type CsvImportResult = {
  status: "imported" | "updated" | "not_found" | "error";
  title: string;
  year: number;
  tmdbId?: string;
  watchedDate?: string | null;
  letterboxdUri?: string | null;
  ratingApplied?: number | null;
  watchlistApplied?: boolean;
  watchedApplied?: boolean;
  note?: string;
  reason?: string;
};

const normalizeTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, "");

const popularityComparator = (a: Movie, b: Movie) =>
  (b.popularity ?? 0) - (a.popularity ?? 0) || (b.voteCount ?? 0) - (a.voteCount ?? 0);

const pickBestMatch = (results: Movie[], targetTitle: string, targetYear?: number) => {
  if (!results.length) return null;

  const normalizedTarget = normalizeTitle(targetTitle);
  const hasTargetYear = typeof targetYear === "number" && Number.isFinite(targetYear);

  const exactTitleYearMatches = hasTargetYear
    ? results
        .filter(
          (movie) =>
            movie.year === targetYear && normalizeTitle(movie.title) === normalizedTarget
        )
        .sort(popularityComparator)
    : [];
  if (exactTitleYearMatches.length > 0) return exactTitleYearMatches[0];

  const scoredMatches = results
    .map((movie) => {
      const normalizedMovieTitle = normalizeTitle(movie.title);
      const titleExact = normalizedMovieTitle === normalizedTarget;
      const titleOverlap =
        titleExact ||
        normalizedMovieTitle.includes(normalizedTarget) ||
        normalizedTarget.includes(normalizedMovieTitle);

      if (!titleOverlap) return null;

      const movieYear = movie.year;
      const yearDiff =
        hasTargetYear && typeof movieYear === "number" && Number.isFinite(movieYear)
          ? Math.abs(movieYear - (targetYear as number))
          : null;

      let score = 0;
      score += titleExact ? 60 : 35;

      if (yearDiff !== null) {
        if (yearDiff === 0) score += 40;
        else if (yearDiff === 1) score += 25;
        else if (yearDiff === 2) score += 10;
        else if (yearDiff <= 4) score += 5;
      }

      score += Math.min((movie.popularity ?? 0) / 5, 20);
      score += Math.min((movie.voteCount ?? 0) / 500, 10);

      return { movie, score };
    })
    .flatMap((entry) => (entry ? [entry] : []))
    .sort(
      (a, b) =>
        b.score - a.score ||
        popularityComparator(a.movie, b.movie)
    );

  if (scoredMatches.length > 0) {
    return scoredMatches[0].movie;
  }

  return [...results].sort(popularityComparator)[0];
};

const findBestTmdbMatch = async (title: string, year: number) => {
  const hasYear = Number.isFinite(year);

  const searchPipelines: Array<() => Promise<Movie[]>> = [];

  if (hasYear) {
    searchPipelines.push(() => searchMoviesWithYear(title, year));
  }

  searchPipelines.push(() => searchMoviesOnly(`${title} ${hasYear ? year : ""}`.trim()));
  searchPipelines.push(() => searchMoviesOnly(title));

  for (let i = 0; i < searchPipelines.length; i++) {
    const results = await searchPipelines[i]();
    const match = pickBestMatch(results, title, hasYear ? year : undefined);
    if (match) {
      return { match, usedFallback: i > 0 };
    }
  }

  return { match: null, usedFallback: searchPipelines.length > 1 };
};

type UserMovieMetadata = {
  title: string | null;
  year: number | null;
  runtime: number | null;
  posterUrl: string | null;
  genres: string | null;
  cast: string | null;
  crew: string | null;
};

const toNullableNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const shouldBackfillMetadata = (record?: typeof userMovies.$inferSelect) => {
  if (!record) return true;
  return (
    !record.title ||
    !record.posterUrl ||
    record.year === null ||
    record.year === undefined ||
    record.runtime === null ||
    record.runtime === undefined ||
    !record.genres ||
    !record.cast ||
    !record.crew
  );
};

const fetchUserMovieMetadata = async (
  mediaId: string,
  mediaType: "movie" | "tv"
): Promise<UserMovieMetadata | null> => {
  const media = await getMediaById(mediaId, mediaType);
  if (!media) return null;

  const genresJson =
    Array.isArray(media.genre) && media.genre.length > 0
      ? JSON.stringify(media.genre)
      : null;

  const castJson = media.cast && media.cast.length > 0 ? JSON.stringify(media.cast) : null;
  const crewJson = media.crew && media.crew.length > 0 ? JSON.stringify(media.crew) : null;

  return {
    title: media.title || null,
    year: toNullableNumber(media.year),
    runtime: toNullableNumber(media.runtime),
    posterUrl: media.posterUrl || null,
    genres: genresJson,
    cast: castJson,
    crew: crewJson,
  };
};

const buildMetadataPatch = (
  metadata: UserMovieMetadata | null,
  existing?: typeof userMovies.$inferSelect
) => {
  if (!metadata) return {};
  return {
    title: metadata.title ?? existing?.title ?? null,
    year: metadata.year ?? existing?.year ?? null,
    runtime: metadata.runtime ?? existing?.runtime ?? null,
    posterUrl: metadata.posterUrl ?? existing?.posterUrl ?? null,
    genres: metadata.genres ?? existing?.genres ?? null,
    cast: metadata.cast ?? existing?.cast ?? null,
    crew: metadata.crew ?? existing?.crew ?? null,
  };
};

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

export async function importWatchedMovieAction(row: CsvImportRow): Promise<CsvImportResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      status: "error",
      title: row.title,
      year: row.year,
      letterboxdUri: row.letterboxdUri || null,
      reason: "Not authenticated",
    };
  }

  const title = row.title?.trim();
  const parsedYear = Number(row.year);
  const year = Number.isFinite(parsedYear) ? parsedYear : NaN;

  if (!title || Number.isNaN(year)) {
    return {
      status: "error",
      title: title || row.title || "",
      year: Number.isNaN(year) ? 0 : year,
      letterboxdUri: row.letterboxdUri || null,
      reason: "Missing title or year",
    };
  }

  const shouldMarkWatched = row.watched !== false; // default: mark as watched unless explicitly false
  const watchlistRequested = Boolean(row.watchlist);
  const parseRating = (value?: number | null) => {
    if (value === null || value === undefined) return null;
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return null;
    const clampedHalf = Math.min(5, Math.max(0.5, numeric));
    const roundedHalf = Math.round(clampedHalf * 2) / 2;
    const normalized = Math.round(roundedHalf);
    return normalized < 1 ? 1 : normalized > 5 ? 5 : normalized;
  };
  const rating = parseRating(row.rating);

  try {
    const { match, usedFallback } = await findBestTmdbMatch(title, year);

    if (!match) {
      return {
        status: "not_found",
        title,
        year,
        letterboxdUri: row.letterboxdUri || null,
        reason: usedFallback
          ? "No TMDB match found after title+year and title-only search"
          : "No TMDB match found",
      };
    }

    const now = new Date();
    const parsedWatched =
      shouldMarkWatched && row.watchedDate ? new Date(row.watchedDate) : null;
    const parsedWatchedDate =
      parsedWatched && !Number.isNaN(parsedWatched.getTime()) ? parsedWatched : null;

    const metadata =
      (await fetchUserMovieMetadata(match.id, "movie")) ??
      ({
        title: match.title || null,
        year: toNullableNumber(match.year),
        runtime: toNullableNumber(match.runtime),
        posterUrl: match.posterUrl || null,
        genres: match.genre?.length ? JSON.stringify(match.genre) : null,
      } satisfies UserMovieMetadata);

    const existing = await db
      .select()
      .from(userMovies)
      .where(
        and(
          eq(userMovies.userId, session.user.id),
          eq(userMovies.movieId, match.id),
          eq(userMovies.mediaType, "movie")
        )
      )
      .limit(1);

    const watchedDate =
      shouldMarkWatched && parsedWatchedDate
        ? parsedWatchedDate
        : shouldMarkWatched && !parsedWatchedDate && existing[0]?.watchedDate
          ? existing[0].watchedDate
          : shouldMarkWatched
            ? now
            : existing[0]?.watchedDate ?? null;

    const watchedValue = shouldMarkWatched || existing.some((e) => e.watched);
    const watchlistValue = watchlistRequested || existing.some((e) => e.watchlist);

    if (existing.length > 0) {
      await db
        .update(userMovies)
        .set({
          watched: watchedValue,
          watchedDate: watchedValue ? watchedDate : existing[0].watchedDate ?? null,
          watchlist: watchlistValue,
          updatedAt: now,
          ...buildMetadataPatch(metadata, existing[0]),
        })
        .where(eq(userMovies.id, existing[0].id));
    } else {
      await db.insert(userMovies).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        movieId: match.id,
        mediaType: "movie",
        watched: watchedValue,
        watchedDate: watchedValue ? watchedDate : null,
        liked: false,
        watchlist: watchlistValue,
        createdAt: now,
        updatedAt: now,
        ...buildMetadataPatch(metadata),
      });
    }

    if (rating) {
      const [existingReview] = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.userId, session.user.id),
            eq(reviews.mediaId, match.id),
            eq(reviews.mediaType, "movie"),
            isNull(reviews.episodeId)
          )
        )
        .limit(1);

      if (existingReview) {
        await db
          .update(reviews)
          .set({
            rating,
            updatedAt: now,
          })
          .where(eq(reviews.id, existingReview.id));
      } else {
        await db.insert(reviews).values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          mediaId: match.id,
          mediaType: "movie",
          rating,
          text: null,
        });
      }
    }

    const noteParts = [
        watchlistValue ? "watchlist" : null,
        watchedValue ? "watched" : null,
        rating ? `rating ${rating}` : null,
    ].flatMap((item) => (item ? [item] : []));

    // Keep profile data fresh
    revalidatePath("/profile");

    return {
      status: existing.length > 0 ? "updated" : "imported",
      title,
      year,
      tmdbId: match.id,
      watchedDate: watchedValue && watchedDate ? watchedDate.toISOString() : null,
      letterboxdUri: row.letterboxdUri || null,
      ratingApplied: rating ?? null,
      watchlistApplied: watchlistValue || undefined,
      watchedApplied: watchedValue,
      note: noteParts.length ? noteParts.join(" · ") : undefined,
    };
  } catch (error) {
    console.error("Import watched movie error:", error);
    return {
      status: "error",
      title: row.title,
      year: row.year,
      letterboxdUri: row.letterboxdUri || null,
      reason: "Unexpected error while importing",
    };
  }
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

export async function updateProfileAction({
  name,
  email,
  password,
  preferredRegion,
}: {
  name?: string | null;
  email?: string | null;
  password?: string | null;
  preferredRegion?: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;
  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (name !== undefined && name !== null) {
    const trimmed = name.trim();
    updates.name = trimmed || null;
  }

  if (email && email !== session.user.email) {
    const existing = await getUserByEmail(email);
    if (existing && existing.id !== userId) {
      return { error: "Email already in use" };
    }
    updates.email = email;
  }

  if (password) {
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters" };
    }
    updates.password = await hashPassword(password);
  }

  if (preferredRegion) {
    const normalizedRegion = preferredRegion.toUpperCase();
    if (!SUPPORTED_REGION_CODES.includes(normalizedRegion)) {
      return { error: "Unsupported region" };
    }
    updates.preferredRegion = normalizedRegion;
  }

  try {
    await db.update(users).set(updates).where(eq(users.id, userId));
    revalidatePath("/settings");
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { error: "Failed to update profile" };
  }
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

      const metadata =
        (existing.length === 0 || shouldBackfillMetadata(existing[0]))
          ? await fetchUserMovieMetadata(mediaId, mediaType as "movie" | "tv")
          : null;

      if (existing.length > 0) {
        await db
          .update(userMovies)
          .set({
            watched: isWatched,
            watchedDate: isWatched ? now : null,
            updatedAt: now,
            ...buildMetadataPatch(metadata, existing[0]),
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
          ...buildMetadataPatch(metadata),
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

      const metadata =
        (existing.length === 0 || shouldBackfillMetadata(existing[0]))
          ? await fetchUserMovieMetadata(mediaId, mediaType as "movie" | "tv")
          : null;

      if (existing.length > 0) {
        await db
          .update(userMovies)
          .set({
            watchlist: isWatchlist,
            updatedAt: now,
            ...buildMetadataPatch(metadata, existing[0]),
          })
          .where(eq(userMovies.id, existing[0].id));
      } else {
        await db.insert(userMovies).values({
          id: crypto.randomUUID(),
          userId,
          movieId: mediaId,
          mediaType: mediaType as "movie" | "tv",
          watchlist: isWatchlist,
          ...buildMetadataPatch(metadata),
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

      const metadata =
        (existing.length === 0 || shouldBackfillMetadata(existing[0]))
          ? await fetchUserMovieMetadata(mediaId, mediaType as "movie" | "tv")
          : null;

      if (existing.length > 0) {
        await db
          .update(userMovies)
          .set({
            liked: isLiked,
            updatedAt: now,
            ...buildMetadataPatch(metadata, existing[0]),
          })
          .where(eq(userMovies.id, existing[0].id));
      } else {
        await db.insert(userMovies).values({
          id: crypto.randomUUID(),
          userId,
          movieId: mediaId,
          mediaType: mediaType as "movie" | "tv",
          liked: isLiked,
          ...buildMetadataPatch(metadata),
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
      const conditions = [eq(userBooks.userId, userId)];

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

      // Create Book objects from cached database data, only fetch from API if absolutely necessary
      const books: Book[] = userBooksData.map((userBook) => {
        // Create book from cached database data (we'd need to extend the schema to store more metadata)
        // For now, create a basic book object
        const book: Book = {
          id: userBook.bookId,
          title: `Book ${userBook.bookId}`, // This should come from cached metadata
          author: "Unknown Author", // This should come from cached metadata
          year: 2024, // This should come from cached metadata
          coverImage: "/placeholder-book.jpg",
          description: "Book description not available",
          rating: 0,
          genre: ["General"],
          pages: 0,
          mediaType: 'book',
          watched: userBook.watched ?? false,
          liked: userBook.liked ?? false,
          watchlist: userBook.watchlist ?? false,
          readDate: userBook.readDate
            ? userBook.readDate.toISOString()
            : undefined,
        };

        return book;
      });

      return { books };
    } else {
      const conditions = [eq(userMovies.userId, userId)];

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

      const toMillis = (value?: Date | string | null) => {
        if (!value) return 0;
        const date = value instanceof Date ? value : new Date(value);
        const time = date.getTime();
        return Number.isNaN(time) ? 0 : time;
      };

      // Create Movie objects from cached database data instead of making API calls
      const movies: Movie[] = userMoviesData.map((userMovie) => {
        // Use cached metadata from database instead of fetching from TMDB API
        const movie: Movie = {
          id: userMovie.movieId,
          title: userMovie.title || `Movie ${userMovie.movieId}`,
          year: userMovie.year || 2024,
          posterUrl: userMovie.posterUrl || "/placeholder.jpg",
          backdropUrl: userMovie.posterUrl ? undefined : undefined,
          rating: null,
          voteCount: 0,
          popularity: 0,
          genre: userMovie.genres ? JSON.parse(userMovie.genres) : [],
          overview: "",
          trailerKey: undefined,
          trailerUrl: undefined,
          runtime: userMovie.runtime || 0,
          tagline: "",
          status: "",
          mediaType: userMovie.mediaType as "movie" | "tv",
          watched: userMovie.watched ?? false,
          liked: userMovie.liked ?? false,
          watchlist: userMovie.watchlist ?? false,
          watchedDate: userMovie.watchedDate
            ? userMovie.watchedDate.toISOString()
            : undefined,
          cast: userMovie.cast ? JSON.parse(userMovie.cast) : [],
          crew: userMovie.crew ? JSON.parse(userMovie.crew) : [],
          images: [],
          numberOfSeasons: undefined,
          numberOfEpisodes: undefined,
        };

        // Calculate sort timestamp for ordering
        const watchedDateMs = userMovie.watched ? toMillis(userMovie.watchedDate) : 0;
        const updatedMs = toMillis(userMovie.updatedAt) || toMillis(userMovie.createdAt);
        const sortMs = userMovie.watched
          ? watchedDateMs || updatedMs
          : updatedMs || watchedDateMs;

        return {
          sortMs,
          movie,
        };
      })
        .sort((a, b) => b.sortMs - a.sortMs)
        .map((entry) => entry.movie);

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
