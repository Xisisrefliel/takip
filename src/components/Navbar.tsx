"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, User, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Navbar() {
  const pathname = usePathname();

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-2 p-1.5 bg-surface/70 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-full shadow-lg shadow-black/5">
        
        <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-accent-foreground hover:scale-105 transition-transform">
          <Film size={18} strokeWidth={2.5} />
        </Link>

        <div className="flex items-center px-2">
          <NavLink href="/" active={pathname === "/"}>Discover</NavLink>
          <NavLink href="/profile" active={pathname.startsWith("/profile")}>Library</NavLink>
        </div>

        <div className="flex items-center pl-2 border-l border-border/50 gap-1">
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-surface-hover transition-colors">
                <Search size={18} />
            </button>
            <Link href="/profile" className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-surface-hover transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center border border-white/10">
                    <User size={14} />
                </div>
            </Link>
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "relative px-5 py-2 text-sm font-medium transition-colors rounded-full",
        active ? "text-foreground" : "text-foreground/60 hover:text-foreground"
      )}
    >
      {active && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-0 bg-surface shadow-sm rounded-full"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </Link>
  );
}
