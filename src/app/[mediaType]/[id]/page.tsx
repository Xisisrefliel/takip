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

// Revalidate media details every 24 hours (static content rarely changes)
export const revalidate = 86400;

interface PageProps {
  params: Promise<{
    mediaType: string;
    id: string;
  }>;
}

const isBook = (item: Movie | Book): item is Book => "author" in item;

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

  let session;
  try {
    session = await auth();
  } catch (e) {
    console.error("Auth error:", e);
    session = null;
  }

  // Fetch user's media tracking data from database if authenticated
  if (session?.user?.id) {
    try {
      if (mediaType === "book") {
        const userBook = await db
          .select()
          .from(userBooks)
          .where(
            and(
              eq(userBooks.userId, session.user.id),
              eq(userBooks.bookId, id)
            )
          )
          .limit(1);

        if (userBook.length > 0) {
          item.watched = userBook[0].watched || false;
          item.watchlist = userBook[0].watchlist || false;
          item.liked = userBook[0].liked || false;
        }
      } else {
        const userMovie = await db
          .select()
          .from(userMovies)
          .where(
            and(
              eq(userMovies.userId, session.user.id),
              eq(userMovies.movieId, id),
              eq(userMovies.mediaType, mediaType as "movie" | "tv")
            )
          )
          .limit(1);

        if (userMovie.length > 0) {
          item.watched = userMovie[0].watched || false;
          item.watchlist = userMovie[0].watchlist || false;
          item.liked = userMovie[0].liked || false;
        }
      }
    } catch (e) {
      console.error("Error fetching user media data:", e);
    }
  }

  let initialReviews: Review[] = [];
  let initialUserReview: Review | null = null;

  if (mediaType !== "book") {
    try {
      const [reviewsResult, userReviewResult] = await Promise.all([
        getReviewsAction(id, mediaType as "movie" | "tv"),
        getUserReviewAction(id, mediaType as "movie" | "tv"),
      ]);
      initialReviews = reviewsResult.reviews;
      initialUserReview = userReviewResult.review;
    } catch (e) {
      console.error("Error fetching reviews:", e);
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
