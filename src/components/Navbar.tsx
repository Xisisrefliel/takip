"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Search, X, Book as BookIcon, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useLastVisited } from "@/context/LastVisitedContext";
import { useMedia } from "@/context/MediaContext";
import { useState, useRef, useEffect } from "react";
import { AuthButton } from "@/components/AuthButton";
import { SearchResults } from "@/components/SearchResults";
import { createPortal } from "react-dom";

export function Navbar() {
  const pathname = usePathname();
  const { mediaType, setMediaType } = useMedia();
  const CurrentIcon = mediaType === "books" ? BookIcon : Film;
  const { lastVisited } = useLastVisited();
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"movies" | "series" | "books">("movies");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hasMounted, setHasMounted] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = stored === "dark" || (!stored && prefersDark) ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.classList.add(initialTheme);
    setHasMounted(true);
  }, []);

  const applyTheme = (next: "light" | "dark") => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(next);
    localStorage.setItem("theme", next);
  };

  const handleToggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  useEffect(() => {
    if (pathname.startsWith("/books") || pathname.startsWith("/book/")) {
      setMediaType("books");
      setSearchType("books");
    } else if (pathname.startsWith("/tv/")) {
      setMediaType("movies");
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
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideNav = navRef.current && !navRef.current.contains(event.target as Node);
      const isOutsideSearch = searchContainerRef.current ? !searchContainerRef.current.contains(event.target as Node) : true;

      if (isOutsideNav && isOutsideSearch && isSearching) {
        setIsSearching(false);
        setSearchQuery("");
      }

      const isInsideDropdownButton = dropdownButtonRef.current?.contains(event.target as Node);
      const isInsideDropdown = dropdownRef.current?.contains(event.target as Node);
      if (!isInsideDropdownButton && !isInsideDropdown && isDropdownOpen) {
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

  useEffect(() => {
    if (!isDropdownOpen) return;
    const updatePosition = () => {
      const btn = dropdownButtonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      setDropdownCoords({ top: rect.top, left: rect.left });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isDropdownOpen]);

  const isDetailPage =
    pathname.startsWith("/movie/") ||
    pathname.startsWith("/tv/") ||
    pathname.startsWith("/book/");

  const activeTab = pathname.startsWith("/profile")
    ? "library"
    : pathname === "/" || pathname === "/books"
      ? "discover"
      : null;

  return (
    <>
      <div className="fixed top-4 sm:top-6 left-0 right-0 z-50 flex justify-center px-2 sm:px-4 pointer-events-none">
        <motion.nav
          ref={navRef}
          className={cn(
            "pointer-events-auto flex items-center p-1 sm:p-1.5",
            "bg-white/60 dark:bg-black/60 backdrop-blur-2xl",
            "border border-white/20 dark:border-white/10",
            "rounded-full shadow-2xl shadow-black/20 transition-all duration-300 max-w-full",
            isSearching ? "ring-2 ring-accent/30 border-accent/20 shadow-black/25" : ""
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
                className="relative flex items-center w-full sm:w-[340px] px-1 min-w-0"
              >
                <motion.div
                  className="flex items-center flex-1 min-w-0"
                  initial={{ filter: "blur(4px)" }}
                  animate={{ filter: "blur(0px)" }}
                  exit={{ filter: "blur(4px)" }}
                >
                  <Search
                    size={18}
                    className="text-foreground/60 mr-2 sm:mr-3 shrink-0 ml-1 sm:ml-2"
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
                    className="flex-1 bg-transparent border-none outline-none text-sm h-9 sm:h-10 placeholder:text-foreground/40 text-foreground min-w-0"
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
                className="flex items-center gap-0.5 sm:gap-1 md:gap-2 min-w-0 flex-1"
              >
                <div className="relative mr-0.5 sm:mr-1 shrink-0">
                  <motion.div
                    ref={dropdownButtonRef}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/12 dark:bg-white/8 text-foreground cursor-pointer border border-transparent hover:border-white/10"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  >
                    <CurrentIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </motion.div>
                </div>

                <div
                  className="flex items-center bg-black/5 dark:bg-white/5 rounded-full border border-black/8 dark:border-white/8 px-0.5 sm:px-1 py-0.5 sm:py-1 relative shrink-0 backdrop-blur-md"
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  <NavPill
                    href={mediaType === "books" ? "/books" : "/"}
                    active={activeTab === "discover"}
                    hoveredLink={hoveredLink}
                    setHoveredLink={setHoveredLink}
                    prefetch
                  >
                    Discover
                  </NavPill>
                  <NavPill
                    href="/profile"
                    active={activeTab === "library"}
                    hoveredLink={hoveredLink}
                    setHoveredLink={setHoveredLink}
                    prefetch
                  >
                    Library
                  </NavPill>
                </div>

                {lastVisited && (
                  <>
                    <div className="h-4 sm:h-5 w-px bg-border/50 mx-0.5 sm:mx-1 shrink-0 hidden sm:block" />
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
                      className="shrink min-w-0 hidden md:block"
                    >
                      <Link
                        href={isDetailPage ? pathname : lastVisited?.href || ""}
                        className={cn(
                          "px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors rounded-full hover:text-foreground flex items-center gap-1 sm:gap-2",
                          isDetailPage || pathname === lastVisited?.href
                            ? "text-foreground"
                            : "text-foreground/60"
                        )}
                        onMouseEnter={() => setHoveredLink(lastVisited.href)}
                        prefetch
                      >
                        <span className="max-w-[80px] sm:max-w-[120px] md:max-w-[150px] truncate">
                          {isDetailPage && lastVisited?.href !== pathname
                            ? "Details"
                            : lastVisited?.title}
                        </span>
                      </Link>
                    </motion.div>
                  </>
                )}

                <div className="flex items-center pl-1 sm:pl-2 border-l border-black/8 dark:border-white/10 gap-0.5 sm:gap-1 shrink-0 ml-0.5 sm:ml-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleToggleTheme}
                    aria-label="Toggle theme"
                    className={cn(
                      "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center",
                      "border border-black/8 dark:border-white/10 bg-black/5 dark:bg-white/6",
                      "hover:bg-black/8 dark:hover:bg-white/10 transition-colors",
                      "text-foreground/80 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center justify-center">
                      {hasMounted && theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
                    </div>
                  </motion.button>
                  <button
                    onClick={() => setIsSearching(true)}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-foreground/70 hover:text-foreground bg-black/5 hover:bg-black/8 dark:bg-white/5 dark:hover:bg-white/10 transition-colors shrink-0 border border-black/8 dark:border-white/8"
                  >
                    <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                  <div className="shrink-0">
                    <AuthButton />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      </div>

      {hasMounted &&
        createPortal(
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                key="media-dropdown"
                ref={dropdownRef}
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  position: "fixed",
                  top: dropdownCoords.top,
                  left: dropdownCoords.left,
                  minWidth: 192,
                }}
                className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-2xl shadow-2xl shadow-black/20 p-1.5 z-200 origin-top-left overflow-hidden"
              >
                <div className="flex flex-col gap-1">
                  <Link
                    href="/"
                    className="flex items-center gap-3 p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors text-sm font-medium text-foreground/80 hover:text-foreground"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <Film size={14} />
                    </div>
                    Movies & Series
                  </Link>
                  <Link
                    href="/books"
                    className="flex items-center gap-3 p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors text-sm font-medium text-foreground/80 hover:text-foreground"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <BookIcon size={14} />
                    </div>
                    Books
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      <AnimatePresence>
        {isSearching && searchQuery.trim() && (
          <motion.div
            ref={searchContainerRef}
            key="search-results-container"
            className="fixed top-[72px] sm:top-[80px] left-0 right-0 z-40 flex justify-center pointer-events-none px-2 sm:px-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <SearchResults
              query={searchQuery}
              activeTab={searchType}
              onTabChange={setSearchType}
              onClose={() => {
                setIsSearching(false);
                setSearchQuery("");
              }}
            />
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
  prefetch = false,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  hoveredLink: string | null;
  setHoveredLink: (href: string | null) => void;
  prefetch?: boolean;
}) {
  return (
    <Link
      draggable="false"
      href={href}
      onMouseEnter={() => setHoveredLink(href)}
      prefetch={prefetch}
      className={cn(
        "relative px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
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
