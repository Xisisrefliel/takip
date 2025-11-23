import { getMediaById, getWatchProviders } from "@/lib/tmdb";
import { getBookById } from "@/lib/hardcover";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Play, Plus, Star, Info, BookOpen } from "lucide-react";
import { Metadata } from "next";
import { Carousel } from "@/components/Carousel";
import { LastVisitedUpdater } from "@/components/LastVisitedUpdater";
import { BackButton } from "@/components/BackButton";
import { SeasonList } from "@/components/SeasonList";
import { DetailPoster } from "@/components/DetailPoster";
import { WatchProviders } from "@/components/WatchProviders";
import { Movie, Book } from "@/types";

interface PageProps {
  params: Promise<{
    mediaType: string;
    id: string;
  }>;
}

const isBook = (item: Movie | Book): item is Book => 'author' in item;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { mediaType, id } = await params;
  let item: Movie | Book | null = null;

  if (mediaType === 'book') {
    item = await getBookById(id);
  } else {
    item = await getMediaById(id, mediaType as 'movie' | 'tv');
  }

  if (!item) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: `${item.title} (${item.year}) - Takip`,
    description: isBook(item) ? item.description : item.overview || `Details about ${item.title}`,
  };
}

export default async function MediaDetailPage({ params }: PageProps) {
  const { mediaType, id } = await params;

  if (mediaType !== 'movie' && mediaType !== 'tv' && mediaType !== 'book') {
    notFound();
  }

  let item: Movie | Book | null = null;
  let providers: any = null;

  if (mediaType === 'book') {
    item = await getBookById(id);
  } else {
    const [fetchedItem, fetchedProviders] = await Promise.all([
      getMediaById(id, mediaType as 'movie' | 'tv'),
      getWatchProviders(id, mediaType as 'movie' | 'tv')
    ]);
    item = fetchedItem;
    providers = fetchedProviders;
  }

  if (!item) {
    notFound();
  }

  // Normalize fields for display
  const backdrop = isBook(item) ? item.coverImage : (item.backdropUrl || item.posterUrl);
  const poster = isBook(item) ? item.coverImage : item.posterUrl;
  const overview = isBook(item) ? item.description : item.overview;
  const runtime = !isBook(item) ? item.runtime : null;
  const cast = !isBook(item) ? item.cast : null;
  const images = 'images' in item ? item.images : null;
  const seasons = (!isBook(item) && item.mediaType === 'tv') ? item.seasons : null;

  return (
    <main className="min-h-screen bg-background text-foreground relative pb-20">
      <LastVisitedUpdater 
        title={item.title} 
        href={`/${mediaType}/${id}`} 
        mediaType={mediaType as 'movie' | 'tv'} 
      />
      {/* Back Button */}
      <BackButton />

      {/* Ambient Background - Fixed */}
      <div className="fixed inset-0 h-[70vh] w-full -z-10 overflow-hidden">
        <Image
          src={backdrop || "/placeholder.jpg"}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40 blur-2xl scale-110"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-background/80 to-background" />
      </div>

      {/* Main Content Container */}
      <div className="container mx-auto px-6 pt-24 md:pt-32 pb-12">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
          {/* Poster Column */}
          <div className="w-full md:w-[300px] lg:w-[350px] shrink-0 group perspective-1000">
             <DetailPoster item={item} />
          </div>

          {/* Details Column */}
          <div className="flex-1 space-y-8 animate-slide-up">
            {/* Header Info */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {'status' in item && item.status && (
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-foreground/80 text-xs font-medium uppercase tracking-wider">
                    {item.status}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium uppercase tracking-wider">
                   {mediaType === 'tv' ? 'TV Series' : mediaType === 'book' ? 'Book' : 'Movie'}
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                {item.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground text-base font-medium">
                 <span className="text-foreground">{item.year}</span>
                 {runtime ? (
                    <span>{Math.floor(runtime / 60)}h {runtime % 60}m</span>
                 ) : null}
                 {isBook(item) && item.pages && (
                    <span>{item.pages} pages</span>
                 )}
                 <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={16} fill="currentColor" />
                    <span>{Number(item.rating).toFixed(1)}</span>
                 </div>
                 {isBook(item) && item.author && (
                    <span className="text-foreground/80">by {item.author}</span>
                 )}
              </div>

              {/* Director */}
              {!isBook(item) && item.crew && item.crew.some(c => c.job === 'Director') && (
                <div className="flex flex-wrap gap-2 items-center text-base font-medium">
                  <span className="text-muted-foreground">Directed by</span>
                  {item.crew.filter(c => c.job === 'Director').map((d, i, arr) => (
                    <span key={d.id}>
                      <Link href={`/director/${d.id}`} className="text-foreground hover:text-accent transition-colors">
                        {d.name}
                      </Link>
                      {i < arr.length - 1 && <span className="text-muted-foreground">, </span>}
                    </span>
                  ))}
                </div>
              )}

              {/* Genres */}
              <div className="flex flex-wrap gap-2 pt-2">
                {item.genre.map((g) => (
                  <span key={g} className="px-4 py-1.5 rounded-full bg-surface border border-border text-sm text-foreground/80">
                    {g}
                  </span>
                ))}
              </div>
            </div>

             {/* Tagline */}
             {!isBook(item) && item.tagline && (
                <p className="text-xl text-muted-foreground font-light italic border-l-4 border-accent pl-4">
                  &ldquo;{item.tagline}&rdquo;
                </p>
              )}

            {/* Overview */}
            <div className="space-y-3">
               <h3 className="text-lg font-semibold">Synopsis</h3>
               <div 
                 className="text-lg leading-relaxed text-foreground/90 max-w-3xl"
                 dangerouslySetInnerHTML={isBook(item) ? { __html: overview || "No overview available." } : undefined}
               >
                 {!isBook(item) ? (overview || "No overview available.") : undefined}
               </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-wrap gap-4">
              <button className="h-14 px-8 rounded-full bg-foreground text-background font-bold flex items-center gap-2 hover:opacity-90 transition-all transform hover:scale-105 shadow-lg shadow-foreground/10">
                {isBook(item) ? <BookOpen size={20} /> : <Play size={20} fill="currentColor" />}
                <span>{isBook(item) ? "Preview" : "Play Now"}</span>
              </button>
              <button className="h-14 px-8 rounded-full bg-surface border border-border text-foreground font-semibold flex items-center gap-2 hover:bg-surface-hover transition-all">
                <Plus size={20} />
                <span>{isBook(item) ? "Read Later" : "Watchlist"}</span>
              </button>
            </div>

            {/* Watch Providers (Movies/TV only) */}
            {!isBook(item) && (
              <div className="pt-8 border-t border-border">
                <WatchProviders providers={providers} />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Seasons Section for TV Series */}
      {seasons && seasons.length > 0 && (
        <div className="container mx-auto px-6 pt-12">
            <SeasonList seasons={seasons} />
        </div>
      )}

      {/* Cast & Crew Section (Movies/TV) */}
      {cast && cast.length > 0 && (
        <div className="container mx-auto px-6">
           <Carousel title="Cast & Crew">
              {cast.map((person) => (
                 <div key={person.id} className="shrink-0 w-32 md:w-40 space-y-3 snap-start">
                    <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-surface border border-white/5 shadow-sm">
                       {person.profilePath ? (
                          <Image 
                            src={person.profilePath} 
                            alt={person.name} 
                            fill 
                            className="object-cover"
                          />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/5 text-muted-foreground">
                            <Info size={24} />
                          </div>
                       )}
                    </div>
                    <div className="space-y-1 px-1">
                       <p className="text-sm font-medium leading-tight truncate">{person.name}</p>
                       <p className="text-xs text-muted-foreground truncate">{person.character}</p>
                    </div>
                 </div>
              ))}
           </Carousel>
        </div>
      )}

      {/* Images Section with blurred background (Movies/TV) */}
      {images && images.length > 0 && (
        <section className="relative py-20 overflow-hidden">
           {/* Subtle blurred background for this section */}
           <div className="absolute inset-0 -z-10">
              <Image
                src={images[0]}
                alt=""
                fill
                sizes="100vw"
                className="object-cover blur-3xl opacity-10 scale-110"
              />
              <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-background" />
           </div>

           <div className="container mx-auto px-6">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <span className="w-1 h-8 bg-accent rounded-full"></span>
                Visuals
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {images.slice(0, 6).map((img, idx) => (
                    <div key={idx} className={`relative ${mediaType === 'book' ? 'aspect-3/4' : 'aspect-video'} rounded-2xl overflow-hidden shadow-2xl border border-white/10 group`}>
                       <Image
                         src={img}
                         alt={`Scene ${idx + 1}`}
                         fill
                         sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                         className="object-cover transition-transform duration-700 group-hover:scale-105"
                       />
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                 ))}
              </div>
           </div>
        </section>
      )}
    </main>
  );
}
