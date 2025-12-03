"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { WatchProvidersData } from "@/types";

interface WatchProvidersProps {
  providers: Record<string, WatchProvidersData> | null;
}

const REGION_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  JP: "Japan",
  KR: "South Korea",
  BR: "Brazil",
  MX: "Mexico",
  IN: "India",
  TR: "Turkey",
  NL: "Netherlands",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  RU: "Russia",
  PT: "Portugal",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  PE: "Peru",
  CH: "Switzerland",
  BE: "Belgium",
  AT: "Austria",
  IE: "Ireland",
  NZ: "New Zealand",
  ZA: "South Africa",
};

export function WatchProviders({ providers }: WatchProvidersProps) {
  const [selectedRegion, setSelectedRegion] = useState("US");

  const availableRegions = useMemo(() => {
    if (!providers) return [];
    return Object.keys(providers).sort((a, b) => {
      const nameA = REGION_NAMES[a] || a;
      const nameB = REGION_NAMES[b] || b;
      return nameA.localeCompare(nameB);
    });
  }, [providers]);

  if (!providers || availableRegions.length === 0) {
    return null;
  }

  const currentRegion = providers[selectedRegion]
    ? selectedRegion
    : availableRegions[0];
  const data = providers[currentRegion];

  if (!data) return null;

  const hasProviders =
    (data.flatrate?.length ?? 0) > 0 ||
    (data.rent?.length ?? 0) > 0 ||
    (data.buy?.length ?? 0) > 0;

  if (!hasProviders) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <div className="relative">
            <select
              value={currentRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="appearance-none bg-surface border border-border rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              {availableRegions.map((region) => (
                <option key={region} value={region}>
                  {REGION_NAMES[region] || region}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <svg
                width="10"
                height="6"
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
        <p className="text-muted-foreground text-sm">
          No streaming information available for this region.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <select
            value={currentRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="appearance-none bg-surface border border-border rounded-lg px-3 py-1.5 pr-8 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer w-full sm:w-auto sm:min-w-[140px]"
          >
            {availableRegions.map((region) => (
              <option key={region} value={region} className="bg-background">
                {REGION_NAMES[region] || region}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <svg
              width="10"
              height="6"
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

      <div className="space-y-4 sm:space-y-6">
        {data.flatrate && data.flatrate.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Stream
            </h4>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {data.flatrate.map((provider) => (
                <div
                  key={provider.provider_id}
                  className="relative group"
                  title={provider.provider_name}
                >
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-white/10 group-hover:scale-110 transition-transform duration-300">
                    <Image
                      src={provider.logo_path}
                      alt={provider.provider_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 40px, 48px"
                    />
                  </div>
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {provider.provider_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.rent && data.rent.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Rent
            </h4>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {data.rent.map((provider) => (
                <div
                  key={provider.provider_id}
                  className="relative group"
                  title={provider.provider_name}
                >
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-white/10 group-hover:scale-110 transition-transform duration-300">
                    <Image
                      src={provider.logo_path}
                      alt={provider.provider_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 40px, 48px"
                    />
                  </div>
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {provider.provider_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.buy && data.buy.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Buy
            </h4>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {data.buy.map((provider) => (
                <div
                  key={provider.provider_id}
                  className="relative group"
                  title={provider.provider_name}
                >
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-white/10 group-hover:scale-110 transition-transform duration-300">
                    <Image
                      src={provider.logo_path}
                      alt={provider.provider_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 40px, 48px"
                    />
                  </div>
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {provider.provider_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
