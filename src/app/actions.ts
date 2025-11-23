"use server";

import { searchBooks } from "@/lib/hardcover";
import { searchMoviesAndTv, searchMoviesOnly, searchTvSeries } from "@/lib/tmdb";
import { Book, Movie } from "@/types";

export async function searchBooksAction(query: string): Promise<Book[]> {
  if (!query.trim()) return [];
  return await searchBooks(query);
}

export async function searchMoviesAction(query: string): Promise<Movie[]> {
  if (!query.trim()) return [];
  return await searchMoviesOnly(query);
}

export async function searchSeriesAction(query: string): Promise<Movie[]> {
  if (!query.trim()) return [];
  return await searchTvSeries(query);
}

export async function searchMultiAction(query: string): Promise<Movie[]> {
  if (!query.trim()) return [];
  return await searchMoviesAndTv(query);
}
