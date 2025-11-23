"use server";

import { searchBooks } from "@/lib/hardcover";
import { Book } from "@/types";

export async function searchBooksAction(query: string): Promise<Book[]> {
  if (!query.trim()) return [];
  return await searchBooks(query);
}

