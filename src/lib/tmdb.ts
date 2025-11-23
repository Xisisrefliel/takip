import { Movie } from "@/types";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL_ORIGINAL = "https://image.tmdb.org/t/p/original";
const TMDB_IMAGE_BASE_URL_W500 = "https://image.tmdb.org/t/p/w500";
const TMDB_IMAGE_BASE_URL_W1280 = "https://image.tmdb.org/t/p/w1280";

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
  21: "Family",
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
  10751: "Family",
};

interface TMDBGenre {
  id: number;
  name: string;
}

interface TMDBCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface TMDBCrew {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
}

interface TMDBCredits {
  cast: TMDBCast[];
  crew: TMDBCrew[];
}

interface TMDBImage {
  file_path: string;
  vote_average: number;
}

interface TMDBImages {
  backdrops: TMDBImage[];
}

interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  air_date: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  vote_average: number;
  runtime: number;
}

interface TMDBSeasonSummary {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
}

interface TMDBMovie {
  id: number;
  title?: string;
  name?: string; // For TV shows
  release_date?: string;
  first_air_date?: string; // For TV shows
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  vote_count: number;
  popularity?: number;
  genre_ids?: number[];
  genres?: TMDBGenre[];
  overview?: string;
  runtime?: number;
  episode_run_time?: number[];
  tagline?: string;
  status?: string;
  credits?: TMDBCredits;
  images?: TMDBImages;
  seasons?: TMDBSeasonSummary[];
  number_of_seasons?: number;
  number_of_episodes?: number;
}

interface TMDBResponse {
  results: TMDBMovie[];
}

const fetchTMDB = async (endpoint: string, params: Record<string, string> = {}) => {
  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY || "",
    language: "en-US",
    ...params,
  });
  const url = `${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    // If 404, just return null if possible, but throwing is okay for now
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch data from TMDB: ${res.statusText}`);
  }

  return res.json();
};

const mapTmdbToMovie = (item: TMDBMovie, mediaType: 'movie' | 'tv'): Movie => {
  const title = item.title || item.name || "Unknown Title";
  const date = item.release_date || item.first_air_date || "";
  const year = date ? new Date(date).getFullYear() : 0;

  // Handle genres from either genre_ids (list) or genres (detail)
  let genreList: string[] = [];
  if (item.genres) {
    genreList = item.genres.map((g) => g.name);
  } else if (item.genre_ids) {
    genreList = item.genre_ids.map((id) => GENRES[id]).filter(Boolean);
  }

  const runtime = item.runtime || (item.episode_run_time && item.episode_run_time[0]) || 0;

  // Map Cast
  const cast = item.credits?.cast?.slice(0, 10).map(c => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profilePath: c.profile_path ? `${TMDB_IMAGE_BASE_URL_W500}${c.profile_path}` : undefined
  })) || [];

  // Map Crew (Director/Creator usually)
  const crew = item.credits?.crew?.filter(c => c.job === 'Director' || c.job === 'Executive Producer').slice(0, 5).map(c => ({
    id: c.id,
    name: c.name,
    job: c.job,
    profilePath: c.profile_path ? `${TMDB_IMAGE_BASE_URL_W500}${c.profile_path}` : undefined
  })) || [];

  // Map Images
  const images = item.images?.backdrops?.slice(0, 10).map(img => `${TMDB_IMAGE_BASE_URL_W1280}${img.file_path}`) || [];

  // Get highest rated backdrop if available
  let backdropPath = item.backdrop_path;
  if (item.images?.backdrops && item.images.backdrops.length > 0) {
    const sortedBackdrops = [...item.images.backdrops].sort((a, b) => b.vote_average - a.vote_average);
    backdropPath = sortedBackdrops[0].file_path;
  }

  return {
    id: item.id.toString(),
    title,
    year,
    releaseDate: date,
    posterUrl: item.poster_path
      ? `${TMDB_IMAGE_BASE_URL_W500}${item.poster_path}`
      : "/placeholder.jpg",
    backdropUrl: backdropPath
      ? `${TMDB_IMAGE_BASE_URL_ORIGINAL}${backdropPath}`
      : undefined,
    rating: Number(item.vote_average.toFixed(1)),
    voteCount: item.vote_count,
    popularity: item.popularity,
    genre: genreList.slice(0, 3),
    overview: item.overview,
    runtime,
    tagline: item.tagline,
    status: item.status,
    mediaType,
    watched: false,
    liked: false,
    watchlist: false,
    cast,
    crew,
    images,
    numberOfSeasons: item.number_of_seasons,
    numberOfEpisodes: item.number_of_episodes
  };
};

export const getTrendingMovies = async (): Promise<Movie[]> => {
  try {
    const data = await fetchTMDB("/trending/movie/day");
    return (data?.results || []).map((item: TMDBMovie) => mapTmdbToMovie(item, 'movie'));
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return [];
  }
};

export const getPopularSeries = async (): Promise<Movie[]> => {
  try {
    const data = await fetchTMDB("/tv/popular");
    return (data?.results || []).map((item: TMDBMovie) => mapTmdbToMovie(item, 'tv'));
  } catch (error) {
    console.error("Error fetching popular series:", error);
    return [];
  }
};

