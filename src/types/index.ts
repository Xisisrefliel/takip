export interface Movie {
  id: string;
  title: string;
  year: number;
  posterUrl: string;
  backdropUrl?: string; // For hero section maybe
  rating?: number;
  genre: string[];
  watched?: boolean;
  liked?: boolean;
  watchlist?: boolean;
  watchedDate?: string; // ISO date
}

