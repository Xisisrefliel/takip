"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Film, Search, Tv, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { Book, Movie } from "@/types";
import { searchBooksAction, searchMoviesAction, searchSeriesAction } from "@/app/actions";

interface SearchResultsProps {
    query: string;
    activeTab: "movies" | "series" | "books";
    onTabChange: (tab: "movies" | "series" | "books") => void;
    onClose: () => void;
}

export function SearchResults({
    query,
    activeTab,
    onTabChange,
    onClose
}: SearchResultsProps) {
    const [results, setResults] = useState<(Book | Movie)[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hoveredTab, setHoveredTab] = useState<"movies" | "series" | "books" | null>(null);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim()) {
                setIsSearching(true);
                try {
                    let searchResults: (Book | Movie)[] = [];
                    if (activeTab === "movies") {
                        searchResults = await searchMoviesAction(query);
                    } else if (activeTab === "series") {
                        searchResults = await searchSeriesAction(query);
                    } else {
                        searchResults = await searchBooksAction(query);
                    }
                    setResults(searchResults);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, activeTab]);

    return (
        <div className="pointer-events-auto w-full max-w-[550px] flex flex-col gap-1.5">
            {/* Search Type Tabs */}
            <div className="flex items-center p-0.5 sm:p-1 mt-2 bg-white/60 dark:bg-black/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-full shadow-2xl shadow-black/20">
                <SearchTabButton
                    id="movies"
                    active={activeTab === "movies"}
                    onClick={() => onTabChange("movies")}
                    label="Movies"
                    icon={<Film size={12} className="sm:w-3.5 sm:h-3.5" />}
                    hovered={hoveredTab}
                    setHovered={setHoveredTab}
                />
                <SearchTabButton
                    id="series"
                    active={activeTab === "series"}
                    onClick={() => onTabChange("series")}
                    label="TV Series"
                    icon={<Tv size={12} className="sm:w-3.5 sm:h-3.5" />}
                    hovered={hoveredTab}
                    setHovered={setHoveredTab}
                />
                <SearchTabButton
                    id="books"
                    active={activeTab === "books"}
                    onClick={() => onTabChange("books")}
                    label="Books"
                    icon={<BookOpen size={12} className="sm:w-3.5 sm:h-3.5" />}
                    hovered={hoveredTab}
                    setHovered={setHoveredTab}
                />
            </div>

            <div className="bg-white/60 dark:bg-black/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/20 flex flex-col max-h-[65vh]">
                <div className="overflow-y-auto p-2 scrollbar-hide">
                    {isSearching ? (
                        <div className="h-60 flex flex-col items-center justify-center text-muted-foreground gap-3">
                            <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                            <span className="text-xs font-medium text-foreground/60">Searching library...</span>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-1 gap-1">
                            {results
                                .filter((item) => {
                                    const isBookTab = activeTab === "books";
                                    const isBookItem = "author" in item;
                                    return isBookTab === isBookItem;
                                })
                                .map((item) => {
                                    const isBookItem = "author" in item;
                                    const book = isBookItem ? (item as Book) : null;
                                    const movie = !isBookItem ? (item as Movie) : null;

                                    const href = isBookItem
                                        ? `/book/${book!.id}`
                                        : `/${movie!.mediaType === "tv" ? "tv" : "movie"}/${movie!.id}`;
                                    const title = isBookItem ? book!.title : movie!.title;
                                    const subtitle = isBookItem ? book!.author : movie!.year || "Unknown Year";
                                    const image = isBookItem ? book!.coverImage : movie!.posterUrl;
                                    const rating = isBookItem ? book!.rating : movie!.rating;

                                    return (
                                        <Link
                                            key={item.id}
                                            href={href}
                                            onClick={onClose}
                                            className="flex items-center gap-4 p-2.5 hover:bg-foreground/5 rounded-xl transition-all duration-200 group active:scale-[0.99]"
                                        >
                                            <div className="relative w-12 h-[72px] shrink-0 rounded-sm overflow-hidden shadow-lg bg-foreground/5 ring-1 ring-foreground/10 group-hover:ring-foreground/20 transition-all">
                                                <Image
                                                    src={image}
                                                    alt={title}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                    sizes="48px"
                                                />
                                            </div>
                                            <div className="flex flex-col min-w-0 gap-0.5 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[15px] font-medium text-foreground/90 truncate group-hover:text-foreground transition-colors">
                                                        {title}
                                                    </span>
                                                    {rating && rating > 0 && (
                                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-foreground/10 text-foreground/60">
                                                            {rating.toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[13px] text-foreground/40 truncate group-hover:text-foreground/60 transition-colors">
                                                    {subtitle}
                                                </span>
                                                {!isBookItem && movie?.overview && (
                                                    <span className="text-[11px] text-foreground/30 truncate mt-1">
                                                        {movie.overview}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                        </div>
                    ) : (
                        <div className="h-60 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mb-3 text-foreground/20">
                                <Search size={20} />
                            </div>
                            <p className="text-sm text-foreground/40 font-medium">No results found</p>
                            <p className="text-xs text-foreground/20 mt-1">Try searching for something else</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SearchTabButton({
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
    id: "movies" | "series" | "books";
    hovered: "movies" | "series" | "books" | null;
    setHovered: (type: "movies" | "series" | "books" | null) => void;
}) {
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
                "relative flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-colors duration-300 outline-none flex-1 justify-center",
                active
                    ? "text-foreground"
                    : "text-foreground/50 hover:text-foreground"
            )}
        >
            {active && (
                <motion.div
                    layoutId="activeSearchTab"
                    className="absolute inset-0 bg-foreground/10 rounded-lg shadow-sm z-10 border border-foreground/5"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    style={{ willChange: "transform, opacity" }}
                />
            )}
            <AnimatePresence>
                {hovered === id && !active && (
                    <motion.div
                        layoutId="hoverSearchTab"
                        className="absolute inset-0 bg-foreground/5 rounded-lg z-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ willChange: "transform, opacity" }}
                    />
                )}
            </AnimatePresence>
            <span className="relative z-10 flex items-center gap-1 sm:gap-2 mix-blend-normal">
                {icon}
                <span className="truncate">{label}</span>
            </span>
        </button>
    );
}