export const getMovieById = async (id: string): Promise<Movie | null> => {
  try {
    const data = await fetchTMDB(`/movie/${id}`, { append_to_response: "credits,images" });
    if (!data) return null;
    return mapTmdbToMovie(data, 'movie');
  } catch (error) {
    console.error(`Error fetching movie ${id}:`, error);
    return null;
  }
};

export const getTvSeriesById = async (id: string): Promise<Movie | null> => {
  try {
    const data = await fetchTMDB(`/tv/${id}`, { append_to_response: "credits,images" });
    if (!data) return null;
    
    const movie = mapTmdbToMovie(data, 'tv');

    // Fetch episodes for each season
    if (data.seasons) {
        // Filter out Season 0 (Specials) if preferred, but keeping it is fine.
        // We will fetch up to 20 seasons to avoid throttling.
        const seasonsToFetch = data.seasons.slice(0, 20);
        
        const seasonsWithEpisodes = await Promise.all(
            seasonsToFetch.map(async (season: TMDBSeasonSummary) => {
                try {
                    const seasonDetail = await fetchTMDB(`/tv/${id}/season/${season.season_number}`);
                    return {
                        id: season.id,
                        name: season.name,
                        overview: season.overview,
                        posterPath: season.poster_path ? `${TMDB_IMAGE_BASE_URL_W500}${season.poster_path}` : undefined,
                        seasonNumber: season.season_number,
                        episodeCount: season.episode_count,
                        airDate: season.air_date,
                        episodes: seasonDetail?.episodes?.map((ep: TMDBEpisode) => ({
                            id: ep.id,
                            name: ep.name,
                            overview: ep.overview,
                            airDate: ep.air_date,
                            episodeNumber: ep.episode_number,
                            seasonNumber: ep.season_number,
                            stillPath: ep.still_path ? `${TMDB_IMAGE_BASE_URL_W500}${ep.still_path}` : undefined,
                            voteAverage: ep.vote_average,
                            runtime: ep.runtime
                        })) || []
                    };
                } catch (e) {
                    console.error(`Failed to fetch season ${season.season_number} for series ${id}`, e);
                     return {
                        id: season.id,
                        name: season.name,
                        overview: season.overview,
                        posterPath: season.poster_path ? `${TMDB_IMAGE_BASE_URL_W500}${season.poster_path}` : undefined,
                        seasonNumber: season.season_number,
                        episodeCount: season.episode_count,
                        airDate: season.air_date,
                        episodes: []
                    };
                }
            })
        );
        movie.seasons = seasonsWithEpisodes;
    }

    return movie;
  } catch (error) {
    console.error(`Error fetching TV series ${id}:`, error);
    return null;
  }
};

// Helper to fetch based on type
export const getMediaById = async (id: string, type: 'movie' | 'tv'): Promise<Movie | null> => {
  if (type === 'movie') {
    return getMovieById(id);
  } else {
    return getTvSeriesById(id);
  }
};

export const getWatchProviders = async (id: string, mediaType: 'movie' | 'tv') => {
  try {
    const data = await fetchTMDB(`/${mediaType}/${id}/watch/providers`);
    const results = data?.results;
    
    if (!results) return null;

    // Process to add full image paths
    const processed: Record<string, any> = {};
    Object.keys(results).forEach(region => {
      const data = results[region];
      processed[region] = {
        link: data.link,
        flatrate: data.flatrate?.map((p: any) => ({ ...p, logo_path: p.logo_path ? `${TMDB_IMAGE_BASE_URL_W500}${p.logo_path}` : null })),
        rent: data.rent?.map((p: any) => ({ ...p, logo_path: p.logo_path ? `${TMDB_IMAGE_BASE_URL_W500}${p.logo_path}` : null })),
        buy: data.buy?.map((p: any) => ({ ...p, logo_path: p.logo_path ? `${TMDB_IMAGE_BASE_URL_W500}${p.logo_path}` : null })),
      };
    });

    return processed;
  } catch (error) {
    console.error(`Error fetching watch providers for ${mediaType} ${id}:`, error);
    return null;
  }
};

export const getDirectorMovies = async (directorId: string): Promise<{ directorName: string; movies: Movie[] }> => {
  try {
    const [personData, creditsData] = await Promise.all([
      fetchTMDB(`/person/${directorId}`),
      fetchTMDB(`/person/${directorId}/movie_credits`)
    ]);

    if (!personData || !creditsData) {
      throw new Error("Failed to fetch director data");
    }

    const movies = (creditsData.crew || [])
      .filter((c: any) => c.job === 'Director')
      .map((item: any) => mapTmdbToMovie({ ...item, genre_ids: item.genre_ids || [] }, 'movie'))
      .sort((a: Movie, b: Movie) => (b.year || 0) - (a.year || 0));

    return {
      directorName: personData.name,
      movies
    };
  } catch (error) {
    console.error(`Error fetching director movies for ${directorId}:`, error);
    return { directorName: "", movies: [] };
  }
};
