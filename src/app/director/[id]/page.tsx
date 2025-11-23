import { getDirectorMovies } from "@/lib/tmdb";
import { BackButton } from "@/components/BackButton";
import { DirectorMovies } from "@/components/DirectorMovies";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
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

  return (
    <main className="min-h-screen bg-background text-foreground relative pb-20">
      <BackButton />
      
      <div className="container mx-auto px-6 pt-24 md:pt-32">
        <DirectorMovies movies={movies} directorName={directorName} />
      </div>
    </main>
  );
}

