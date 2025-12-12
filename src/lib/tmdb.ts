import { Movie, WatchProvider, WatchProvidersData } from "@/types";

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
  22: "Fantasy",
  36: "History",
  24: "Horror",
  25: "Music",
  26: "Mystery",
  27: "Romance",
  878: "Science Fiction",
  29: "TV Movie",
  53: "Thriller",
  31: "War",
  32: "Western",
  33: "Action & Adventure",
  34: "Kids",
  37: "Sci-Fi & Fantasy",
  38: "Soap",
  39: "Talk",
  40: "War & Politics",
  41: "Family",
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

interface TMDBVideo {
  key: string;
  site: string;
  type: string;
  official?: boolean;
  name?: string;
}

interface TMDBVideos {
  results: TMDBVideo[];
}

interface TMDBCrewCredit extends TMDBMovie {
  job?: string;
}

interface TMDBCastCredit extends TMDBMovie {
  character?: string;
}

type TMDBSearchResult = TMDBMovie & { media_type?: "movie" | "tv" };

export type WatchProvidersByRegion = Record<string, WatchProvidersData>;

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
  videos?: TMDBVideos;
  seasons?: TMDBSeasonSummary[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  media_type?: string;
}

export interface ActorDetails {
  id: number;
  name: string;
  profileUrl?: string;
  biography?: string;
  birthday?: string;
  deathday?: string | null;
  placeOfBirth?: string;
  knownForDepartment?: string;
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

const pickTrailer = (videos?: TMDBVideo[]) => {
  if (!videos || videos.length === 0) return { trailerKey: undefined, trailerUrl: undefined };

  const byPriority = videos.find(
    (video) => video.site === "YouTube" && video.type === "Trailer" && video.official
  ) || videos.find(
    (video) => video.site === "YouTube" && video.type === "Trailer"
  ) || videos.find((video) => video.site === "YouTube");

  if (!byPriority) return { trailerKey: undefined, trailerUrl: undefined };

  const trailerUrl = `https://www.youtube.com/watch?v=${byPriority.key}`;
  return { trailerKey: byPriority.key, trailerUrl };
};

const fetchTrailerForMedia = async (id: string, mediaType: 'movie' | 'tv') => {
  try {
    const data = await fetchTMDB(`/${mediaType}/${id}/videos`);
    return pickTrailer(data?.results);
  } catch (error) {
    console.error(`Error fetching trailer for ${mediaType} ${id}:`, error);
    return { trailerKey: undefined, trailerUrl: undefined };
  }
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

  const { trailerKey, trailerUrl } = pickTrailer(item.videos?.results);

  const safeVoteAverage =
    typeof item.vote_average === "number" && Number.isFinite(item.vote_average)
      ? Number(item.vote_average.toFixed(1))
      : null;

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
    rating: safeVoteAverage,
    voteCount: item.vote_count,
    popularity: item.popularity,
    genre: genreList.slice(0, 3),
    overview: item.overview,
    trailerKey,
    trailerUrl,
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
    const movies = (data?.results || []).map((item: TMDBMovie) => mapTmdbToMovie(item, 'movie'));

    if (movies[0]) {
      const trailer = await fetchTrailerForMedia(movies[0].id, 'movie');
      movies[0] = { ...movies[0], ...trailer };
    }

    return movies;
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
    const data = await fetchTMDB(`/movie/${id}`, {
      append_to_response: "credits,images,recommendations,videos",
      include_image_language: "en,null",
    });
    if (!data) return null;
    const movie = mapTmdbToMovie(data, 'movie');
    const { trailerKey, trailerUrl } = pickTrailer(data.videos?.results);
    movie.trailerKey = trailerKey;
    movie.trailerUrl = trailerUrl;
    movie.recommendations = (data.recommendations?.results || [])
      .filter((rec: TMDBMovie) => rec.id !== data.id)
      .map((item: TMDBMovie) => mapTmdbToMovie(item, 'movie'))
      .slice(0, 16);
    return movie;
  } catch (error) {
    console.error(`Error fetching movie ${id}:`, error);
    return null;
  }
};

