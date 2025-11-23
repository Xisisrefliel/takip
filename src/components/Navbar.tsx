"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, User, Search, X, Book as BookIcon, BookOpen, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useLastVisited } from "@/context/LastVisitedContext";
import { useMedia } from "@/context/MediaContext";
import { useState, useRef, useEffect } from "react";
import { searchBooksAction, searchMoviesAction, searchSeriesAction } from "@/app/actions";
import { Book, Movie } from "@/types";
import Image from "next/image";

export function Navbar() {
  const pathname = usePathname();
  const { mediaType, setMediaType } = useMedia();
  const CurrentIcon = mediaType === "books" ? BookIcon : Film;
  const { lastVisited } = useLastVisited();
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<(Book | Movie)[]>([]);
  const [isSearchingMedia, setIsSearchingMedia] = useState(false);
  const [searchType, setSearchType] = useState<"movies" | "series" | "books">("movies");
  const [hoveredSearchTab, setHoveredSearchTab] = useState<"movies" | "series" | "books" | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync media type with pathname
  useEffect(() => {
    if (pathname.startsWith("/books") || pathname.startsWith("/book/")) {
      setMediaType("books");
      setSearchType("books");
    } else if (pathname.startsWith("/tv/")) {
      setMediaType("movies"); // Keep generic context as movies for now
      setSearchType("series");
    } else if (
      pathname === "/" ||
      pathname.startsWith("/movie/")
    ) {
      setMediaType("movies");
      setSearchType("movies");
    }
  }, [pathname, setMediaType]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearchingMedia(true);
        try {
          let results: (Book | Movie)[] = [];
          if (searchType === "movies") {
             results = await searchMoviesAction(searchQuery);
          } else if (searchType === "series") {
             results = await searchSeriesAction(searchQuery);
          } else {
             results = await searchBooksAction(searchQuery);
          }
          setSearchResults(results);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setIsSearchingMedia(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        navRef.current &&
        !navRef.current.contains(event.target as Node) &&
        isSearching
      ) {
        setIsSearching(false);
        setSearchQuery("");
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        isDropdownOpen
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearching, isDropdownOpen]);

  useEffect(() => {
    if (isSearching) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSearching]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearching) {
        setIsSearching(false);
        setSearchQuery("");
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearching(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearching]);

  const isDetailPage =
    pathname.startsWith("/movie/") ||
    pathname.startsWith("/tv/") ||
    pathname.startsWith("/book/");

  // Determine active tab for Discover/Library
  const activeTab = pathname.startsWith("/profile")
    ? "library"
    : pathname === "/" || pathname === "/books"
    ? "discover"
    : null;

  return (
    <>
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.nav
        ref={navRef}
        className={cn(
          "pointer-events-auto flex items-center p-1.5 bg-surface/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-full shadow-lg shadow-black/5 transition-all duration-300",
          isSearching ? "ring-2 ring-white/20 border-transparent" : ""
        )}
        onMouseLeave={() => setHoveredLink(null)}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {isSearching ? (
            <motion.div
              key="search"
              layout="position"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{
                type: "spring",
                bounce: 0.2,
                duration: 0.5,
                opacity: { duration: 0.2 },
              }}
              className="relative flex items-center w-[340px] px-1"
            >
              <motion.div
                className="flex items-center flex-1 min-w-0"
                initial={{ filter: "blur(4px)" }}
                animate={{ filter: "blur(0px)" }}
                exit={{ filter: "blur(4px)" }}
              >
                <Search
                  size={18}
                  className="text-foreground/60 mr-3 shrink-0 ml-2"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    searchType === "books"
                      ? "Search books..."
                      : searchType === "series"
                      ? "Search TV series..."
                      : "Search movies..."
                  }
                  className="flex-1 bg-transparent border-none outline-none text-sm h-10 placeholder:text-foreground/40 text-foreground min-w-0"
                />
                <div className="flex items-center gap-1 ml-1">
                  <div className="hidden sm:flex items-center px-1.5 py-0.5 rounded-md bg-foreground/5 text-[10px] font-medium text-foreground/40 mr-1">
                    ESC
                  </div>
                  <button
                    onClick={() => {
                      setIsSearching(false);
                      setSearchQuery("");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover text-foreground/60 hover:text-foreground transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="nav-content"
              initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(4px)" }}
              transition={{
                type: "spring",
                bounce: 0.2,
                duration: 0.5,
                opacity: { duration: 0.2 },
              }}
              className="flex items-center gap-1 sm:gap-2"
            >
              {/* Media Switcher */}
              <div className="relative mr-1" ref={dropdownRef}>
                <div className="w-10 h-10" /> {/* Placeholder */}
                <motion.div
                  className={cn(
                    "absolute top-0 left-0 z-50 flex flex-col bg-accent text-accent-foreground overflow-hidden cursor-pointer",
                    isDropdownOpen
                      ? "w-48 shadow-xl border border-white/10 p-1.5 items-stretch justify-start"
                      : "w-10 h-10 shadow-none border border-transparent p-0 items-center justify-center"
                  )}
                  style={{ borderRadius: 24 }}
                  onClick={() => !isDropdownOpen && setIsDropdownOpen(true)}
                  whileHover={!isDropdownOpen ? { scale: 1.05 } : {}}
                  whileTap={!isDropdownOpen ? { scale: 0.95 } : {}}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                >
                  <AnimatePresence
                    mode="popLayout"
                    initial={false}
                    presenceAffectsLayout={false}
                  >
                    {isDropdownOpen ? (
                      <motion.div
                        key="dropdown-content"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{
                          opacity: 0,
                          y: -10,
                          transition: { duration: 0.1 },
                        }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-1 w-full"
                      >
                        <Link
                          href="/"
                          className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDropdownOpen(false);
                          }}
                        >
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <Film size={14} />
                          </div>
                          Movies & Series
                        </Link>
                        <Link
                          href="/books"
                          className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDropdownOpen(false);
                          }}
                        >
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <BookIcon size={14} />
                          </div>
                          Books
                        </Link>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="dropdown-icon"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-center"
                      >
                        <CurrentIcon size={18} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Main Navigation Pills */}
              <div
                className="flex items-center bg-surface/50 rounded-full border border-border/30 p-1 relative"
                onMouseLeave={() => setHoveredLink(null)}
              >
                <NavPill
                  href={mediaType === "books" ? "/books" : "/"}
                  active={activeTab === "discover"}
                  hoveredLink={hoveredLink}
                  setHoveredLink={setHoveredLink}
                >
                  Discover
                </NavPill>
                <NavPill
                  href="/profile"
                  active={activeTab === "library"}
                  hoveredLink={hoveredLink}
                  setHoveredLink={setHoveredLink}
                >
                  Library
                </NavPill>
              </div>

              {/* Separator & Last Visited */}
              {lastVisited && (
                <>
                  <div className="h-5 w-px bg-border/50 mx-1" />
                  <motion.div
                    initial={
                      isDetailPage || pathname === lastVisited?.href
                        ? false
                        : { opacity: 0, y: -10 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    key={lastVisited.href}
                  >
                    <Link
                      href={isDetailPage ? pathname : lastVisited?.href || ""}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium transition-colors rounded-full hover:text-foreground flex items-center gap-2",
                        isDetailPage || pathname === lastVisited?.href
                          ? "text-foreground"
                          : "text-foreground/60"
                      )}
                      onMouseEnter={() => setHoveredLink(lastVisited.href)}
                    >
                      <span className="max-w-[150px] truncate">
                        {isDetailPage && lastVisited?.href !== pathname
                          ? "Details"
                          : lastVisited?.title}
                      </span>
                    </Link>
                  </motion.div>
                </>
              )}

              {/* Right Actions */}
              <div className="flex items-center pl-2 border-l border-border/50 gap-1 shrink-0 ml-1">
                <button
                  onClick={() => setIsSearching(true)}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  <Search size={18} />
                </button>
                <Link
                  href="/profile"
                  className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-linear-to-tr from-gray-200 to-gray-100 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center border border-white/10">
                    <User size={14} />
                  </div>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>

    <AnimatePresence>
      {isSearching && searchQuery.trim() && (
        <motion.div
          key="search-results-container"
          className="fixed top-[80px] left-0 right-0 z-40 flex justify-center pointer-events-none"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="pointer-events-auto w-[550px] flex flex-col gap-1.5">
            {/* Search Type Tabs */}
            <div className="flex items-center p-1 mt-2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full shadow-lg">
              <SearchTabButton 
                id="movies"
                active={searchType === "movies"}
                onClick={() => setSearchType("movies")}
                label="Movies"
                icon={<Film size={14} />}
                hovered={hoveredSearchTab}
                setHovered={setHoveredSearchTab}
              />
              <SearchTabButton 
                id="series"
                active={searchType === "series"}
                onClick={() => setSearchType("series")}
                label="TV Series"
                icon={<Tv size={14} />}
                hovered={hoveredSearchTab}
                setHovered={setHoveredSearchTab}
              />
              <SearchTabButton 
                id="books"
                active={searchType === "books"}
                onClick={() => setSearchType("books")}
                label="Books"
                icon={<BookOpen size={14} />}
                hovered={hoveredSearchTab}
                setHovered={setHoveredSearchTab}
              />
            </div>

            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[65vh]">
              <div className="overflow-y-auto p-2 scrollbar-hide">
                {isSearchingMedia ? (
                  <div className="h-60 flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="text-xs font-medium text-white/40">Searching library...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1">
                    {searchResults.map((item) => {
                      const isBookItem = 'author' in item;
                      const isBookTab = searchType === "books";
                      
                      // Skip items that don't match the current tab type to prevent rendering errors during transitions
                      if (isBookTab !== isBookItem) return null;

                      const book = isBookItem ? item as Book : null;
                      const movie = !isBookItem ? item as Movie : null;
                      
                      const href = isBookItem 
                        ? `/book/${book!.id}` 
                        : `/${movie!.mediaType === 'tv' ? 'tv' : 'movie'}/${movie!.id}`;
                      const title = isBookItem ? book!.title : movie!.title;
                      const subtitle = isBookItem ? book!.author : (movie!.year || "Unknown Year");
                      const image = isBookItem ? book!.coverImage : movie!.posterUrl;
                      const rating = isBookItem ? book!.rating : movie!.rating;
                      
                      return (
                        <Link
                          key={item.id}
                          href={href}
                          onClick={() => {
                            setIsSearching(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-4 p-2.5 hover:bg-white/5 rounded-xl transition-all duration-200 group active:scale-[0.99]"
                        >
                          <div className="relative w-12 h-[72px] shrink-0 rounded-lg overflow-hidden shadow-lg bg-white/5 ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
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
                              <span className="text-[15px] font-medium text-white/90 truncate group-hover:text-white transition-colors">
                                {title}
                              </span>
                              {rating && rating > 0 && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                                  {rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <span className="text-[13px] text-white/40 truncate group-hover:text-white/60 transition-colors">
                              {subtitle}
                            </span>
                            {!isBookItem && movie?.overview && (
                              <span className="text-[11px] text-white/30 truncate mt-1">
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
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-white/20">
                      <Search size={20} />
                    </div>
                    <p className="text-sm text-white/40 font-medium">No results found</p>
                    <p className="text-xs text-white/20 mt-1">Try searching for something else</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

function NavPill({
  href,
  active,
  children,
  hoveredLink,
  setHoveredLink,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  hoveredLink: string | null;
  setHoveredLink: (href: string | null) => void;
}) {
  return (
    <Link
      draggable="false"
      href={href}
      onMouseEnter={() => setHoveredLink(href)}
      className={cn(
        "relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
        active ? "text-background" : "text-foreground/60 hover:text-foreground"
      )}
    >
      <AnimatePresence>
        {hoveredLink === href && !active && (
          <motion.div
            layoutId="hoverNavPill"
            className="absolute inset-0 bg-surface-hover rounded-full z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ willChange: "transform, opacity" }}
          />
        )}
      </AnimatePresence>
      {active && (
        <motion.div
          layoutId="activeNavPill"
          className="absolute inset-0 bg-foreground rounded-full shadow-sm z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          style={{ willChange: "transform, opacity" }}
        />
      )}
      <span className="relative z-10 mix-blend-normal">{children}</span>
    </Link>
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
        "relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-300 outline-none flex-1 justify-center",
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
      <span className="relative z-10 flex items-center gap-2 mix-blend-normal">
        {icon}
        <span>{label}</span>
      </span>
    </button>
  );
}