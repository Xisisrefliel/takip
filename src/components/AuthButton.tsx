"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AuthButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<{
    user: { email: string; name?: string | null };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setSession(data?.user ? { user: data.user } : null);
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Refetch session when pathname changes (e.g., after login redirect)
  useEffect(() => {
    // Small delay to ensure session cookie is set after redirect
    const timer = setTimeout(() => {
      fetchSession();
    }, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Listen for various events that indicate auth state might have changed
  useEffect(() => {
    const handleStorageChange = () => {
      fetchSession();
    };

    const handleFocus = () => {
      // Refetch when window regains focus
      fetchSession();
    };

    const handlePageShow = () => {
      // Refetch after page navigation (including redirects and back/forward)
      fetchSession();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const handleSignOut = async () => {
    await signOutAction();
    setSession(null);
    router.refresh();
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
      <div className="flex items-center gap-0.5 sm:gap-1">
        <Link
          href="/profile"
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-linear-to-tr from-gray-200 to-gray-100 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center border border-white/10">
            <User size={12} className="sm:w-[14px] sm:h-[14px]" />
          </div>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-surface-hover transition-colors"
          title="Sign out"
        >
          <LogOut size={14} className="sm:w-4 sm:h-4" />
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-surface-hover transition-colors"
      title="Sign in"
    >
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-linear-to-tr from-gray-200 to-gray-100 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center border border-white/10">
        <User size={12} className="sm:w-[14px] sm:h-[14px]" />
      </div>
    </Link>
  );
}
