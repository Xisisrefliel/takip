import { BooksHomePage } from "@/components/BooksHomePage";
import { searchBooks, getTrendingBooks } from "@/lib/hardcover";

export default async function BooksPage() {
  // Default search to populate the page initially
  let books = await getTrendingBooks();

  if (books.length === 0) {
    books = await searchBooks("fiction");
  }

  return <BooksHomePage books={books} />;
}
