"use client";

import { useState } from "react";
import { MovieCard } from "@/components/MovieCard";
import { Movie } from "@/types";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, Heart, Clock, Bookmark, User, Film, Tv, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "watched" | "watchlist" | "favorites";
type MediaTypeFilter = "all" | "movie" | "tv";

interface ProfilePageProps {
  trendingMovies: Movie[];
  popularSeries: Movie[];
}

export function ProfilePage({ trendingMovies, popularSeries }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("watched");
  const [hoveredTab, setHoveredTab] = useState<Tab | null>(null);
  const [mediaFilter, setMediaFilter] = useState<MediaTypeFilter>("all");
  const [hoveredFilter, setHoveredFilter] = useState<MediaTypeFilter | null>(null);

  // Combine and process data
  const allContent: Movie[] = [
    ...trendingMovies,
    ...popularSeries,
  ];

  // Simulate user data since we don't have a real backend yet
  const watched = allContent.filter(m => m.watched).length > 0 
    ? allContent.filter(m => m.watched) 
    : allContent.slice(0, 8).map(m => ({ ...m, watched: true, watchedDate: new Date().toISOString() }));
    
  const watchlist = allContent.filter(m => m.watchlist).length > 0
    ? allContent.filter(m => m.watchlist)
    : allContent.slice(8, 13).map(m => ({ ...m, watchlist: true }));

  const favorites = allContent.filter(m => m.liked).length > 0
    ? allContent.filter(m => m.liked)
    : allContent.slice(2, 5).map(m => ({ ...m, liked: true }));

  const getTabContent = () => {
    switch (activeTab) {
      case "watched": return watched;
      case "watchlist": return watchlist;
      case "favorites": return favorites;
      default: return watched;
    }
  };

  const content = getTabContent().filter(item => {
    if (mediaFilter === "all") return true;
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
            <span className="flex items-center gap-1"><Clock size={14} /> {watched.length} Watched</span>
            <span className="w-1 h-1 rounded-full bg-foreground/20" />
            <span className="flex items-center gap-1"><Bookmark size={14} /> {watchlist.length} Queue</span>
            <span className="w-1 h-1 rounded-full bg-foreground/20" />
            <span className="flex items-center gap-1"><Heart size={14} /> {favorites.length} Loved</span>
          </motion.div>
        </div>

        {/* Controls Container */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12">
          {/* Tabs */}
          <div 
            className="flex p-1.5 bg-surface shadow-sm rounded-full border border-border/50 relative"
            onMouseLeave={() => setHoveredTab(null)}
          >
            <TabButton 
              id="watched"
              active={activeTab === "watched"} 
              onClick={() => setActiveTab("watched")}
              label="Watched"
              hoveredTab={hoveredTab}
              setHoveredTab={setHoveredTab}
            />
            <TabButton 
              id="watchlist"
              active={activeTab === "watchlist"} 
              onClick={() => setActiveTab("watchlist")}
              label="Watchlist"
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

          {/* Media Filter */}
          <div 
            className="flex items-center p-1 bg-surface/50 rounded-full border border-border/30 relative"
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
          </div>
        </div>

        {/* Content Grid */}
        <motion.div
          layout
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6"
        >
            {content.map((movie) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                style={{ willChange: "transform, opacity" }}
                key={movie.id}
              >
                <MovieCard movie={movie} aspectRatio="portrait" />
              </motion.div>
            ))}
        </motion.div>

        {content.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-foreground/30">
                <LayoutGrid size={48} strokeWidth={1} className="mb-4 opacity-50" />
                <p className="font-medium text-lg">No items found</p>
            </div>
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
