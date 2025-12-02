"use client";

import { useState, useEffect } from "react";
import { useMedia } from "@/context/MediaContext";
import { MovieCard } from "@/components/MovieCard";
import { BookCard } from "@/components/BookCard";
import { Movie, Book } from "@/types";
import { cn } from "@/lib/utils";
import { LayoutGrid, Heart, Clock, Bookmark, User, Film, Tv, Layers, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserMediaAction } from "@/app/actions";

type Tab = "watched" | "watchlist" | "favorites";
type MediaTypeFilter = "all" | "movie" | "tv";
type ContentType = "movies" | "books";

export function ProfilePage() {
  const { mediaType: contentType, setMediaType: setContentType } = useMedia();
  const [activeTab, setActiveTab] = useState<Tab>("watched");
  const [hoveredTab, setHoveredTab] = useState<Tab | null>(null);
  const [mediaFilter, setMediaFilter] = useState<MediaTypeFilter>("all");
  const [hoveredFilter, setHoveredFilter] = useState<MediaTypeFilter | null>(null);
  const [hoveredContentType, setHoveredContentType] = useState<ContentType | null>(null);
  
  // Data state
  const [watchedMovies, setWatchedMovies] = useState<Movie[]>([]);
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
  const [favoritesMovies, setFavoritesMovies] = useState<Movie[]>([]);
  const [watchedBooks, setWatchedBooks] = useState<Book[]>([]);
  const [watchlistBooks, setWatchlistBooks] = useState<Book[]>([]);
  const [favoritesBooks, setFavoritesBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user media data
  useEffect(() => {
    const fetchUserMedia = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (contentType === "books") {
          const [watchedResult, watchlistResult, favoritesResult] = await Promise.all([
            getUserMediaAction("books", "watched"),
            getUserMediaAction("books", "watchlist"),
            getUserMediaAction("books", "favorites"),
          ]);

          if (watchedResult.error) {
            setError(watchedResult.error);
          } else {
            setWatchedBooks(watchedResult.books || []);
          }

          if (watchlistResult.error && !error) {
            setError(watchlistResult.error);
          } else {
            setWatchlistBooks(watchlistResult.books || []);
          }

          if (favoritesResult.error && !error) {
            setError(favoritesResult.error);
          } else {
            setFavoritesBooks(favoritesResult.books || []);
          }
        } else {
          const [watchedResult, watchlistResult, favoritesResult] = await Promise.all([
            getUserMediaAction("movies", "watched"),
            getUserMediaAction("movies", "watchlist"),
            getUserMediaAction("movies", "favorites"),
          ]);

          if (watchedResult.error) {
            setError(watchedResult.error);
          } else {
            setWatchedMovies(watchedResult.movies || []);
          }

          if (watchlistResult.error && !error) {
            setError(watchlistResult.error);
          } else {
            setWatchlistMovies(watchlistResult.movies || []);
          }

          if (favoritesResult.error && !error) {
            setError(favoritesResult.error);
          } else {
            setFavoritesMovies(favoritesResult.movies || []);
          }
        }
      } catch (err) {
        setError("Failed to load your library");
        console.error("Error fetching user media:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserMedia();
  }, [contentType]);

  const getTabContent = () => {
    if (contentType === "books") {
       switch (activeTab) {
        case "watched": return watchedBooks;
        case "watchlist": return watchlistBooks;
        case "favorites": return favoritesBooks;
        default: return watchedBooks;
      }
    }

    switch (activeTab) {
      case "watched": return watchedMovies;
      case "watchlist": return watchlistMovies;
      case "favorites": return favoritesMovies;
      default: return watchedMovies;
    }
  };

  const content = getTabContent().filter(item => {
    if (contentType === "books") return true;
    if (mediaFilter === "all") return true;
    // @ts-ignore - we know item is Movie here
    return item.mediaType === mediaFilter;
  });

  return (
    <div className="min-h-screen pb-20 pt-12">
      <div className="mx-auto px-4 md:px-8">
        
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-12">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative mb-6"
          >
            <div className="w-24 h-24 rounded-full bg-linear-to-tr from-gray-200 to-gray-100 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center border border-white/10 shadow-2xl ring-4 ring-surface">
                <User size={48} className="text-foreground/70" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-background shadow-sm" />
          </motion.div>
          
          <motion.h1 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2"
          >
            Your Library
          </motion.h1>
          
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 text-sm font-medium text-foreground/50"
          >
            <span className="flex items-center gap-1">
              <Clock size={14} /> 
              {isLoading ? "..." : contentType === "movies" ? watchedMovies.length : watchedBooks.length} 
              {contentType === "books" ? " Read" : " Watched"}
            </span>
            <span className="w-1 h-1 rounded-full bg-foreground/20" />
            <span className="flex items-center gap-1">
              <Bookmark size={14} /> 
              {isLoading ? "..." : contentType === "movies" ? watchlistMovies.length : watchlistBooks.length} 
              {" Queue"}
            </span>
            <span className="w-1 h-1 rounded-full bg-foreground/20" />
            <span className="flex items-center gap-1">
              <Heart size={14} /> 
              {isLoading ? "..." : contentType === "movies" ? favoritesMovies.length : favoritesBooks.length} 
              {" Loved"}
            </span>
          </motion.div>
        </div>

        {/* Controls Container */}
        <div className="flex flex-col gap-6 mb-12">
           {/* Content Type Switch */}
           <div className="flex justify-center">
             <div 
                className="flex p-1 bg-surface shadow-sm rounded-full border border-border/50 relative"
                onMouseLeave={() => setHoveredContentType(null)}
              >
                <ContentTypeButton
                  id="movies"
                  active={contentType === "movies"}
                  onClick={() => setContentType("movies")}
                  label="Movies & TV"
                  icon={<Film size={14} />}
                  hovered={hoveredContentType}
                  setHovered={setHoveredContentType}
                />
                <ContentTypeButton
                  id="books"
                  active={contentType === "books"}
                  onClick={() => setContentType("books")}
                  label="Books"
                  icon={<BookOpen size={14} />}
                  hovered={hoveredContentType}
                  setHovered={setHoveredContentType}
                />
             </div>
           </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          {/* Tabs */}
          <div 
            className="flex p-1.5 bg-surface shadow-sm rounded-full border border-border/50 relative"
            onMouseLeave={() => setHoveredTab(null)}
          >
            <TabButton 
              id="watched"
              active={activeTab === "watched"} 
              onClick={() => setActiveTab("watched")}
              label={contentType === "books" ? "Read" : "Watched"}
              hoveredTab={hoveredTab}
              setHoveredTab={setHoveredTab}
            />
            <TabButton 
              id="watchlist"
              active={activeTab === "watchlist"} 
              onClick={() => setActiveTab("watchlist")}
              label={contentType === "books" ? "Read Later" : "Watchlist"}
              hoveredTab={hoveredTab}
              setHoveredTab={setHoveredTab}
            />
            <TabButton 
              id="favorites"
              active={activeTab === "favorites"} 
              onClick={() => setActiveTab("favorites")}
              label="Favorites"
              hoveredTab={hoveredTab}
              setHoveredTab={setHoveredTab}
            />
          </div>

          {/* Media Filter - Only show for movies */}
          <AnimatePresence mode="popLayout">
            {contentType === "movies" && (
              <motion.div 
                initial={{ opacity: 0, width: 0, scale: 0.8 }}
                animate={{ opacity: 1, width: "auto", scale: 1 }}
                exit={{ opacity: 0, width: 0, scale: 0.8 }}
                className="flex items-center p-1 bg-surface/50 rounded-full border border-border/30 relative overflow-hidden"
                onMouseLeave={() => setHoveredFilter(null)}
              >
                <MediaFilterButton 
                  id="movie"
                  active={mediaFilter === "movie"} 
                  onClick={() => setMediaFilter("movie")}
                  icon={<Film size={14} />}
                  label="Movies"
                  hoveredFilter={hoveredFilter}
                  setHoveredFilter={setHoveredFilter}
                />
                <MediaFilterButton 
                  id="all"
                  active={mediaFilter === "all"} 
                  onClick={() => setMediaFilter("all")}
                  icon={<Layers size={14} />}
                  label="All"
                  hoveredFilter={hoveredFilter}
                  setHoveredFilter={setHoveredFilter}
                />
                <MediaFilterButton 
                  id="tv"
                  active={mediaFilter === "tv"} 
                  onClick={() => setMediaFilter("tv")}
                  icon={<Tv size={14} />}
                  label="Series"
                  hoveredFilter={hoveredFilter}
                  setHoveredFilter={setHoveredFilter}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mb-4" />
            <p className="text-foreground/50 font-medium">Loading your library...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-foreground/50">
            <LayoutGrid size={48} strokeWidth={1} className="mb-4 opacity-50" />
            <p className="font-medium text-lg mb-2">Failed to load library</p>
            <p className="text-sm text-foreground/40">{error}</p>
          </div>
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6"
            >
                {content.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    style={{ willChange: "transform, opacity" }}
                    key={item.id}
                  >
                    {contentType === "movies" ? (
                       <MovieCard movie={item as Movie} aspectRatio="portrait" />
                    ) : (
                       <BookCard book={item as Book} />
                    )}
                  </motion.div>
                ))}
            </motion.div>

            {content.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-foreground/30">
                    <LayoutGrid size={48} strokeWidth={1} className="mb-4 opacity-50" />
                    <p className="font-medium text-lg mb-2">No items found</p>
                    <p className="text-sm text-foreground/40">
                      {activeTab === "watched" 
                        ? `Start ${contentType === "books" ? "reading" : "watching"} to build your library!`
                        : activeTab === "watchlist"
                        ? `Add items to your ${contentType === "books" ? "reading list" : "watchlist"} to see them here.`
                        : "Mark items as favorites to see them here."}
                    </p>
                </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  label,
  id,
  hoveredTab,
  setHoveredTab,
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string;
  id: Tab;
  hoveredTab: Tab | null;
  setHoveredTab: (tab: Tab | null) => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHoveredTab(id)}
      className={cn(
        "relative px-6 py-2.5 rounded-full text-sm font-medium transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
        active ? "text-background" : "text-foreground/60 hover:text-foreground"
      )}
    >
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-foreground rounded-full shadow-sm z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          style={{ willChange: "transform, opacity" }}
        />
      )}
      <AnimatePresence>
        {hoveredTab === id && !active && (
          <motion.div
            layoutId="hoverTab"
            className="absolute inset-0 bg-surface-hover rounded-full z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ willChange: "transform, opacity" }}
          />
        )}
      </AnimatePresence>
      <span className="relative z-10 mix-blend-normal">{label}</span>
    </button>
  );
}

