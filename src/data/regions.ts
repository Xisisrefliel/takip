// Use Intl.DisplayNames to get country names from ISO codes dynamically
const regionDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });

export function getRegionLabel(code: string): string {
  try {
    return regionDisplayNames.of(code.toUpperCase()) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export const DEFAULT_REGION = "US";

// Common regions for settings dropdown - curated list of regions with good TMDB coverage
export const COMMON_REGIONS = [
  "US", "GB", "CA", "AU", "NZ", // English-speaking
  "DE", "FR", "IT", "ES", "PT", "NL", "BE", "AT", "CH", // Western Europe
  "SE", "NO", "DK", "FI", // Nordic
  "PL", "CZ", "HU", "RO", "GR", "TR", // Central/Eastern Europe
  "BR", "MX", "AR", "CL", "CO", // Latin America
  "JP", "KR", "IN", "SG", "PH", "TH", "MY", "ID", // Asia
  "ZA", "EG", "NG", // Africa
  "AE", "SA", "IL", // Middle East
  "IE", "RU", "UA",
];

// Featured regions shown first in dropdowns
export const FEATURED_REGION_ORDER = [
  "US",
  "GB",
  "CA",
  "AU",
  "DE",
  "FR",
  "IT",
  "ES",
  "BR",
  "MX",
  "IN",
  "JP",
  "KR",
  "NL",
  "SE",
  "NZ",
  "IE",
  "BE",
  "PT",
  "SG",
];

export function sortRegionsWithPreference(
  regions: string[],
  preferred?: string | null
): string[] {
  const normalizedPreferred = preferred?.toUpperCase();

  const priority = new Map<string, number>();

  if (normalizedPreferred) {
    priority.set(normalizedPreferred, -1);
  }

  FEATURED_REGION_ORDER.forEach((code, index) => {
    if (!priority.has(code)) {
      priority.set(code, index);
    }
  });

  return [...regions]
    .map((code) => code.toUpperCase())
    .sort((a, b) => {
      const scoreA = priority.has(a) ? priority.get(a)! : 999;
      const scoreB = priority.has(b) ? priority.get(b)! : 999;
      if (scoreA !== scoreB) return scoreA - scoreB;
      const nameA = getRegionLabel(a);
      const nameB = getRegionLabel(b);
      return nameA.localeCompare(nameB);
    });
}
