import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMovieById, getTvSeriesById } from "@/lib/tmdb";

interface WatchPageProps {
  params: Promise<{ slug: string[] }>;
}

function getVidkingUrl(type: string, id: string, season?: string, episode?: string) {
  if (type === "movie") {
    return `https://www.vidking.net/embed/movie/${id}`;
  }
  if (type === "tv" && season && episode) {
    return `https://www.vidking.net/embed/tv/${id}/${season}/${episode}`;
  }
  return null;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug } = await params;

  if (!slug || slug.length < 2) {
    notFound();
  }

  const [type, id, season, episode] = slug;

  if (type !== "movie" && type !== "tv") {
    notFound();
  }

  if (type === "tv" && (!season || !episode)) {
    notFound();
  }

  const embedUrl = getVidkingUrl(type, id, season, episode);

  if (!embedUrl) {
    notFound();
  }

  let title = "";
  const backUrl = `/${type}/${id}`;

  if (type === "movie") {
    const movie = await getMovieById(id);
    title = movie?.title || "Movie";
  } else {
    const series = await getTvSeriesById(id, false);
    if (series) {
      title = `${series.title} - S${season}E${episode}`;
    } else {
      title = `S${season}E${episode}`;
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={backUrl}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
      </div>

      <div className="w-full h-screen flex items-center justify-center pt-16">
        <div className="w-full h-full max-w-[1920px] max-h-[1080px] aspect-video">
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    </main>
  );
}