function ContentTypeButton({
  active,
  onClick,
  icon,
  label,
  id,
  hovered,
  setHovered
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  id: ContentType;
  hovered: ContentType | null;
  setHovered: (type: ContentType | null) => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(id)}
      className={cn(
        "relative flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300 outline-none",
        active 
          ? "text-background" 
          : "text-foreground/60 hover:text-foreground"
      )}
    >
      {active && (
        <motion.div
          layoutId="activeContentType"
          className="absolute inset-0 bg-foreground rounded-full shadow-sm z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          style={{ willChange: "transform, opacity" }}
        />
      )}
      <AnimatePresence>
        {hovered === id && !active && (
          <motion.div
            layoutId="hoverContentType"
            className="absolute inset-0 bg-surface-hover rounded-full z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ willChange: "transform, opacity" }}
          />
        )}
      </AnimatePresence>
      <span className="relative z-10 flex items-center gap-2 mix-blend-normal">
        {icon}
        <span>{label}</span>
      </span>
    </button>
  );
}

function MediaFilterButton({
  active,
  onClick,
  icon,
  label,
  id,
  hoveredFilter,
  setHoveredFilter
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  id: MediaTypeFilter;
  hoveredFilter: MediaTypeFilter | null;
  setHoveredFilter: (filter: MediaTypeFilter | null) => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHoveredFilter(id)}
      className={cn(
        "relative flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-colors duration-300 outline-none",
        active 
          ? "text-background" 
          : "text-foreground/60 hover:text-foreground"
      )}
    >
      {active && (
        <motion.div
          layoutId="activeFilter"
          className="absolute inset-0 bg-foreground rounded-full shadow-sm z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          style={{ willChange: "transform, opacity" }}
        />
      )}
      <AnimatePresence>
        {hoveredFilter === id && !active && (
          <motion.div
            layoutId="hoverFilter"
            className="absolute inset-0 bg-surface-hover rounded-full z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ willChange: "transform, opacity" }}
          />
        )}
      </AnimatePresence>
      <span className="relative z-10 flex items-center gap-2 mix-blend-normal">
        {icon}
        <span>{label}</span>
      </span>
    </button>
  );
}
