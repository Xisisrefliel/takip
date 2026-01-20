"use client";

import { STREAMING_PROVIDERS, PROVIDER_REGIONS } from "@/data/providers";
import Image from "next/image";

interface ProviderFilterProps {
  selectedProviders: number[];
  region?: string;
  onChange: (providers: number[], region?: string) => void;
}

export default function ProviderFilter({
  selectedProviders,
  region,
  onChange,
}: ProviderFilterProps) {
  const toggleProvider = (providerId: number) => {
    const newProviders = selectedProviders.includes(providerId)
      ? selectedProviders.filter((id) => id !== providerId)
      : [...selectedProviders, providerId];
    onChange(newProviders, region || "US");
  };

  const handleRegionChange = (newRegion: string) => {
    onChange(selectedProviders, newRegion);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider">
          Streaming
          {selectedProviders.length > 0 && (
            <span className="ml-2 text-foreground font-semibold">
              ({selectedProviders.length})
            </span>
          )}
        </label>
        <div className="relative">
          <select
            value={region || "US"}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="appearance-none bg-surface border border-border/50 rounded-lg px-2.5 py-1 pr-7 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer transition-all duration-200 hover:bg-surface-hover shadow-sm btn-press"
          >
            {PROVIDER_REGIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/50 transition-colors">
            <svg
              width="8"
              height="5"
              viewBox="0 0 10 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L5 5L9 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {STREAMING_PROVIDERS.slice(0, 9).map((provider) => {
          const isSelected = selectedProviders.includes(provider.id);
          return (
            <button
              key={provider.id}
              onClick={() => toggleProvider(provider.id)}
              className={`relative w-11 h-11 rounded-xl overflow-hidden shadow-sm border transition-all duration-200 btn-press ${
                isSelected
                  ? "border-foreground ring-2 ring-foreground/20"
                  : "border-border/30 hover:border-border hover:scale-105"
              }`}
              title={provider.name}
            >
              <Image
                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                alt={provider.name}
                fill
                unoptimized
                className="object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
