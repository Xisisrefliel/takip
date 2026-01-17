// Mood definitions (shared between client and server)
// Icons are added in the client component

export const MOOD_IDS = [
  "uplifting",
  "mind-bending",
  "dark-intense",
  "feel-good",
  "adrenaline",
  "thought-provoking",
  "classic",
] as const;

export type MoodId = typeof MOOD_IDS[number];

export const MOOD_LABELS: Record<MoodId, string> = {
  "uplifting": "Uplifting",
  "mind-bending": "Mind-Bending",
  "dark-intense": "Dark & Intense",
  "feel-good": "Feel-Good",
  "adrenaline": "Adrenaline",
  "thought-provoking": "Thought-Provoking",
  "classic": "Classic",
};