export const getTvSeriesById = async (id: string): Promise<Movie | null> => {
  try {
    const data = await fetchTMDB(`/tv/${id}`, {
      append_to_response: "credits,images,recommendations,videos",
      include_image_language: "en,null",
    });
    if (!data) return null;
    
    const movie = mapTmdbToMovie(data, 'tv');
    const { trailerKey, trailerUrl } = pickTrailer(data.videos?.results);
    movie.trailerKey = trailerKey;
    movie.trailerUrl = trailerUrl;
    movie.recommendations = (data.recommendations?.results || [])
      .filter((rec: TMDBMovie) => rec.id !== data.id)
      .map((item: TMDBMovie) => mapTmdbToMovie(item, 'tv'))
      .slice(0, 16);

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

export const getWatchProviders = async (
  id: string,
  mediaType: "movie" | "tv"
): Promise<WatchProvidersByRegion | null> => {
  try {
    const data = await fetchTMDB(`/${mediaType}/${id}/watch/providers`);
    const results = data?.results as
      | Record<
          string,
          {
            link?: string;
            flatrate?: WatchProvider[];
            rent?: WatchProvider[];
            buy?: WatchProvider[];
          }
        >
      | undefined;

    if (!results) return null;

    const processed: WatchProvidersByRegion = {};
    Object.entries(results).forEach(([region, providerData]) => {
      processed[region] = {
        link: providerData.link,
        flatrate: providerData.flatrate?.map((provider) => ({
          ...provider,
          logo_path: provider.logo_path
            ? `${TMDB_IMAGE_BASE_URL_W500}${provider.logo_path}`
            : provider.logo_path,
        })),
        rent: providerData.rent?.map((provider) => ({
          ...provider,
          logo_path: provider.logo_path
            ? `${TMDB_IMAGE_BASE_URL_W500}${provider.logo_path}`
            : provider.logo_path,
        })),
        buy: providerData.buy?.map((provider) => ({
          ...provider,
          logo_path: provider.logo_path
            ? `${TMDB_IMAGE_BASE_URL_W500}${provider.logo_path}`
            : provider.logo_path,
        })),
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

    const crewCredits = Array.isArray(creditsData.crew)
      ? (creditsData.crew as TMDBCrewCredit[])
      : [];

    const movies = crewCredits
      .filter((credit) => credit.job === "Director")
      .map((item) => mapTmdbToMovie({ ...item, genre_ids: item.genre_ids || [] }, "movie"))
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

export const getActorMovies = async (
  actorId: string
): Promise<{ actorName: string; actorDetails?: ActorDetails; movies: Movie[] }> => {
  try {
    const [personData, creditsData] = await Promise.all([
      fetchTMDB(`/person/${actorId}`),
      fetchTMDB(`/person/${actorId}/movie_credits`)
    ]);

    if (!personData || !creditsData) {
      throw new Error("Failed to fetch actor data");
    }

    const actorDetails: ActorDetails = {
      id: personData.id,
      name: personData.name,
      profileUrl: personData.profile_path
        ? `${TMDB_IMAGE_BASE_URL_W500}${personData.profile_path}`
        : undefined,
      biography: personData.biography,
      birthday: personData.birthday,
      deathday: personData.deathday,
      placeOfBirth: personData.place_of_birth,
      knownForDepartment: personData.known_for_department
    };

    const castCredits = Array.isArray(creditsData.cast)
      ? (creditsData.cast as TMDBCastCredit[])
      : [];

    const movies = castCredits
      .map((item) => mapTmdbToMovie({ ...item, genre_ids: item.genre_ids || [] }, "movie"))
      .sort((a: Movie, b: Movie) => (b.popularity || 0) - (a.popularity || 0));

    return {
      actorName: personData.name,
      actorDetails,
      movies
    };
  } catch (error) {
    console.error(`Error fetching actor movies for ${actorId}:`, error);
    return { actorName: "", movies: [] };
  }
};

export const searchMoviesAndTv = async (query: string): Promise<Movie[]> => {
  try {
    const data = await fetchTMDB("/search/multi", { query });
    const results = Array.isArray(data?.results)
      ? (data.results as TMDBSearchResult[])
      : [];
    return results
      .filter(
        (item): item is TMDBSearchResult &
          Required<Pick<TMDBSearchResult, "media_type">> =>
          item.media_type === "movie" || item.media_type === "tv"
      )
      .map((item) => mapTmdbToMovie(item, item.media_type))
      .sort((a: Movie, b: Movie) => (b.popularity || 0) - (a.popularity || 0));
  } catch (error) {
    console.error("Error searching movies and tv:", error);
    return [];
  }
};

export const searchMoviesOnly = async (query: string): Promise<Movie[]> => {
  try {
    const data = await fetchTMDB("/search/movie", { query });
    const results = Array.isArray(data?.results)
      ? (data.results as TMDBMovie[])
      : [];
    return results
      .map((item) => mapTmdbToMovie(item, "movie"))
      .sort((a: Movie, b: Movie) => (b.popularity || 0) - (a.popularity || 0));
  } catch (error) {
    console.error("Error searching movies:", error);
    return [];
  }
};

export const searchMoviesWithYear = async (query: string, year?: number): Promise<Movie[]> => {
  try {
    if (!query.trim()) return [];

    const params: Record<string, string> = { query };
    if (typeof year === "number" && Number.isFinite(year)) {
      const yearStr = String(year);
      params.year = yearStr;
      params.primary_release_year = yearStr;
    }

    const data = await fetchTMDB("/search/movie", params);
    const results = Array.isArray(data?.results)
      ? (data.results as TMDBMovie[])
      : [];
    return results
      .map((item) => mapTmdbToMovie(item, "movie"))
      .sort((a: Movie, b: Movie) => (b.popularity || 0) - (a.popularity || 0));
  } catch (error) {
    console.error("Error searching movies with year:", error);
    return [];
  }
};

export const searchTvSeries = async (query: string): Promise<Movie[]> => {
  try {
    const data = await fetchTMDB("/search/tv", { query });
    const results = Array.isArray(data?.results)
      ? (data.results as TMDBMovie[])
      : [];
    return results
      .map((item) => mapTmdbToMovie(item, "tv"))
      .sort((a: Movie, b: Movie) => (b.popularity || 0) - (a.popularity || 0));
  } catch (error) {
    console.error("Error searching tv series:", error);
    return [];
  }
};
