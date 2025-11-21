"use client";

import { useState } from "react";
import { MovieCard } from "@/components/MovieCard";
import { Movie } from "@/types";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, Heart, Clock, Bookmark } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="min-h-screen pb-20 pt-12">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-12">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative mb-6"
          >
            <div className="w-24 h-24 rounded-[32px] overflow-hidden ring-4 ring-surface shadow-2xl">
                <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
                    O
                </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-background shadow-sm" />
          </motion.div>
          
          <motion.h1 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2"
          >
            Omer's Library
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

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="flex p-1.5 bg-surface shadow-sm rounded-full border border-border/50">
            <TabButton 
              active={activeTab === "watched"} 
              onClick={() => setActiveTab("watched")}
              label="Watched"
            />
            <TabButton 
              active={activeTab === "watchlist"} 
              onClick={() => setActiveTab("watchlist")}
              label="Watchlist"
            />
            <TabButton 
              active={activeTab === "favorites"} 
              onClick={() => setActiveTab("favorites")}
              label="Favorites"
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
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
        active ? "text-background" : "text-foreground/60 hover:text-foreground"
      )}
    >
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-foreground rounded-full shadow-sm"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          style={{ willChange: "transform, opacity" }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </button>
  );
}
