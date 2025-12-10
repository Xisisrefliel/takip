"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User, LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import Image from "next/image";

export function AuthButton() {
  const router = useRouter();
  const { data: sessionData, status, update } = useSession();
  const session = sessionData ? { user: sessionData.user } : null;
  const isLoading = status === "loading";
  const hasMounted = typeof document !== "undefined";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideButton = menuRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);
      if (!isInsideButton && !isInsideDropdown) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recompute dropdown position when opened / on resize / scroll
  useEffect(() => {
    if (!isMenuOpen) return;
    const updatePosition = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const width = 240; // px, matches w-60
      const left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.right - width));
      const top = rect.bottom + 8; // navbar is fixed; use viewport coords
      setMenuCoords({ top, left });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isMenuOpen]);

  const handleSignOut = async () => {
    await signOutAction();
    await update?.();
    router.refresh();
    setIsMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full">
        <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-foreground/20 border-t-foreground/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="relative" ref={menuRef}>
        <motion.button
          ref={buttonRef}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className={cn(
            "relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden transition-shadow",
            "ring-1 ring-white/20 hover:ring-white/40",
            isMenuOpen ? "ring-white/40 shadow-md" : ""
          )}
          title="Account"
        >
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              fill
              sizes="40px"
              className="object-cover"
              priority={false}
            />
          ) : (
             <div className="w-full h-full bg-linear-to-tr from-stone-200 to-stone-100 dark:from-stone-700 dark:to-stone-600 flex items-center justify-center">
               <User size={14} className="text-foreground/70" />
             </div>
          )}
        </motion.button>

        {hasMounted &&
          createPortal(
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  key="user-dropdown"
                  ref={dropdownRef}
                  initial={{ opacity: 0, scale: 0.95, y: 0 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 0 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  style={{
                    position: "fixed",
                    top: menuCoords.top,
                    left: menuCoords.left,
                    width: 240,
                  }}
                  className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-2xl shadow-2xl shadow-black/20 p-1.5 z-[200] origin-top-right overflow-hidden"
                >
                  <div className="px-3 py-2.5 mb-1 border-b border-black/5 dark:border-white/10">
                    <p className="text-sm font-semibold text-foreground/90 truncate">
                      {session.user.name || "Traveler"}
                    </p>
                    <p className="text-[11px] text-foreground/50 truncate font-medium">
                      {session.user.email}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 p-1">
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <User size={15} />
                      <span>Profile</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>Settings</span>
                    </Link>

                    <div className="h-px bg-black/5 dark:bg-white/10 my-1 mx-1" />

                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-red-600/80 dark:text-red-400/80 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
                    >
                      <LogOut size={15} />
                      <span>Log out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-foreground/70 hover:text-foreground bg-surface/80 hover:bg-surface-hover transition-colors border border-border/60 shadow-sm"
      title="Sign in"
    >
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-linear-to-tr from-white to-surface-hover dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center border border-border/70 shadow-inner">
        <User size={12} className="sm:w-[14px] sm:h-[14px] text-foreground/70" />
      </div>
    </Link>
  );
}
