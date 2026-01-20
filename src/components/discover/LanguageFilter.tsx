"use client";

interface LanguageFilterProps {
  value?: string;
  onChange: (language?: string) => void;
}

const LANGUAGES = [
  { code: "", name: "All Languages" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "hi", name: "Hindi" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
];

export default function LanguageFilter({
  value,
  onChange,
}: LanguageFilterProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider">
        Original Language
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full bg-surface border border-border/50 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all duration-200 cursor-pointer hover:bg-surface-hover shadow-sm btn-press"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
