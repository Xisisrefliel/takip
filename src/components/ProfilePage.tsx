"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MovieCard } from "@/components/MovieCard";
import { Movie } from "@/types";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, Heart, Clock, Bookmark } from "lucide-react";

type Tab = "watched" | "watchlist" | "favorites";

interface ProfilePageProps {
  trendingMovies: Movie[];
  popularSeries: Movie[];
}

export function ProfilePage({ trendingMovies, popularSeries }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("watched");

  // Combine and process data
  const allContent: Movie[] = [
    ...trendingMovies,
    ...popularSeries,
  ];

  // Simulate user data since we don't have a real backend yet
  // We'll arbitrarily assign some movies to categories if they aren't already
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

  const content = getTabContent();

  return (
    <div className="min-h-screen pb-12 pt-20">
      <div className="container mx-auto px-4">
        
        {/* Profile Header - Minimalist */}
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative mb-4 group"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-surface bg-surface">
                {/* Placeholder Avatar */}
                <div className="w-full h-full bg-linear-to-tr from-neutral-800 to-neutral-600 flex items-center justify-center text-2xl font-display text-white/50">
                    O
                </div>
            </div>
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background" />
          </motion.div>
          
          <h1 className="text-2xl md:text-3xl font-display font-medium mb-1 tracking-tight">Omer's Library</h1>
          <div className="flex gap-4 text-xs font-medium text-foreground/60 font-sans tracking-wide uppercase">
            <span>{watched.length} Watched</span>
            <span>•</span>
            <span>{watchlist.length} Queue</span>
            <span>•</span>
            <span>{favorites.length} Loved</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex p-0.5 bg-surface/50 backdrop-blur-sm rounded-full border border-white/5">
            <TabButton 
              active={activeTab === "watched"} 
              onClick={() => setActiveTab("watched")}
              label="Watched"
              icon={Clock}
            />
            <TabButton 
              active={activeTab === "watchlist"} 
              onClick={() => setActiveTab("watchlist")}
              label="Watchlist"
              icon={Bookmark}
            />
            <TabButton 
              active={activeTab === "favorites"} 
              onClick={() => setActiveTab("favorites")}
              label="Favorites"
              icon={Heart}
            />
          </div>
        </div>

        {/* Content Grid */}
        <motion.div
          layout
          className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-6"
        >
          <AnimatePresence mode="popLayout">
            {content.map((movie, index) => (
              <motion.div
                key={movie.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <MovieCard movie={movie} aspectRatio="portrait" />
                <div className="mt-2 text-center md:text-left px-0.5">
                   <h3 className="font-display text-sm leading-tight truncate" title={movie.title}>{movie.title}</h3>
                   <p className="text-[10px] text-foreground/40 font-sans mt-0.5">{movie.year}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {content.length === 0 && (
            <div className="text-center py-12 text-foreground/40">
                <p className="font-display text-lg">No movies found in this section</p>
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
  icon: Icon
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string;
  icon: any;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5",
        active ? "text-background" : "text-foreground/60 hover:text-foreground"
      )}
    >
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-foreground rounded-full"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        <Icon size={12} className={active ? "stroke-2" : "stroke-1.5"} />
        {label}
      </span>
    </button>
  );
}

