"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { WatchProvidersData } from "@/types";
import {
  DEFAULT_REGION,
  REGION_LABELS,
  sortRegionsWithPreference,
} from "@/data/regions";
import { updatePreferredRegionAction } from "@/app/actions";

interface WatchProvidersProps {
  providers: Record<string, WatchProvidersData> | null;
  preferredRegion?: string | null;
  isAuthenticated?: boolean;
}

export function WatchProviders({
  providers,
  preferredRegion,
  isAuthenticated = false,
}: WatchProvidersProps) {
  const [, startTransition] = useTransition();
  const safeDefaultRegion = useMemo(() => {
    if (!providers) {
      return preferredRegion?.toUpperCase() || DEFAULT_REGION;
    }

    const normalizedPreferred = preferredRegion?.toUpperCase();
    if (normalizedPreferred && providers[normalizedPreferred]) {
      return normalizedPreferred;
    }

    if (providers[DEFAULT_REGION]) {
      return DEFAULT_REGION;
    }

    const firstRegion = Object.keys(providers)[0];
    return firstRegion || DEFAULT_REGION;
  }, [preferredRegion, providers]);

  const [selectedRegion, setSelectedRegion] = useState(safeDefaultRegion);
  const { update: updateSession } = useSession();

  // Keep labels deterministic between server and client to avoid hydration drift.
  const regionLabel = useMemo(
    () => (code: string) => REGION_LABELS[code.toUpperCase()] || code.toUpperCase(),
    []
  );

  const availableRegions = useMemo(() => {
    if (!providers) return [];
    return sortRegionsWithPreference(
      Object.keys(providers),
      selectedRegion || preferredRegion
    );
  }, [providers, preferredRegion, selectedRegion]);

  const handleRegionChange = (regionCode: string) => {
    const normalized = regionCode.toUpperCase();
    const previous = selectedRegion;
    setSelectedRegion(normalized);

    if (!isAuthenticated) return;

    startTransition(async () => {
      const result = await updatePreferredRegionAction(normalized);
      if (result?.error) {
        setSelectedRegion(previous);
        console.error(result.error);
        return;
      }

       try {
         await updateSession?.({
           preferredRegion: normalized,
         });
       } catch (error) {
         console.error("Failed to update session preference", error);
       }
    });
  };

  if (!providers || availableRegions.length === 0) {
    return null;
  }

  const currentRegion =
    providers && providers[selectedRegion] ? selectedRegion : safeDefaultRegion;
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
              onChange={(e) => handleRegionChange(e.target.value)}
              className="appearance-none bg-surface border border-border rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              {availableRegions.map((region) => (
                <option key={region} value={region}>
                  {regionLabel(region)}
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
            onChange={(e) => handleRegionChange(e.target.value)}
            className="appearance-none bg-surface border border-border rounded-lg px-3 py-1.5 pr-8 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer w-full sm:w-auto sm:min-w-[160px] shadow-[0_10px_40px_rgba(0,0,0,0.12)] hover:border-accent/50 transition-colors"
          >
            {availableRegions.map((region) => (
              <option key={region} value={region} className="bg-background">
                {regionLabel(region)}
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
                  className="relative"
                  title={provider.provider_name}
                >
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-white/10">
                    <Image
                      src={provider.logo_path}
                      alt={provider.provider_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 40px, 48px"
                    />
                  </div>
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
                  className="relative"
                  title={provider.provider_name}
                >
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-white/10">
                    <Image
                      src={provider.logo_path}
                      alt={provider.provider_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 40px, 48px"
                    />
                  </div>
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
                  className="relative"
                  title={provider.provider_name}
                >
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-white/10">
                    <Image
                      src={provider.logo_path}
                      alt={provider.provider_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 40px, 48px"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
