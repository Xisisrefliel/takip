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
  posterUrl: string;
  backdropUrl?: string;
  rating?: number;
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
