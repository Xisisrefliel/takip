import { cache } from "react";
import { Book } from "@/types";

const HARDCOVER_API_URL = "https://api.hardcover.app/v1/graphql";
const API_KEY = process.env.HARDCOVER_API_KEY;

interface HardcoverImage {
  url: string;
}

interface HardcoverBookResult {
  id: number;
  title: string;
  description?: string;
  release_date?: string;
  rating?: number;
  pages?: number;
  image?: HardcoverImage;
  images?: HardcoverImage[];
  contributions?: { author: { name: string } }[];
  users_count?: number;
}

interface HardcoverSearchResultDoc {
  id: number;
  title: string;
  description?: string;
  release_date?: string;
  release_year?: number;
  rating?: number;
  pages?: number;
  image?: { url: string };
  author_names?: string[];
  users_count?: number;
}

interface HardcoverSearchResponse {
  data: {
    search: {
      results: {
        hits: Array<{
          document: HardcoverSearchResultDoc;
        }>;
      };
    };
  };
  errors?: unknown[];
}

interface HardcoverBooksResponse {
  data: {
    books: HardcoverBookResult[];
  };
  errors?: unknown[];
}

export interface HardcoverEdition {
  id: number;
  title: string;
  edition_format: string;
  pages: number;
  release_date: string;
  isbn_10: string;
  isbn_13: string;
  publisher?: {
    name: string;
  };
}

interface HardcoverEditionsResponse {
  data: {
    editions: HardcoverEdition[];
  };
  errors?: unknown[];
}

// Internal search function
async function _searchBooks(query: string): Promise<Book[]> {
  if (!API_KEY) {
    console.warn("HARDCOVER_API_KEY is not set. Please add it to your .env.local file.");
    return [];
  }

  const graphqlQuery = `
    query SearchBooks($query: String!) {
      search(query: $query, query_type: "Book", per_page: 20) {
        results
      }
    }
  `;

  try {
    const res = await fetch(HARDCOVER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": API_KEY.trim().startsWith("Bearer ") ? API_KEY.trim() : `Bearer ${API_KEY.trim()}`,
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { query },
      }),
      next: { revalidate: 300 }, // Cache search results for 5 minutes
    });

    if (!res.ok) {
      console.error(`[Hardcover] API Error ${res.status}: ${res.statusText}`);
      return [];
    }

    const json: HardcoverSearchResponse = await res.json();

    if (json.errors) {
      console.error("[Hardcover] GraphQL Errors:", JSON.stringify(json.errors, null, 2));
      return [];
    }

    const hits = json.data?.search?.results?.hits || [];

    return hits.map(hit => mapSearchResultToBook(hit.document));
  } catch (error) {
    console.error("[Hardcover] Service Error:", error);
    return [];
  }
}

// Request deduplication + Next.js ISR caching
export const searchBooks = cache(_searchBooks);

export async function getTrendingBooks(): Promise<Book[]> {
  if (!API_KEY) return [];

  const graphqlQuery = `
    query GetTrendingBooks {
      books(order_by: {users_count: desc}, limit: 20) {
        id
        title
        description
        release_date
        rating
        pages
        images {
          url
        }
        contributions {
          author {
            name
          }
        }
        users_count
      }
    }
  `;

  try {
    const res = await fetch(HARDCOVER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": API_KEY.trim().startsWith("Bearer ") ? API_KEY.trim() : `Bearer ${API_KEY.trim()}`,
      },
      body: JSON.stringify({
        query: graphqlQuery,
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`[Hardcover] API Error ${res.status}: ${res.statusText}`);
      return [];
    }

    const json: HardcoverBooksResponse = await res.json();
    
    if (json.errors) {
      console.error("[Hardcover] GraphQL Errors (getTrendingBooks):", JSON.stringify(json.errors, null, 2));
      return [];
    }

    return (json.data?.books || []).map(mapHardcoverBookToBook);
  } catch (error) {
    console.error("[Hardcover] Error fetching trending books:", error);
    return [];
  }
}

