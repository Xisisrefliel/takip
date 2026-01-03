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
} from "@/app/actions";
import { auth } from "@/auth";
import { MediaDetailClient } from "@/components/MediaDetailClient";

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

  if (!item) {
    notFound();
  }

  const session = await auth();

  const [{ reviews: initialReviews }, { review: initialUserReview }] =
    mediaType === "book"
      ? [{ reviews: [] }, { review: null }]
      : await Promise.all([
          getReviewsAction(id, mediaType as "movie" | "tv"),
          getUserReviewAction(id, mediaType as "movie" | "tv"),
        ]);

  return (
    <MediaDetailClient
      item={item}
      mediaType={mediaType}
      id={id}
      providers={providers}
      initialReviews={initialReviews}
      initialUserReview={initialUserReview}
      sessionUserId={session?.user?.id ?? null}
      user={session?.user}
    />
  );
}
