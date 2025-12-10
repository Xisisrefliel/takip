export const REGION_LABELS: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  BE: "Belgium",
  BR: "Brazil",
  FI: "Finland",
  GG: "Guernsey",
  IN: "India",
  IE: "Ireland",
  IT: "Italy",
  MX: "Mexico",
  NL: "Netherlands",
  NZ: "New Zealand",
  PH: "Philippines",
  PT: "Portugal",
  SG: "Singapore",
  ES: "Spain",
  SE: "Sweden",
  DE: "Germany",
  FR: "France",
  TR: "Turkey",
  JP: "Japan",
  KR: "South Korea",
  NO: "Norway",
  DK: "Denmark",
  PL: "Poland",
  RU: "Russia",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  PE: "Peru",
  AT: "Austria",
  CH: "Switzerland",
  ZA: "South Africa",
};

export const DEFAULT_REGION = "US";

// Ordered using the user-requested lineup to keep the selector familiar.
export const FEATURED_REGION_ORDER = [
  "AU",
  "BE",
  "BR",
  "CA",
  "FI",
  "GG",
  "IN",
  "IE",
  "IT",
  "MX",
  "NL",
  "NZ",
  "PH",
  "PT",
  "SG",
  "ES",
  "SE",
  "GB",
  "US",
];

export const SUPPORTED_REGION_CODES = Object.keys(REGION_LABELS);

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
      const nameA = REGION_LABELS[a] || a;
      const nameB = REGION_LABELS[b] || b;
      return nameA.localeCompare(nameB);
    });
}
