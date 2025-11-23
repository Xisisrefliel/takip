"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, User, Search, X, Book as BookIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useLastVisited } from "@/context/LastVisitedContext";
import { useMedia } from "@/context/MediaContext";
import { useState, useRef, useEffect } from "react";
import { searchBooksAction } from "@/app/actions";
import { Book } from "@/types";
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
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearchingBooks, setIsSearchingBooks] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync media type with pathname
  useEffect(() => {
    if (pathname.startsWith("/books") || pathname.startsWith("/book/")) {
      setMediaType("books");
    } else if (
      pathname === "/" ||
      pathname.startsWith("/movie/") ||
      pathname.startsWith("/tv/")
    ) {
      setMediaType("movies");
    }
  }, [pathname, setMediaType]);

  useEffect(() => {
    if (!pathname.startsWith("/books")) return;

    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearchingBooks(true);
        try {
          const results = await searchBooksAction(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setIsSearchingBooks(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, pathname]);

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
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.nav
        ref={navRef}
        className={cn(
          "pointer-events-auto flex items-center p-1.5 bg-surface/70 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-full shadow-lg shadow-black/5 transition-all duration-300",
          isSearching ? "ring-2 ring-white/20 border-transparent" : ""
        )}
        onMouseLeave={() => setHoveredLink(null)}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {isSearching ? (
            <motion.div
              key="search"
              layout="position"
              initial={{ opacity: 0, x: 20, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 20, filter: "blur(4px)" }}
              transition={{
                type: "spring",
                bounce: 0.2,
                duration: 0.5,
                opacity: { duration: 0.2 },
              }}
              className="relative flex items-center w-[340px] px-1"
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
                  pathname.startsWith("/books")
                    ? "Search books..."
                    : "Search..."
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

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {pathname.startsWith("/books") && searchQuery.trim() && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-4 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col max-h-[60vh] overflow-y-auto z-50"
                  >
                    {isSearchingBooks ? (
                      <div className="p-8 flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span className="text-xs">Searching library...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {searchResults.map((book) => (
                          <Link
                            key={book.id}
                            href={`/book/${book.id}`}
                            onClick={() => {
                              setIsSearching(false);
                              setSearchQuery("");
                            }}
                            className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-xl transition-colors group"
                          >
                            <div className="relative w-10 h-14 shrink-0 rounded-md overflow-hidden shadow-md bg-white/5">
                              <Image
                                src={book.coverImage}
                                alt={book.title}
                                fill
                                className="object-cover transition-transform group-hover:scale-110"
                                sizes="40px"
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium text-foreground truncate group-hover:text-white transition-colors">
                                {book.title}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {book.author}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        No books found
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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
