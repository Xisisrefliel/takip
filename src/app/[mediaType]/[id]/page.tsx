import { getMediaById } from "@/lib/tmdb";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Play, Plus, Star, Info } from "lucide-react";
import { Metadata } from "next";
import { Carousel } from "@/components/Carousel";
import { LastVisitedUpdater } from "@/components/LastVisitedUpdater";
import { BackButton } from "@/components/BackButton";
import { SeasonList } from "@/components/SeasonList";
import { DetailPoster } from "@/components/DetailPoster";

interface PageProps {
  params: Promise<{
    mediaType: string;
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { mediaType, id } = await params;
  const movie = await getMediaById(id, mediaType as 'movie' | 'tv');

  if (!movie) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: `${movie.title} (${movie.year}) - Takip`,
    description: movie.overview || `Details about ${movie.title}`,
  };
}

export default async function MovieDetailPage({ params }: PageProps) {
  const { mediaType, id } = await params;

  if (mediaType !== 'movie' && mediaType !== 'tv') {
    notFound();
  }

  const movie = await getMediaById(id, mediaType as 'movie' | 'tv');

  if (!movie) {
    notFound();
  }

  const backdrop = movie.backdropUrl || movie.posterUrl;

  return (
    <main className="min-h-screen bg-background text-foreground relative pb-20">
      <LastVisitedUpdater 
        title={movie.title} 
        href={`/${mediaType}/${id}`} 
        mediaType={mediaType as 'movie' | 'tv'} 
      />
      {/* Back Button */}
      <BackButton />

      {/* Ambient Background - Fixed */}
      <div className="fixed inset-0 h-[70vh] w-full -z-10 overflow-hidden">
        <Image
          src={backdrop}
          alt=""
          fill
          priority
          className="object-cover opacity-40 blur-2xl scale-110"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-background/80 to-background" />
      </div>

      {/* Main Content Container */}
      <div className="container mx-auto px-6 pt-24 md:pt-32 pb-12">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
          {/* Poster Column */}
          <div className="w-full md:w-[300px] lg:w-[350px] shrink-0 group perspective-1000">
             <DetailPoster movie={movie} />
          </div>

          {/* Details Column */}
          <div className="flex-1 space-y-8 animate-slide-up">
            {/* Header Info */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {movie.status && (
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-foreground/80 text-xs font-medium uppercase tracking-wider">
                    {movie.status}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium uppercase tracking-wider">
                   {movie.mediaType === 'tv' ? 'TV Series' : 'Movie'}
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground text-base font-medium">
                 <span className="text-foreground">{movie.year}</span>
                 {movie.runtime ? (
                    <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                 ) : null}
                 <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={16} fill="currentColor" />
                    <span>{movie.rating}</span>
                 </div>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 pt-2">
                {movie.genre.map((g) => (
                  <span key={g} className="px-4 py-1.5 rounded-full bg-surface border border-border text-sm text-foreground/80">
                    {g}
                  </span>
                ))}
              </div>
            </div>

             {/* Tagline */}
             {movie.tagline && (
                <p className="text-xl text-muted-foreground font-light italic border-l-4 border-accent pl-4">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}

            {/* Overview */}
            <div className="space-y-3">
               <h3 className="text-lg font-semibold">Synopsis</h3>
               <p className="text-lg leading-relaxed text-foreground/90 max-w-3xl">
                 {movie.overview || "No overview available."}
               </p>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-wrap gap-4">
              <button className="h-14 px-8 rounded-full bg-foreground text-background font-bold flex items-center gap-2 hover:opacity-90 transition-all transform hover:scale-105 shadow-lg shadow-foreground/10">
                <Play size={20} fill="currentColor" />
                <span>Play Now</span>
              </button>
              <button className="h-14 px-8 rounded-full bg-surface border border-border text-foreground font-semibold flex items-center gap-2 hover:bg-surface-hover transition-all">
                <Plus size={20} />
                <span>Watchlist</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seasons Section for TV Series */}
      {mediaType === 'tv' && movie.seasons && movie.seasons.length > 0 && (
        <div className="container mx-auto px-6 pt-12">
            <SeasonList seasons={movie.seasons} />
        </div>
      )}

      {/* Cast & Crew Section */}
      {movie.cast && movie.cast.length > 0 && (
        <div className="container mx-auto px-6">
           <Carousel title="Cast & Crew">
              {movie.cast.map((person) => (
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

      {/* Images Section with blurred background */}
      {movie.images && movie.images.length > 0 && (
        <section className="relative py-20 overflow-hidden">
           {/* Subtle blurred background for this section */}
           <div className="absolute inset-0 -z-10">
              <Image
                src={movie.images[0]}
                alt=""
                fill
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
                 {movie.images.slice(0, 6).map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                       <Image
                         src={img}
                         alt={`Scene ${idx + 1}`}
                         fill
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
