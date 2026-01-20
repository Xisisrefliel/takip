import { ProviderLinkParams } from "@/types";

/**
 * Format a title for use in search URLs
 */
function formatSearchQuery(title: string): string {
  return encodeURIComponent(title);
}

/**
 * Provider URL generators
 * Each function returns a search URL for the specified provider
 */
const providerUrlGenerators: Record<
  number,
  (params: ProviderLinkParams) => string
> = {
  // Netflix (ID: 8)
  8: ({ title }) =>
    `https://www.netflix.com/search?q=${formatSearchQuery(title)}`,

  // Amazon Prime Video (ID: 9, 119)
  9: ({ title }) =>
    `https://www.amazon.com/s?k=${formatSearchQuery(title)}&i=instant-video`,
  119: ({ title }) =>
    `https://www.amazon.com/s?k=${formatSearchQuery(title)}&i=instant-video`,

  // Hulu (ID: 15)
  15: ({ title }) =>
    `https://www.hulu.com/search?q=${formatSearchQuery(title)}`,

  // YouTube (ID: 192)
  192: ({ title, mediaType }) => {
    const searchTerm = mediaType === 'movie'
      ? `${title} full movie`
      : `${title} episodes`;
    return `https://www.youtube.com/results?search_query=${formatSearchQuery(searchTerm)}`;
  },

  // Crunchyroll (ID: 283)
  283: ({ title }) =>
    `https://www.crunchyroll.com/search?q=${formatSearchQuery(title)}`,

  // Disney Plus (ID: 337)
  337: ({ title }) =>
    `https://www.disneyplus.com/search?q=${formatSearchQuery(title)}`,

  // Apple TV Plus (ID: 350)
  350: ({ title }) =>
    `https://tv.apple.com/search?q=${formatSearchQuery(title)}`,

  // Max / HBO Max (ID: 384)
  384: ({ title }) =>
    `https://www.max.com/search?q=${formatSearchQuery(title)}`,

  // Peacock (ID: 387)
  387: ({ title }) =>
    `https://www.peacocktv.com/search?q=${formatSearchQuery(title)}`,

  // Paramount Plus (ID: 531)
  531: ({ title }) =>
    `https://www.paramountplus.com/search/?query=${formatSearchQuery(title)}`,

  // Showtime (ID: 37)
  37: ({ title }) =>
    `https://www.showtime.com/search?q=${formatSearchQuery(title)}`,

  // Starz (ID: 43)
  43: ({ title }) =>
    `https://www.starz.com/search?query=${formatSearchQuery(title)}`,

  // AMC+ (ID: 526)
  526: ({ title }) =>
    `https://www.amcplus.com/search?q=${formatSearchQuery(title)}`,

  // Vudu (ID: 7)
  7: ({ title }) =>
    `https://www.vudu.com/content/movies/search/${formatSearchQuery(title)}`,
};

/**
 * Get a provider link for a given media item
 * Returns null if the provider is not supported
 */
export function getProviderLink(params: ProviderLinkParams): string | null {
  const generator = providerUrlGenerators[params.providerId];

  if (!generator) {
    return null;
  }

  try {
    return generator(params);
  } catch (error) {
    console.error(`Error generating provider link for ${params.providerName}:`, error);
    return null;
  }
}
