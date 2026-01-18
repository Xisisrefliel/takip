"use server";

import { searchBooks } from "@/lib/hardcover";
import {
  searchMoviesAndTv,
  searchMoviesOnly,
  searchMoviesWithYear,
  searchTvSeries,
  getMediaById,
  getEnhancedMovieData,
  getWatchProviders,
} from "@/lib/tmdb";
import { Book, Movie, Season } from "@/types";
import { signIn, signOut, auth } from "@/auth";
import { createUser, getUserByEmail, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { userMovies, userBooks, userEpisodes, reviews, users, negativeSignals } from "@/db/schema";
import * as schema from "@/db/schema";
import { eq, and, inArray, isNull, not } from "drizzle-orm";
import { DEFAULT_REGION, SUPPORTED_REGION_CODES } from "@/data/regions";
import { invalidateUserStats } from "@/lib/stats-cache";

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
  keywords: string | null;
  collectionId: number | null;
  collectionName: string | null;
  productionCompanies: string | null;
  productionCountries: string | null;
  watchProviders: string | null;
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

  // Production metadata from media object
  const productionCompaniesJson =
    media.productionCompanies && media.productionCompanies.length > 0
      ? JSON.stringify(media.productionCompanies)
      : null;

  const productionCountriesJson =
    media.productionCountries && media.productionCountries.length > 0
      ? JSON.stringify(media.productionCountries)
      : null;

  // Fetch watch providers
  let watchProvidersJson: string | null = null;
  try {
    const providers = await getWatchProviders(mediaId, mediaType);
    if (providers && Object.keys(providers).length > 0) {
      watchProvidersJson = JSON.stringify(providers);
    }
  } catch (error) {
    console.error("Error fetching watch providers:", error);
  }

  // Fetch enhanced data (keywords, collection) for movies only
  let keywordsJson: string | null = null;
  let collectionId: number | null = null;
  let collectionName: string | null = null;

  if (mediaType === "movie") {
    try {
      const enhancedData = await getEnhancedMovieData(mediaId);
      if (enhancedData.keywords.length > 0) {
        keywordsJson = JSON.stringify(enhancedData.keywords);
      }
      if (enhancedData.collection) {
        collectionId = enhancedData.collection.id;
        collectionName = enhancedData.collection.name;
      }
    } catch (error) {
      console.error("Error fetching enhanced movie data:", error);
    }
  } else {
    // For TV shows, keywords are already in media object
    if (media.keywords && media.keywords.length > 0) {
      keywordsJson = JSON.stringify(media.keywords);
    }
  }

  return {
    title: media.title || null,
    year: toNullableNumber(media.year),
    runtime: toNullableNumber(media.runtime),
    posterUrl: media.posterUrl || null,
    genres: genresJson,
    cast: castJson,
    crew: crewJson,
    keywords: keywordsJson,
    collectionId,
    collectionName,
    productionCompanies: productionCompaniesJson,
    productionCountries: productionCountriesJson,
    watchProviders: watchProvidersJson,
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
    keywords: metadata.keywords ?? existing?.keywords ?? null,
    collectionId: metadata.collectionId ?? existing?.collectionId ?? null,
    collectionName: metadata.collectionName ?? existing?.collectionName ?? null,
    productionCompanies: metadata.productionCompanies ?? existing?.productionCompanies ?? null,
    productionCountries: metadata.productionCountries ?? existing?.productionCountries ?? null,
    watchProviders: metadata.watchProviders ?? existing?.watchProviders ?? null,
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
        cast: match.cast?.length ? JSON.stringify(match.cast) : null,
        crew: match.crew?.length ? JSON.stringify(match.crew) : null,
        keywords: null,
        collectionId: null,
        collectionName: null,
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
    invalidateUserStats(session.user.id);

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

    return { success: true };
  } catch (error) {
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

    return { success: true };
  } catch (error) {
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

    // Revalidate user-specific pages only (not homepage - user status is fetched fresh)
    revalidatePath("/profile");
    invalidateUserStats(userId);

    // Mark recommendations as stale (will refresh in background on next request)
    import("@/lib/recommendation-cache").then(({ markRecommendationsStale }) => {
      markRecommendationsStale(userId);
    });

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

    // Revalidate user-specific pages only (not homepage - user status is fetched fresh)
    revalidatePath("/profile");
    invalidateUserStats(userId);

    // Mark recommendations as stale (will refresh in background on next request)
    import("@/lib/recommendation-cache").then(({ markRecommendationsStale }) => {
      markRecommendationsStale(userId);
    });

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

    // Revalidate user-specific pages only (not homepage - user status is fetched fresh)
    revalidatePath("/profile");
    invalidateUserStats(userId);

    // Mark recommendations as stale (will refresh in background on next request)
    import("@/lib/recommendation-cache").then(({ markRecommendationsStale }) => {
      markRecommendationsStale(userId);
    });

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
          rating: 0,
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
  mediaType: "movie" | "tv" | "book",
  userId?: string
): Promise<{ watched: boolean; liked: boolean; watchlist: boolean }> {
  if (!userId) {
    const session = await auth();
    userId = session?.user?.id;
    if (!userId) {
      return { watched: false, liked: false, watchlist: false };
    }
  }

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

  return enrichMoviesWithUserStatusInternal(movies, session.user.id);
}

// Internal function that skips auth check - used by batch version
async function enrichMoviesWithUserStatusInternal(movies: Movie[], userId: string): Promise<Movie[]> {
  if (!movies || movies.length === 0) {
    return movies;
  }

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

// Batch version: enriches multiple movie arrays with a single auth check and DB query
export async function enrichMoviesWithUserStatusBatch<T extends Movie[][]>(
  ...movieArrays: T
): Promise<T> {
  const session = await auth();
  if (!session?.user?.id) {
    return movieArrays;
  }

  const userId = session.user.id;

  // Combine all movies for a single DB query
  const allMovies = movieArrays.flat();
  if (allMovies.length === 0) {
    return movieArrays;
  }

  try {
    // Group all movies by mediaType
    const movieIds: string[] = [];
    const tvIds: string[] = [];

    allMovies.forEach(movie => {
      if (movie.mediaType === 'movie') {
        movieIds.push(movie.id);
      } else if (movie.mediaType === 'tv') {
        tvIds.push(movie.id);
      }
    });

    // Single batch query for all statuses
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

    // Create a shared map for quick lookup
    const statusMap = new Map<string, { watched: boolean; liked: boolean; watchlist: boolean }>();

    [...movieStatuses, ...tvStatuses].forEach(status => {
      statusMap.set(status.movieId, {
        watched: status.watched ?? false,
        liked: status.liked ?? false,
        watchlist: status.watchlist ?? false,
      });
    });

    // Enrich each array while preserving structure
    return movieArrays.map(movies =>
      movies.map(movie => {
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
      })
    ) as T;
  } catch (error) {
    console.error("Batch enrich movies with user status error:", error);
    return movieArrays;
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

    // Track negative signals for low ratings (1-2 stars) on movies/TV
    if (rating <= 2 && mediaId && mediaType) {
      try {
        // Fetch metadata to include in context
        const [userMovie] = await db
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

        const context = {
          ratedAt: now.toISOString(),
          genres: userMovie?.genres || null,
          productionCompanies: userMovie?.productionCompanies || null,
        };

        await db.insert(negativeSignals).values({
          id: crypto.randomUUID(),
          userId,
          movieId: mediaId,
          mediaType,
          signalType: "low_rating",
          signalValue: rating,
          context: JSON.stringify(context),
          createdAt: now,
        });
      } catch (error) {
        console.error("Error tracking negative signal:", error);
        // Don't fail the review creation if negative signal tracking fails
      }
    }

    // Revalidate the specific media page where review is shown
    if (mediaId && mediaType) {
      revalidatePath(`/${mediaType}/${mediaId}`);
    }
    invalidateUserStats(userId);
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

    // Revalidate the specific media page where review is shown
    if (existingReview.mediaId && existingReview.mediaType) {
      revalidatePath(`/${existingReview.mediaType}/${existingReview.mediaId}`);
    }
    invalidateUserStats(userId);
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

    // Revalidate the specific media page where review is shown
    if (existingReview.mediaId && existingReview.mediaType) {
      revalidatePath(`/${existingReview.mediaType}/${existingReview.mediaId}`);
    }
    invalidateUserStats(userId);
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

export async function loadRemainingSeasonsAction(seriesId: string, loadedSeasonCount: number): Promise<{ seasons: Season[] | null; error?: string }> {
  try {
    const TMDB_BASE_URL = "https://api.themoviedb.org/3";
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    const TMDB_IMAGE_BASE_URL_W500 = "https://image.tmdb.org/t/p/w500";

    const queryParams = new URLSearchParams({
      api_key: TMDB_API_KEY || "",
      language: "en-US",
    });
    const url = `${TMDB_BASE_URL}/tv/${seriesId}?${queryParams.toString()}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const allSeasonsData = await res.json();
    
    if (!allSeasonsData?.seasons) {
      return { seasons: null, error: "No seasons found" };
    }

    const remainingSeasons = allSeasonsData.seasons.slice(loadedSeasonCount, loadedSeasonCount + 10);
    
    const seasonsWithEpisodes = await Promise.all(
      remainingSeasons.map(async (season: { season_number: number; id: number; name: string; overview: string; poster_path: string | null; episode_count: number; air_date: string }) => {
        try {
          const seasonUrl = `${TMDB_BASE_URL}/tv/${seriesId}/season/${season.season_number}?${queryParams.toString()}`;
          const seasonRes = await fetch(seasonUrl, { next: { revalidate: 3600 } });
          const seasonDetail = await seasonRes.json();
          
          return {
            id: season.id,
            name: season.name,
            overview: season.overview,
            posterPath: season.poster_path ? `${TMDB_IMAGE_BASE_URL_W500}${season.poster_path}` : undefined,
            seasonNumber: season.season_number,
            episodeCount: season.episode_count,
            airDate: season.air_date,
            episodes: seasonDetail?.episodes?.map((ep: { id: number; name: string; overview: string; air_date: string; episode_number: number; season_number: number; still_path: string | null; vote_average: number; runtime?: number }) => ({
              id: ep.id,
              name: ep.name,
              overview: ep.overview,
              airDate: ep.air_date,
              episodeNumber: ep.episode_number,
              seasonNumber: ep.season_number,
              stillPath: ep.still_path ? `${TMDB_IMAGE_BASE_URL_W500}${ep.still_path}` : undefined,
              voteAverage: ep.vote_average,
              runtime: ep.runtime
            })) || []
          } as Season;
        } catch {
          return null;
        }
      })
    );

    return { seasons: seasonsWithEpisodes.filter((s): s is Season => s !== null) };
  } catch (error) {
    console.error("Error loading remaining seasons:", error);
    return { seasons: null, error: "Failed to load seasons" };
  }
}

export async function getRecommendationsAction(
  type: "personalized" | "similar",
  mediaId?: string
): Promise<{ movies?: Movie[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  try {
    if (type === "personalized") {
      const { getPersonalizedRecommendations } = await import("@/lib/recommendations");
      const movies = await getPersonalizedRecommendations(userId, 12);
      return { movies };
    } else if (type === "similar" && mediaId) {
      // Use TMDB recommendations for similar movies
      const { getMovieRecommendations } = await import("@/lib/tmdb");
      const movies = await getMovieRecommendations(mediaId, 6);
      return { movies };
    }

    return { error: "Invalid request" };
  } catch (error) {
    console.error("Get recommendations error:", error);
    return { error: "Failed to get recommendations" };
  }
}

export async function getMoodRecommendationsAction(
  mood: string
): Promise<{ movies?: Movie[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  const validMoods = ["uplifting", "mind-bending", "dark-intense", "feel-good", "adrenaline", "thought-provoking", "classic"];

  if (!validMoods.includes(mood)) {
    return { error: "Invalid mood" };
  }

  try {
    // Try to get from cache first
    const { getCachedMoodRecommendations } = await import("@/lib/recommendation-cache");
    const { movies } = await getCachedMoodRecommendations(userId, mood);
    return { movies };
  } catch (error) {
    console.error("Get mood recommendations error:", error);
    return { error: "Failed to get mood recommendations" };
  }
}

export async function getExplorationRecommendationsAction(): Promise<{
  movies?: Movie[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  try {
    // Try cache first
    const { getCachedRecommendations } = await import("@/lib/recommendation-cache");
    const cached = await getCachedRecommendations(userId);
    if (cached?.exploration?.length) {
      return { movies: cached.exploration };
    }
    // Fall back to generating
    const { getExplorationRecommendations } = await import("@/lib/recommendations");
    const movies = await getExplorationRecommendations(userId, 12);
    return { movies };
  } catch (error) {
    console.error("Get exploration recommendations error:", error);
    return { error: "Failed to get exploration recommendations" };
  }
}

export async function getHiddenGemsAction(): Promise<{ movies?: Movie[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  try {
    // Try cache first
    const { getCachedRecommendations } = await import("@/lib/recommendation-cache");
    const cached = await getCachedRecommendations(userId);
    if (cached?.hiddenGems?.length) {
      return { movies: cached.hiddenGems };
    }
    // Fall back to generating
    const { getHiddenGems } = await import("@/lib/recommendations");
    const movies = await getHiddenGems(userId, 12);
    return { movies };
  } catch (error) {
    console.error("Get hidden gems error:", error);
    return { error: "Failed to get hidden gems" };
  }
}

// Get all cached recommendations at once (for homepage SSR)
export async function getAllCachedRecommendationsAction(): Promise<{
  personalized?: Movie[];
  exploration?: Movie[];
  hiddenGems?: Movie[];
  moods?: Record<string, Movie[]>;
  defaultMood?: string;
  isStale?: boolean;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  try {
    const { getRecommendationsWithSWR } = await import("@/lib/recommendation-cache");
    const cached = await getRecommendationsWithSWR(userId);
    return {
      personalized: cached.personalized,
      exploration: cached.exploration,
      hiddenGems: cached.hiddenGems,
      moods: cached.moods,
      defaultMood: cached.defaultMood,
      isStale: cached.isStale,
    };
  } catch (error) {
    console.error("Get all cached recommendations error:", error);
    return { error: "Failed to get recommendations" };
  }
}

export async function getWatchedCountAction(): Promise<{ count?: number; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  try {
    const { getWatchedCount } = await import("@/lib/recommendations");
    const count = await getWatchedCount(userId);
    return { count };
  } catch (error) {
    console.error("Get watched count error:", error);
    return { error: "Failed to get watched count" };
  }
}

export async function getDefaultMoodAction(): Promise<{ mood?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  try {
    const { getDefaultMood } = await import("@/lib/recommendations");
    const mood = await getDefaultMood(userId);
    return { mood };
  } catch (error) {
    console.error("Get default mood error:", error);
    return { error: "Failed to get default mood" };
  }
}

// Spotify Actions
export async function syncRecentlyPlayedAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  try {
    const {
      getRecentlyPlayed,
      getAlbumById,
      getValidSpotifyToken,
    } = await import("@/lib/spotify");
    const { userAlbums, userTracks, userMusicStats, spotifySyncLog } = await import(
      "@/db/schema"
    );

    const token = await getValidSpotifyToken(userId);
    if (!token) {
      return { error: "Spotify not connected" };
    }

    // Create sync log entry
    const syncLogId = crypto.randomUUID();
    const now = new Date();

    await db.insert(spotifySyncLog).values({
      id: syncLogId,
      userId,
      syncType: "recently_played",
      status: "started",
      startedAt: now,
    });

    // Fetch recently played tracks
    const tracks = await getRecentlyPlayed(userId, 50);

    // Group tracks by album
    const albumIds = [...new Set(tracks.map((t) => t.albumId))];

    let processedCount = 0;

    for (const albumId of albumIds) {
      // Check if album already exists
      const existing = await db
        .select()
        .from(userAlbums)
        .where(and(eq(userAlbums.userId, userId), eq(userAlbums.albumId, albumId)))
        .limit(1);

      if (existing.length === 0) {
        // Fetch album details
        const album = await getAlbumById(albumId, token);
        if (album) {
          await db.insert(userAlbums).values({
            id: crypto.randomUUID(),
            userId,
            albumId: album.id,
            title: album.title,
            artist: album.artist,
            artists: JSON.stringify(album.artists),
            year: album.year,
            coverUrl: album.coverUrl,
            genres: JSON.stringify(album.genres),
            totalTracks: album.totalTracks,
            spotifyUrl: album.spotifyUrl,
            albumType: album.albumType,
            syncSource: "recently_played",
            lastSyncedAt: now,
          });
        }
      } else {
        // Update last synced time
        await db
          .update(userAlbums)
          .set({ lastSyncedAt: now })
          .where(eq(userAlbums.id, existing[0].id));
      }
      processedCount++;
    }

    // Save track listening history
    for (const track of tracks) {
      const existingTrack = await db
        .select()
        .from(userTracks)
        .where(
          and(
            eq(userTracks.userId, userId),
            eq(userTracks.trackId, track.id),
            eq(userTracks.playedAt, new Date(track.playedAt!))
          )
        )
        .limit(1);

      if (existingTrack.length === 0) {
        await db.insert(userTracks).values({
          id: crypto.randomUUID(),
          userId,
          trackId: track.id,
          albumId: track.albumId,
          trackName: track.name,
          artistName: track.artistName,
          durationMs: track.durationMs,
          spotifyUrl: track.spotifyUrl,
          playedAt: new Date(track.playedAt!),
          playCount: 1,
        });
      }
    }

    // Update sync log
    await db
      .update(spotifySyncLog)
      .set({
        status: "completed",
        itemsProcessed: processedCount,
        completedAt: new Date(),
      })
      .where(eq(spotifySyncLog.id, syncLogId));

    // Update last sync timestamp in stats
    await db
      .insert(userMusicStats)
      .values({
        userId,
        lastRecentlyPlayedSync: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userMusicStats.userId,
        set: {
          lastRecentlyPlayedSync: now,
          updatedAt: now,
        },
      });

    revalidatePath("/music");

    return { success: true, itemsProcessed: processedCount };
  } catch (error) {
    console.error("Sync recently played error:", error);
    return { error: "Failed to sync recently played" };
  }
}

export async function syncTopItemsAction(timeRange: "short_term" | "medium_term" | "long_term" = "medium_term") {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  try {
    const { getTopTracks, getTopArtists } = await import("@/lib/spotify");
    const { userMusicStats, spotifySyncLog } = await import("@/db/schema");

    // Create sync log entry
    const syncLogId = crypto.randomUUID();
    const now = new Date();

    await db.insert(spotifySyncLog).values({
      id: syncLogId,
      userId,
      syncType: "top_items",
      status: "started",
      startedAt: now,
    });

    // Fetch top tracks and artists
    const [topTracks, topArtists] = await Promise.all([
      getTopTracks(userId, timeRange, 50),
      getTopArtists(userId, timeRange, 50),
    ]);

    // Get existing stats
    const existingStats = await db
      .select()
      .from(userMusicStats)
      .where(eq(userMusicStats.userId, userId))
      .limit(1);

    const currentStats = existingStats[0];
    const topTracksData = (currentStats?.topTracks as Record<string, unknown[]>) || {
      short_term: [],
      medium_term: [],
      long_term: [],
    };
    const topArtistsData = (currentStats?.topArtists as Record<string, unknown[]>) || {
      short_term: [],
      medium_term: [],
      long_term: [],
    };

    // Update the specific time range
    topTracksData[timeRange] = topTracks;
    topArtistsData[timeRange] = topArtists;

    // Calculate top genres from artists
    const genreMap = new Map<string, number>();
    topArtists.forEach((artist) => {
      artist.genres.forEach((genre) => {
        genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
      });
    });
    const topGenres = Array.from(genreMap.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Update or insert stats
    await db
      .insert(userMusicStats)
      .values({
        userId,
        topTracks: topTracksData,
        topArtists: topArtistsData,
        topGenres,
        lastTopItemsSync: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userMusicStats.userId,
        set: {
          topTracks: topTracksData,
          topArtists: topArtistsData,
          topGenres,
          lastTopItemsSync: now,
          updatedAt: now,
        },
      });

    // Update sync log
    await db
      .update(spotifySyncLog)
      .set({
        status: "completed",
        itemsProcessed: topTracks.length + topArtists.length,
        completedAt: new Date(),
      })
      .where(eq(spotifySyncLog.id, syncLogId));

    revalidatePath("/music");

    return {
      success: true,
      tracksCount: topTracks.length,
      artistsCount: topArtists.length,
    };
  } catch (error) {
    console.error("Sync top items error:", error);
    return { error: "Failed to sync top items" };
  }
}

export async function syncAllSpotifyDataAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const { spotifySyncLog } = await import("@/db/schema");

    // Create sync log entry
    const syncLogId = crypto.randomUUID();
    const now = new Date();

    await db.insert(spotifySyncLog).values({
      id: syncLogId,
      userId: session.user.id,
      syncType: "full",
      status: "started",
      startedAt: now,
    });

    // Sync recently played
    const recentResult = await syncRecentlyPlayedAction();
    if (recentResult.error) {
      await db
        .update(spotifySyncLog)
        .set({
          status: "failed",
          errorMessage: recentResult.error,
          completedAt: new Date(),
        })
        .where(eq(spotifySyncLog.id, syncLogId));
      return recentResult;
    }

    // Sync all time ranges for top items
    const timeRanges: ("short_term" | "medium_term" | "long_term")[] = [
      "short_term",
      "medium_term",
      "long_term",
    ];

    for (const timeRange of timeRanges) {
      const topResult = await syncTopItemsAction(timeRange);
      if (topResult.error) {
        await db
          .update(spotifySyncLog)
          .set({
            status: "failed",
            errorMessage: topResult.error,
            completedAt: new Date(),
          })
          .where(eq(spotifySyncLog.id, syncLogId));
        return topResult;
      }
    }

    // Update full sync timestamp
    const { userMusicStats } = await import("@/db/schema");
    await db
      .update(userMusicStats)
      .set({
        lastFullSync: now,
        updatedAt: now,
      })
      .where(eq(userMusicStats.userId, session.user.id));

    // Update sync log
    await db
      .update(spotifySyncLog)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(spotifySyncLog.id, syncLogId));

    revalidatePath("/music");

    return { success: true };
  } catch (error) {
    console.error("Full sync error:", error);
    return { error: "Failed to complete full sync" };
  }
}

export async function getCurrentlyPlayingAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const { getCurrentlyPlaying } = await import("@/lib/spotify");
    const { userMusicStats } = await import("@/db/schema");

    const currentlyPlaying = await getCurrentlyPlaying(session.user.id);

    // Update stats with currently playing
    await db
      .insert(userMusicStats)
      .values({
        userId: session.user.id,
        currentlyPlaying,
        lastCurrentlyPlayingSync: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userMusicStats.userId,
        set: {
          currentlyPlaying,
          lastCurrentlyPlayingSync: new Date(),
          updatedAt: new Date(),
        },
      });

    return { currentlyPlaying };
  } catch (error) {
    console.error("Get currently playing error:", error);
    return { error: "Failed to get currently playing" };
  }
}

export async function toggleAlbumLikedAction(albumId: string, isLiked: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;
  const now = new Date();

  try {
    const { userAlbums } = await import("@/db/schema");
    const { getAlbumById, getValidSpotifyToken } = await import("@/lib/spotify");

    const existing = await db
      .select()
      .from(userAlbums)
      .where(and(eq(userAlbums.userId, userId), eq(userAlbums.albumId, albumId)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userAlbums)
        .set({
          liked: isLiked,
          updatedAt: now,
        })
        .where(eq(userAlbums.id, existing[0].id));
    } else {
      // Fetch album details to create record
      const token = await getValidSpotifyToken(userId);
      if (!token) {
        return { error: "Spotify not connected" };
      }

      const album = await getAlbumById(albumId, token);
      if (!album) {
        return { error: "Album not found" };
      }

      await db.insert(userAlbums).values({
        id: crypto.randomUUID(),
        userId,
        albumId: album.id,
        title: album.title,
        artist: album.artist,
        artists: JSON.stringify(album.artists),
        year: album.year,
        coverUrl: album.coverUrl,
        genres: JSON.stringify(album.genres),
        totalTracks: album.totalTracks,
        spotifyUrl: album.spotifyUrl,
        albumType: album.albumType,
        liked: isLiked,
        syncSource: "manual",
      });
    }

    revalidatePath("/music");
    revalidatePath(`/album/${albumId}`);

    return { success: true };
  } catch (error) {
    console.error("Toggle album liked error:", error);
    return { error: "Failed to update album liked status" };
  }
}

export async function searchAlbumsAction(query: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const { searchAlbums, getValidSpotifyToken } = await import("@/lib/spotify");

    const token = await getValidSpotifyToken(session.user.id);
    if (!token) {
      return { error: "Spotify not connected" };
    }

    const albums = await searchAlbums(query, token, 20);

    return { albums };
  } catch (error) {
    console.error("Search albums error:", error);
    return { error: "Failed to search albums" };
  }
}

export async function getUserAlbumsAction(filter: "all" | "liked" | "synced" = "all") {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  try {
    const { userAlbums } = await import("@/db/schema");

    const whereConditions = [
      eq(userAlbums.userId, userId),
      ...(filter === "liked"
        ? [eq(userAlbums.liked, true)]
        : filter === "synced"
          ? [not(isNull(userAlbums.liked))]
          : []),
    ];

    const results = await db
      .select()
      .from(userAlbums)
      .where(and(...whereConditions))
      .orderBy(userAlbums.lastSyncedAt);

    const albums = results.map((album) => ({
      id: album.albumId,
      title: album.title,
      artist: album.artist,
      artists: album.artists ? JSON.parse(album.artists) : [],
      year: album.year || 0,
      coverUrl: album.coverUrl || "",
      genres: album.genres ? JSON.parse(album.genres) : [],
      totalTracks: album.totalTracks || 0,
      spotifyUrl: album.spotifyUrl || "",
      albumType: album.albumType as "album" | "single" | "compilation" | undefined,
      liked: album.liked || false,
      addedDate: album.addedDate?.toISOString(),
      syncSource: album.syncSource,
    }));

    return { albums };
  } catch (error) {
    console.error("Get user albums error:", error);
    return { error: "Failed to fetch user albums" };
  }
}

export async function getAlbumDetailsAction(albumId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  try {
    const { getAlbumById, getValidSpotifyToken } = await import("@/lib/spotify");
    const { userAlbums } = await import("@/db/schema");

    const token = await getValidSpotifyToken(userId);
    if (!token) {
      return { error: "Spotify not connected" };
    }

    const album = await getAlbumById(albumId, token);
    if (!album) {
      return { error: "Album not found" };
    }

    // Get user's status for this album
    const userAlbum = await db
      .select()
      .from(userAlbums)
      .where(and(eq(userAlbums.userId, userId), eq(userAlbums.albumId, albumId)))
      .limit(1);

    if (userAlbum.length > 0) {
      album.liked = userAlbum[0].liked || false;
      album.addedDate = userAlbum[0].addedDate?.toISOString();
      album.syncSource = userAlbum[0].syncSource || undefined;
    }

    // Get user's review if exists
    const review = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.albumId, albumId)))
      .limit(1);

    if (review.length > 0) {
      album.userRating = review[0].rating;
      album.userReview = review[0].text || undefined;
    }

    return { album };
  } catch (error) {
    console.error("Get album details error:", error);
    return { error: "Failed to fetch album details" };
  }
}

export async function createAlbumReviewAction(
  albumId: string,
  albumType: string,
  rating: number,
  text?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  if (rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5" };
  }

  try {
    // Check if review already exists
    const existing = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.albumId, albumId)))
      .limit(1);

    if (existing.length > 0) {
      return { error: "Review already exists. Use update instead." };
    }

    await db.insert(reviews).values({
      id: crypto.randomUUID(),
      userId,
      albumId,
      albumType,
      rating,
      text: text || null,
    });

    revalidatePath("/music");
    revalidatePath(`/album/${albumId}`);

    return { success: true };
  } catch (error) {
    console.error("Create album review error:", error);
    return { error: "Failed to create review" };
  }
}

export async function updateAlbumReviewAction(
  reviewId: string,
  rating: number,
  text?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  if (rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5" };
  }

  try {
    // Verify ownership
    const review = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (review.length === 0 || review[0].userId !== userId) {
      return { error: "Review not found or not authorized" };
    }

    await db
      .update(reviews)
      .set({
        rating,
        text: text || null,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId));

    revalidatePath("/music");
    if (review[0].albumId) {
      revalidatePath(`/album/${review[0].albumId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Update album review error:", error);
    return { error: "Failed to update review" };
  }
}

export async function deleteAlbumReviewAction(reviewId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;

  try {
    // Verify ownership
    const review = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (review.length === 0 || review[0].userId !== userId) {
      return { error: "Review not found or not authorized" };
    }

    const albumId = review[0].albumId;

    await db.delete(reviews).where(eq(reviews.id, reviewId));

    revalidatePath("/music");
    if (albumId) {
      revalidatePath(`/album/${albumId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Delete album review error:", error);
    return { error: "Failed to delete review" };
  }
}

