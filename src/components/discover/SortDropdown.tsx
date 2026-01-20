"use client";

import { ArrowUpDown } from "lucide-react";

interface SortDropdownProps {
  value: string;
  onChange: (sortBy: string) => void;
}

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popularity ↓" },
  { value: "popularity.asc", label: "Popularity ↑" },
  { value: "release_date.desc", label: "Release Date ↓" },
  { value: "release_date.asc", label: "Release Date ↑" },
  { value: "vote_average.desc", label: "Rating ↓" },
  { value: "vote_average.asc", label: "Rating ↑" },
];

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-surface border border-border/50 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer transition-all duration-200 hover:bg-surface-hover hover:border-border shadow-sm btn-press"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 pointer-events-none transition-colors" />
    </div>
  );
}
