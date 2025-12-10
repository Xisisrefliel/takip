import { getActorMovies } from "@/lib/tmdb";
import { BackButton } from "@/components/BackButton";
import { ActorMovies } from "@/components/ActorMovies";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { enrichMoviesWithUserStatus } from "@/app/actions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { actorName } = await getActorMovies(id);
  
  if (!actorName) {
    return {
      title: "Actor Not Found - Takip"
    };
  }

  return {
    title: `Movies starring ${actorName} - Takip`,
    description: `Explore movies starring ${actorName}`
  };
}

export default async function ActorPage({ params }: PageProps) {
  const { id } = await params;
  const { actorName, actorDetails, movies } = await getActorMovies(id);

  if (!actorName) {
    notFound();
  }

  // Enrich movies with user status from database
  const enrichedMovies = await enrichMoviesWithUserStatus(movies);

  return (
    <main className="min-h-screen bg-background text-foreground relative pb-20">
      <BackButton />
      
      <div className="container mx-auto px-6 pt-24 md:pt-32">
        <ActorMovies movies={enrichedMovies} actorName={actorName} actorDetails={actorDetails} />
      </div>
    </main>
  );
}

