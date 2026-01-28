"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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

interface ProfilePageProps {
  initialContentType?: ContentType;
  initialMovies?: {
    watched: Movie[];
    watchlist: Movie[];
    favorites: Movie[];
  };
  initialBooks?: {
    watched: Book[];
    watchlist: Book[];
    favorites: Book[];
  };
}

const SKELETON_COUNT = 12;
const GRID_CLASSES = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6";

function SkeletonGrid() {
  return (
    <div className={GRID_CLASSES}>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-2/3 bg-surface rounded-xl mb-2" />
          <div className="h-3 bg-surface rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function ProfilePage({ 
  initialContentType = "movies", 
  initialMovies,
  initialBooks 
}: ProfilePageProps) {
  const { mediaType: contentType, setMediaType: setContentType } = useMedia();
  const [activeTab, setActiveTab] = useState<Tab>("watched");
  const [hoveredTab, setHoveredTab] = useState<Tab | null>(null);
  const [mediaFilter, setMediaFilter] = useState<MediaTypeFilter>("all");
  const [hoveredFilter, setHoveredFilter] = useState<MediaTypeFilter | null>(null);
  const [hoveredContentType, setHoveredContentType] = useState<ContentType | null>(null);
  
  const [watchedMovies, setWatchedMovies] = useState<Movie[]>(initialMovies?.watched || []);
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>(initialMovies?.watchlist || []);
  const [favoritesMovies, setFavoritesMovies] = useState<Movie[]>(initialMovies?.favorites || []);
  const [watchedBooks, setWatchedBooks] = useState<Book[]>(initialBooks?.watched || []);
  const [watchlistBooks, setWatchlistBooks] = useState<Book[]>(initialBooks?.watchlist || []);
  const [favoritesBooks, setFavoritesBooks] = useState<Book[]>(initialBooks?.favorites || []);
  
  const [isLoading, setIsLoading] = useState(!initialMovies && !initialBooks);
  const [error, setError] = useState<string | null>(null);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set([
    `movies-watched`,
    `movies-watchlist`,
    `movies-favorites`,
    `books-watched`,
    `books-watchlist`,
    `books-favorites`,
  ].filter(key => {
    if (initialContentType === "movies" && initialMovies) {
      return key.startsWith("movies-");
    }
    if (initialContentType === "books" && initialBooks) {
      return key.startsWith("books-");
    }
    return false;
  })));

  const fetchTabData = useCallback(async (type: ContentType, tab: Tab) => {
    const key = `${type}-${tab}`;
    if (loadedTabs.has(key)) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserMediaAction(type, tab);
      
      if (result.error) {
        setError(result.error);
      } else if (type === "books" && result.books) {
        if (tab === "watched") setWatchedBooks(result.books);
        else if (tab === "watchlist") setWatchlistBooks(result.books);
        else if (tab === "favorites") setFavoritesBooks(result.books);
      } else if (result.movies) {
        if (tab === "watched") setWatchedMovies(result.movies);
        else if (tab === "watchlist") setWatchlistMovies(result.movies);
        else if (tab === "favorites") setFavoritesMovies(result.movies);
      }
      
      setLoadedTabs(prev => new Set([...prev, key]));
    } catch (err) {
      setError("Failed to load data");
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [loadedTabs]);

  useEffect(() => {
    const currentKey = `${contentType}-${activeTab}`;
    if (!loadedTabs.has(currentKey)) {
      fetchTabData(contentType, activeTab);
    }
  }, [contentType, activeTab, fetchTabData, loadedTabs]);

  const getTabContent = useCallback(() => {
    const moviesByTab = { watched: watchedMovies, watchlist: watchlistMovies, favorites: favoritesMovies };
    const booksByTab = { watched: watchedBooks, watchlist: watchlistBooks, favorites: favoritesBooks };
    const source = contentType === "books" ? booksByTab : moviesByTab;
    return source[activeTab] || source.watched;
  }, [contentType, activeTab, watchedBooks, watchlistBooks, favoritesBooks, watchedMovies, watchlistMovies, favoritesMovies]);

  const tabContent = getTabContent();
  const content = useMemo(() => {
    const items = tabContent as (Movie | Book)[];
    if (contentType === "books") return items;
    return (items as Movie[]).filter((item) =>
      mediaFilter === "all" ? true : item.mediaType === mediaFilter
    );
  }, [tabContent, contentType, mediaFilter]);

  const PAGE_SIZE = 60;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, mediaFilter, contentType]);

  const visibleContent = useMemo(
    () => content.slice(0, visibleCount),
    [content, visibleCount]
  );

  
  const isTabLoading = isLoading || !loadedTabs.has(`${contentType}-${activeTab}`);

  return (
    <div className="min-h-screen pb-20 pt-8 sm:pt-12">
      <div className="mx-auto px-4 sm:px-6 md:px-8">
        
        <div className="flex flex-col items-center mb-8 sm:mb-12">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative mb-4 sm:mb-6"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-tr from-gray-200 to-gray-100 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center border border-white/10 shadow-2xl ring-2 sm:ring-4 ring-surface">
                <User size={40} className="sm:w-12 sm:h-12 text-foreground/70" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 sm:border-4 border-background shadow-sm" />
          </motion.div>
          
          <motion.h1 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2"
          >
            Your Library
          </motion.h1>
          
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-foreground/50 px-4"
          >
            <span className="flex items-center gap-1">
              <Clock size={12} className="sm:w-3.5 sm:h-3.5" /> 
              {isLoading ? "..." : contentType === "movies" ? watchedMovies.length : watchedBooks.length} 
              {contentType === "books" ? " Read" : " Watched"}
            </span>
            <span className="w-1 h-1 rounded-full bg-foreground/20" />
            <span className="flex items-center gap-1">
              <Bookmark size={12} className="sm:w-3.5 sm:h-3.5" /> 
              {isLoading ? "..." : contentType === "movies" ? watchlistMovies.length : watchlistBooks.length} 
              {" Queue"}
            </span>
            <span className="w-1 h-1 rounded-full bg-foreground/20" />
            <span className="flex items-center gap-1">
              <Heart size={12} className="sm:w-3.5 sm:h-3.5" /> 
              {isLoading ? "..." : contentType === "movies" ? favoritesMovies.length : favoritesBooks.length} 
              {" Loved"}
            </span>
          </motion.div>
        </div>

        <div className="flex flex-col gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="flex justify-center">
            <div 
              className="flex p-0.5 sm:p-1 bg-surface shadow-sm rounded-full border border-border/50 relative"
              onMouseLeave={() => setHoveredContentType(null)}
            >
              <ContentTypeButton
                id="movies"
                active={contentType === "movies"}
                onClick={() => setContentType("movies")}
                label="Movies & TV"
                icon={<Film size={12} className="sm:w-3.5 sm:h-3.5" />}
                hovered={hoveredContentType}
                setHovered={setHoveredContentType}
              />
              <ContentTypeButton
                id="books"
                active={contentType === "books"}
                onClick={() => setContentType("books")}
                label="Books"
                icon={<BookOpen size={12} className="sm:w-3.5 sm:h-3.5" />}
                hovered={hoveredContentType}
                setHovered={setHoveredContentType}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <div 
              className="flex p-0.5 sm:p-1.5 bg-surface shadow-sm rounded-full border border-border/50 relative w-fit justify-center"
              onMouseLeave={() => setHoveredTab(null)}
              role="tablist"
              aria-label="Library tabs"
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

            <AnimatePresence mode="popLayout">
              {contentType === "movies" && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center p-0.5 sm:p-1 bg-surface/50 rounded-full border border-border/30 relative w-full sm:w-auto justify-center"
                  onMouseLeave={() => setHoveredFilter(null)}
                >
                  <MediaFilterButton 
                    id="movie"
                    active={mediaFilter === "movie"} 
                    onClick={() => setMediaFilter("movie")}
                    icon={<Film size={12} className="sm:w-3.5 sm:h-3.5" />}
                    label="Movies"
                    hoveredFilter={hoveredFilter}
                    setHoveredFilter={setHoveredFilter}
                  />
                  <MediaFilterButton 
                    id="all"
                    active={mediaFilter === "all"} 
                    onClick={() => setMediaFilter("all")}
                    icon={<Layers size={12} className="sm:w-3.5 sm:h-3.5" />}
                    label="All"
                    hoveredFilter={hoveredFilter}
                    setHoveredFilter={setHoveredFilter}
                  />
                  <MediaFilterButton 
                    id="tv"
                    active={mediaFilter === "tv"} 
                    onClick={() => setMediaFilter("tv")}
                    icon={<Tv size={12} className="sm:w-3.5 sm:h-3.5" />}
                    label="Series"
                    hoveredFilter={hoveredFilter}
                    setHoveredFilter={setHoveredFilter}
                  />
</motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {isTabLoading ? (
          <SkeletonGrid />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-foreground/50 px-4">
            <LayoutGrid
              size={40}
              strokeWidth={1}
              className="sm:w-12 sm:h-12 mb-3 sm:mb-4 opacity-50"
            />
            <p className="font-medium text-base sm:text-lg mb-1 sm:mb-2">Failed to load library</p>
            <p className="text-xs sm:text-sm text-foreground/40 text-center">{error}</p>
          </div>
        ) : (
          <>
            <div className={GRID_CLASSES}>
              {visibleContent.map((item) => (
                <div key={item.id}>
                  {contentType === "movies" ? (
                    <MovieCard movie={item as Movie} aspectRatio="portrait" />
                  ) : (
                    <BookCard book={item as Book} />
                  )}
                </div>
              ))}
</div>

            {visibleCount < content.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, content.length))}
                  className="px-4 py-2 text-sm font-semibold rounded-full border border-border/60 bg-background hover:bg-background/70 transition-all hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Load more ({Math.max(content.length - visibleCount, 0)} left)
                </button>
              </div>
            )}

            {content.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-foreground/30 px-4">
                <LayoutGrid
                  size={40}
                  strokeWidth={1}
                  className="sm:w-12 sm:h-12 mb-3 sm:mb-4 opacity-50"
                />
                <p className="font-medium text-base sm:text-lg mb-1 sm:mb-2 text-center">No items found</p>
                <p className="text-xs sm:text-sm text-foreground/40 text-center">
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
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHoveredTab(id)}
      role="tab"
      aria-selected={active}
      className={cn(
        "relative px-3 sm:px-5 md:px-6 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 whitespace-nowrap",
        active ? "text-background" : "text-foreground/60 hover:text-foreground"
      )}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.6 }}
      style={{ willChange: "transform" }}
    >
      {active && (
        <motion.div
          layoutId="profile-tab-pill"
          className="absolute inset-0 bg-foreground rounded-full shadow-sm z-10"
          transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
          style={{ willChange: "transform, opacity" }}
        />
      )}
      <AnimatePresence>
        {hoveredTab === id && !active && (
          <motion.div
            className="absolute inset-0 bg-surface-hover rounded-full z-0"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ willChange: "transform, opacity" }}
          />
        )}
      </AnimatePresence>
      <span className="relative z-10 mix-blend-normal">{label}</span>
    </motion.button>
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
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHovered(id)}
      aria-pressed={active}
      className={cn(
        "relative flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300 outline-none",
        active 
          ? "text-background" 
          : "text-foreground/60 hover:text-foreground"
      )}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.6 }}
      style={{ willChange: "transform" }}
    >
      {active && (
        <motion.div
          layoutId="profile-content-type-pill"
          className="absolute inset-0 bg-foreground rounded-full shadow-sm z-10"
          transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
          style={{ willChange: "transform, opacity" }}
        />
      )}
      <AnimatePresence>
        {hovered === id && !active && (
          <motion.div
            className="absolute inset-0 bg-surface-hover rounded-full z-0"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ willChange: "transform, opacity" }}
          />
        )}
      </AnimatePresence>
      <span className="relative z-10 flex items-center gap-2 mix-blend-normal">
        {icon}
        <span>{label}</span>
      </span>
    </motion.button>
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
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHoveredFilter(id)}
      aria-pressed={active}
      className={cn(
        "relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors duration-300 outline-none",
        active 
          ? "text-background" 
          : "text-foreground/60 hover:text-foreground"
      )}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.6 }}
      style={{ willChange: "transform" }}
    >
      {active && (
        <motion.div
          layoutId="profile-media-filter-pill"
          className="absolute inset-0 bg-foreground rounded-full shadow-sm z-10"
          transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
          style={{ willChange: "transform, opacity" }}
        />
      )}
      <AnimatePresence>
        {hoveredFilter === id && !active && (
          <motion.div
            className="absolute inset-0 bg-surface-hover rounded-full z-0"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ willChange: "transform, opacity" }}
          />
        )}
      </AnimatePresence>
      <span className="relative z-10 flex items-center gap-2 mix-blend-normal">
        {icon}
        <span>{label}</span>
      </span>
    </motion.button>
  );
}
