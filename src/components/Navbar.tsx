"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, User, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-white/5">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors">
          <Film size={20} />
          <span className="font-serif text-lg font-bold tracking-tight">takip</span>
        </Link>

        <div className="hidden md:flex items-center gap-1 bg-surface/50 p-0.5 rounded-full border border-white/5">
           <NavLink href="/" active={pathname === "/"}>Discover</NavLink>
           <NavLink href="/profile" active={pathname === "/profile"}>Library</NavLink>
        </div>

        <div className="flex items-center gap-3">
            <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-foreground/70 hover:text-foreground">
                <Search size={18} />
            </button>
            <Link href="/profile" className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-foreground/70 hover:text-foreground md:hidden">
                <User size={18} />
            </Link>
            <div className="hidden md:block w-7 h-7 bg-linear-to-br from-accent to-purple-600 rounded-full" />
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm transition-all",
        active 
          ? "bg-background text-foreground shadow-sm" 
          : "text-foreground/60 hover:text-foreground hover:bg-white/5"
      )}
    >
      {children}
    </Link>
  );
}

