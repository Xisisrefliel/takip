import { BooksHomePage } from "@/components/BooksHomePage";
import { books } from "@/data/books";

export default function BooksPage() {
  return <BooksHomePage books={books} />;
}
