import {
  getMediaById,
  getWatchProviders,
  type WatchProvidersByRegion,
} from "@/lib/tmdb";
import { getBookById } from "@/lib/hardcover";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Movie, Book } from "@/types";
import {
  getReviewsAction,
  getUserReviewAction,
  type Review,
} from "@/app/actions";
import { auth } from "@/auth";
import { MediaDetailClient } from "@/components/MediaDetailClient";
import { db } from "@/db";
import { userMovies, userBooks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getUserLikedGenres,
  getUserWatchedIds,
  personalizeRecommendations,
} from "@/lib/recommendations";

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ mediaType: string; id: string }>;
}

function isBook(item: Movie | Book): item is Book {
  return "author" in item;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { mediaType, id } = await params;
  let item: Movie | Book | null = null;

  if (mediaType === "book") {
    item = await getBookById(id);
  } else {
    item = await getMediaById(id, mediaType as "movie" | "tv");
  }

  if (!item) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: `${item.title} (${item.year}) - Takip`,
    description: isBook(item)
      ? item.description
      : item.overview || `Details about ${item.title}`,
  };
}

export default async function MediaDetailPage({ params }: PageProps) {
  const { mediaType, id } = await params;

  if (mediaType !== "movie" && mediaType !== "tv" && mediaType !== "book") {
    notFound();
  }

  let item: Movie | Book | null = null;
  let providers: WatchProvidersByRegion | null = null;

  try {
    if (mediaType === "book") {
      item = await getBookById(id);
    } else {
      const [fetchedItem, fetchedProviders] = await Promise.all([
        getMediaById(id, mediaType as "movie" | "tv"),
        getWatchProviders(id, mediaType as "movie" | "tv"),
      ]);
      item = fetchedItem;
      providers = fetchedProviders;
    }
  } catch (e) {
    console.error("Error fetching media:", e);
    notFound();
  }

  if (!item) {
    notFound();
  }

  const session = await auth().catch(() => null);

  if (session?.user?.id) {
    const userId = session.user.id;

    if (mediaType === "book") {
      const [userBook] = await db
        .select()
        .from(userBooks)
        .where(and(eq(userBooks.userId, userId), eq(userBooks.bookId, id)))
        .limit(1)
        .catch(() => []);

      if (userBook) {
        item.watched = userBook.watched ?? false;
        item.watchlist = userBook.watchlist ?? false;
        item.liked = userBook.liked ?? false;
      }
    } else {
      const [userMovie] = await db
        .select()
        .from(userMovies)
        .where(
          and(
            eq(userMovies.userId, userId),
            eq(userMovies.movieId, id),
            eq(userMovies.mediaType, mediaType as "movie" | "tv")
          )
        )
        .limit(1)
        .catch(() => []);

      if (userMovie) {
        item.watched = userMovie.watched ?? false;
        item.watchlist = userMovie.watchlist ?? false;
        item.liked = userMovie.liked ?? false;
      }
    }
  }

  let initialReviews: Review[] = [];
  let initialUserReview: Review | null = null;

  if (mediaType !== "book") {
    const [reviewsResult, userReviewResult] = await Promise.all([
      getReviewsAction(id, mediaType as "movie" | "tv"),
      getUserReviewAction(id, mediaType as "movie" | "tv"),
    ]).catch(() => [{ reviews: [] }, { review: null }]);

    initialReviews = reviewsResult.reviews;
    initialUserReview = userReviewResult.review;
  }

  if (session?.user?.id && mediaType !== "book") {
    const movieItem = item as Movie;
    const userId = session.user.id;

    const [userPrefs, watchedIds] = await Promise.all([
      getUserLikedGenres(userId),
      getUserWatchedIds(userId),
    ]).catch(() => [[], new Set<string>()]);

    if (movieItem.recommendations) {
      movieItem.recommendations = personalizeRecommendations(
        movieItem.recommendations,
        watchedIds,
        userPrefs
      );
    }

    if (movieItem.similar) {
      movieItem.similar = movieItem.similar.filter(m => !watchedIds.has(m.id));
    }
  }

  return (
    <MediaDetailClient
      item={item}
      mediaType={mediaType}
      id={id}
      providers={providers}
      initialReviews={initialReviews}
      initialUserReview={initialUserReview}
      sessionUserId={session?.user?.id ?? null}
      user={session?.user ?? null}
    />
  );
}