// Internal getBookById function
async function _getBookById(id: string): Promise<Book | null> {
  if (!API_KEY) return null;

  const intId = parseInt(id, 10);
  if (isNaN(intId)) return null;

  const graphqlQuery = `
    query GetBook($id: Int!) {
      books(where: {id: {_eq: $id}}, limit: 1) {
        id
        title
        description
        release_date
        rating
        pages
        images {
          url
        }
        contributions {
          author {
            name
          }
        }
        users_count
      }
    }
  `;

  try {
    const res = await fetch(HARDCOVER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": API_KEY.trim().startsWith("Bearer ") ? API_KEY.trim() : `Bearer ${API_KEY.trim()}`,
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { id: intId },
      }),
      next: { revalidate: 86400 }, // Cache for 24 hours (book data rarely changes)
    });

    if (!res.ok) return null;

    const json: HardcoverBooksResponse = await res.json();

    if (json.errors || !json.data?.books?.length) {
      if (json.errors) {
        console.error("[Hardcover] GraphQL Errors (getBookById):", JSON.stringify(json.errors, null, 2));
      }
      return null;
    }

    return mapHardcoverBookToBook(json.data.books[0]);
  } catch (error) {
    console.error("[Hardcover] Error fetching book:", error);
    return null;
  }
}

// Request deduplication + 24 hour cache for book details
export const getBookById = cache(_getBookById);

function mapSearchResultToBook(doc: HardcoverSearchResultDoc): Book {
  const year = doc.release_year || (doc.release_date ? parseInt(doc.release_date.split("-")[0]) : new Date().getFullYear());
  
  const coverImage = doc.image?.url || "/placeholder-book.jpg";
  const authorNames = doc.author_names?.join(", ") || "Unknown Author";

  return {
    id: String(doc.id),
    title: doc.title,
    author: authorNames,
    year,
    coverImage,
    description: doc.description || "No description available.",
    rating: doc.rating || 0,
    genre: ["General"], // Genre info not readily available in search hits
    pages: doc.pages,
    mediaType: 'book',
  };
}

function mapHardcoverBookToBook(item: HardcoverBookResult): Book {

  let year = new Date().getFullYear();
  if (item.release_date && typeof item.release_date === 'string') {
     const parts = item.release_date.split("-");
     if (parts.length > 0) {
       const parsed = parseInt(parts[0]);
       if (!isNaN(parsed)) year = parsed;
     }
  }

  const coverImage = (item.images && item.images.length > 0 ? item.images[0].url : null) || 
                     item.image?.url || 
                     "/placeholder-book.jpg";
  
  const authorNames = item.contributions?.map(c => c.author.name).join(", ") || "Unknown Author";

  return {
    id: String(item.id),
    title: item.title,
    author: authorNames,
    year,
    coverImage,
    images: item.images?.map(img => img.url) || [],
    description: item.description || "No description available.",
    rating: item.rating || 0,
    genre: ["General"],
    pages: item.pages,
    mediaType: 'book',
  };
}

// Internal getEditionsFromTitle function
async function _getEditionsFromTitle(title: string): Promise<HardcoverEdition[]> {
  if (!API_KEY) return [];

  const graphqlQuery = `
    query GetEditionsFromTitle($title: String!) {
      editions(where: {title: {_eq: $title}}) {
        id
        title
        edition_format
        pages
        release_date
        isbn_10
        isbn_13
        publisher {
          name
        }
      }
    }
  `;

  try {
    const res = await fetch(HARDCOVER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": API_KEY.trim().startsWith("Bearer ") ? API_KEY.trim() : `Bearer ${API_KEY.trim()}`,
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { title },
      }),
      next: { revalidate: 86400 }, // Cache for 24 hours (editions rarely change)
    });

    if (!res.ok) {
        console.error(`[Hardcover] API Error ${res.status}: ${res.statusText}`);
        return [];
    }

    const json: HardcoverEditionsResponse = await res.json();
    if (json.errors) {
        console.error("[Hardcover] GraphQL Errors (getEditionsFromTitle):", JSON.stringify(json.errors, null, 2));
        return [];
    }

    return json.data?.editions || [];
  } catch (error) {
     console.error("[Hardcover] Error fetching editions:", error);
     return [];
  }
}

// Request deduplication + 24 hour cache for editions
export const getEditionsFromTitle = cache(_getEditionsFromTitle);
