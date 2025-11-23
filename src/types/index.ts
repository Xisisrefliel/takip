export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath?: string;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  profilePath?: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  airDate: string;
  episodeNumber: number;
  seasonNumber: number;
  stillPath?: string;
  voteAverage: number;
  runtime?: number;
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  posterPath?: string;
  seasonNumber: number;
  episodeCount: number;
  airDate?: string;
  episodes?: Episode[];
}

export interface Movie {
  id: string;
  title: string;
  year: number;
  releaseDate?: string;
  posterUrl: string;
  backdropUrl?: string;
  rating?: number;
  voteCount?: number;
  popularity?: number;
  genre: string[];
  overview?: string;
  runtime?: number; // minutes
  tagline?: string;
  status?: string;
  mediaType: 'movie' | 'tv';
  watched?: boolean;
  liked?: boolean;
  watchlist?: boolean;
  watchedDate?: string;
  cast?: CastMember[];
  crew?: CrewMember[];
  images?: string[];
  seasons?: Season[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface WatchProvidersData {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  coverImage: string;
  spineColor?: string;
  spineTextColor?: string;
  description: string;
  rating: number;
  genre: string[];
  pages?: number;
  mediaType?: 'book';
  publisher?: string;
  isbn?: string;
  images?: string[];
  // User interaction fields
  watched?: boolean; // technically "read"
  liked?: boolean;
  watchlist?: boolean;
  readDate?: string;
}
