import { Movie } from "@/types";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

if (!TMDB_API_KEY) {
  console.warn("TMDB_API_KEY is not defined in environment variables.");
}

const GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

interface TMDBMovie {
  id: number;
  title?: string;
  name?: string; // For TV shows
  release_date?: string;
  first_air_date?: string; // For TV shows
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  genre_ids: number[];
}

interface TMDBResponse {
  results: TMDBMovie[];
}

const fetchTMDB = async (endpoint: string): Promise<TMDBResponse> => {
  const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&language=en-US`;
  const res = await fetch(url, { next: { revalidate: 3600 } }); // Revalidate every hour

  if (!res.ok) {
    throw new Error(`Failed to fetch data from TMDB: ${res.statusText}`);
  }

  return res.json();
};

const mapTmdbToMovie = (item: TMDBMovie): Movie => {
  const title = item.title || item.name || "Unknown Title";
  const date = item.release_date || item.first_air_date || "";
  const year = date ? new Date(date).getFullYear() : 0;

  return {
    id: item.id.toString(),
    title,
    year,
    posterUrl: item.poster_path
      ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}`
      : "/placeholder.jpg", // You might want a local placeholder
    backdropUrl: item.backdrop_path
      ? `${TMDB_IMAGE_BASE_URL}${item.backdrop_path}`
      : undefined,
    rating: Number(item.vote_average.toFixed(1)),
    genre: item.genre_ids.map((id) => GENRES[id]).filter(Boolean).slice(0, 3), // Limit to 3 genres
    watched: false, // Default
    liked: false, // Default
    watchlist: false, // Default
  };
};

export const getTrendingMovies = async (): Promise<Movie[]> => {
  try {
    const data = await fetchTMDB("/trending/movie/day");
    return data.results.map(mapTmdbToMovie);
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return [];
  }
};

export const getPopularSeries = async (): Promise<Movie[]> => {
  try {
    const data = await fetchTMDB("/tv/popular");
    return data.results.map(mapTmdbToMovie);
  } catch (error) {
    console.error("Error fetching popular series:", error);
    return [];
  }
};

