import { getDirectorMovies, getTrendingDirectors } from "@/lib/tmdb";
import { BackButton } from "@/components/BackButton";
import { DirectorMovies } from "@/components/DirectorMovies";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { enrichMoviesWithUserStatus } from "@/app/actions";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateStaticParams() {
  const directors = await getTrendingDirectors();
  return directors.map((director) => ({
    id: String(director.id),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { directorName } = await getDirectorMovies(id);
  
  if (!directorName) {
    return {
      title: "Director Not Found - Takip"
    };
  }

  return {
    title: `Movies by ${directorName} - Takip`,
    description: `Explore movies directed by ${directorName}`
  };
}

export default async function DirectorPage({ params }: PageProps) {
  const { id } = await params;
  const { directorName, movies } = await getDirectorMovies(id);

  if (!directorName) {
    notFound();
  }

  // Enrich movies with user status from database
  const enrichedMovies = await enrichMoviesWithUserStatus(movies);

  return (
    <main className="min-h-screen bg-background text-foreground relative pb-20">
      <BackButton />
      
      <div className="container mx-auto px-6 pt-24 md:pt-32">
        <DirectorMovies movies={enrichedMovies} directorName={directorName} />
      </div>
    </main>
  );
}

