"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, User, Search, X, Book } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useLastVisited } from "@/context/LastVisitedContext";
import { useState, useRef, useEffect } from "react";

export function Navbar() {
  const pathname = usePathname();
  const CurrentIcon = pathname.startsWith("/books") ? Book : Film;
  const { lastVisited } = useLastVisited();
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        navRef.current &&
        !navRef.current.contains(event.target as Node) &&
        isSearching
      ) {
        setIsSearching(false);
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
      // Focus after animation starts/completes
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSearching]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearching) {
        setIsSearching(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearching(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearching]);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.nav
        ref={navRef}
        layout
        className={cn(
          "pointer-events-auto flex items-center p-1.5 bg-surface/70 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-full shadow-lg shadow-black/5",
          isSearching ? "ring-2 ring-white/20 border-transparent" : ""
        )}
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
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
                opacity: { duration: 0.2 }
              }}
              className="flex items-center w-[340px] px-1"
            >
              <Search size={18} className="text-foreground/60 mr-3 shrink-0 ml-2" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent border-none outline-none text-sm h-10 placeholder:text-foreground/40 text-foreground min-w-0"
              />
              <div className="flex items-center gap-1 ml-1">
                <div className="hidden sm:flex items-center px-1.5 py-0.5 rounded-md bg-foreground/5 text-[10px] font-medium text-foreground/40 mr-1">
                  ESC
                </div>
                <button
                  onClick={() => setIsSearching(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover text-foreground/60 hover:text-foreground transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="nav-content"
              layout="position"
              initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(4px)" }}
              transition={{ 
                type: "spring",
                bounce: 0.2,
                duration: 0.5,
                opacity: { duration: 0.2 }
              }}
              className="flex items-center gap-2"
            >
              <div className="relative" ref={dropdownRef}>
                {/* Placeholder to maintain layout space */}
                <div className="w-10 h-10" />

                <motion.div
                  layout
                  className={cn(
                    "absolute top-0 left-0 z-50 flex flex-col bg-accent text-accent-foreground overflow-hidden cursor-pointer",
                    isDropdownOpen
                      ? "w-48 shadow-xl border border-white/10 p-1.5 items-stretch justify-start"
                      : "w-10 h-10 shadow-none border border-transparent p-0 items-center justify-center"
                  )}
                  style={{
                    borderRadius: 24,
                  }}
                  onClick={() => !isDropdownOpen && setIsDropdownOpen(true)}
                  whileHover={!isDropdownOpen ? { scale: 1.05 } : {}}
                  whileTap={!isDropdownOpen ? { scale: 0.95 } : {}}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                >
                  <AnimatePresence mode="popLayout" initial={false} presenceAffectsLayout={false}>
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
                            <Book size={14} />
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

              <div className="flex items-center px-2 shrink-0">
                <NavLink 
                  href="/" 
                  active={pathname === "/"} 
                  hoveredLink={hoveredLink}
                  setHoveredLink={setHoveredLink}
                >
                  Discover
                </NavLink>
                <NavLink
                  href="/profile"
                  active={pathname.startsWith("/profile")}
                  hoveredLink={hoveredLink}
                  setHoveredLink={setHoveredLink}
                >
                  Library
                </NavLink>
                {lastVisited && (
                  <>
                    <div className="h-4 w-px bg-white/10 mx-1" />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={lastVisited.href}
                    >
                      <NavLink
                        href={lastVisited.href}
                        active={pathname === lastVisited.href}
                        hoveredLink={hoveredLink}
                        setHoveredLink={setHoveredLink}
                      >
                        <span className="max-w-[120px] truncate block">
                          {lastVisited.title}
                        </span>
                      </NavLink>
                    </motion.div>
                  </>
                )}
              </div>

              <div className="flex items-center pl-2 border-l border-border/50 gap-1 shrink-0">
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

function NavLink({
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
      href={href}
      onMouseEnter={() => setHoveredLink(href)}
      draggable="false"
      className={cn(
        "relative flex items-center justify-center px-5 py-2 text-sm font-medium transition-colors rounded-full whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
        active ? "text-background" : "text-foreground/60 hover:text-foreground"
      )}
      style={{ userSelect: "none" }}
    >
      {active && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-0 bg-foreground shadow-sm rounded-full z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          style={{ willChange: "transform, opacity" }}
        />
      )}
      <AnimatePresence>
        {hoveredLink === href && !active && (
          <motion.div
            layoutId="nav-hover"
            className="absolute inset-0 bg-surface-hover rounded-full z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ willChange: "transform, opacity" }}
          />
        )}
      </AnimatePresence>
      <span className="relative z-10 mix-blend-normal">{children}</span>
    </Link>
  );
}
