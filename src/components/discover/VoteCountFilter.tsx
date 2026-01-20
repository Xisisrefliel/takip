"use client";

interface VoteCountFilterProps {
  value?: number;
  onChange: (minVotes?: number) => void;
}

const VOTE_PRESETS = [
  { value: undefined, label: "All" },
  { value: 500, label: "Mainstream (500+)" },
  { value: 1000, label: "Popular (1000+)" },
  { value: 5000, label: "Very Popular (5000+)" },
];

export default function VoteCountFilter({
  value,
  onChange,
}: VoteCountFilterProps) {
  const handlePreset = (preset: number | undefined) => {
    onChange(preset);
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider">
        Popularity Threshold
      </label>
      <div className="flex flex-wrap gap-2">
        {VOTE_PRESETS.map((preset) => {
          const isSelected = value === preset.value;
          return (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 btn-press ${
                isSelected
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-surface border border-border/30 text-foreground/60 hover:bg-surface-hover hover:text-foreground hover:border-border"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <input
        type="number"
        placeholder="Custom threshold"
        value={value || ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : undefined)
        }
        className="w-full bg-surface border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all shadow-sm"
      />
    </div>
  );
}
