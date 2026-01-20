"use client";

interface RuntimeFilterProps {
  runtimeGte?: number;
  runtimeLte?: number;
  onChange: (runtimeGte?: number, runtimeLte?: number) => void;
}

export default function RuntimeFilter({
  runtimeGte,
  runtimeLte,
  onChange,
}: RuntimeFilterProps) {
  const handlePreset = (preset: "short" | "standard" | "long" | "clear") => {
    switch (preset) {
      case "short":
        onChange(undefined, 90);
        break;
      case "standard":
        onChange(90, 120);
        break;
      case "long":
        onChange(120, undefined);
        break;
      case "clear":
        onChange(undefined, undefined);
        break;
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider">
        Runtime (minutes)
      </label>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handlePreset("short")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 btn-press ${
            runtimeLte === 90 && !runtimeGte
              ? "bg-foreground text-background shadow-sm"
              : "bg-surface border border-border/30 text-foreground/60 hover:bg-surface-hover hover:text-foreground hover:border-border"
          }`}
        >
          Short (&lt;90)
        </button>
        <button
          onClick={() => handlePreset("standard")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 btn-press ${
            runtimeGte === 90 && runtimeLte === 120
              ? "bg-foreground text-background shadow-sm"
              : "bg-surface border border-border/30 text-foreground/60 hover:bg-surface-hover hover:text-foreground hover:border-border"
          }`}
        >
          Standard (90-120)
        </button>
        <button
          onClick={() => handlePreset("long")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 btn-press ${
            runtimeGte === 120 && !runtimeLte
              ? "bg-foreground text-background shadow-sm"
              : "bg-surface border border-border/30 text-foreground/60 hover:bg-surface-hover hover:text-foreground hover:border-border"
          }`}
        >
          Long (&gt;120)
        </button>
        {(runtimeGte || runtimeLte) && (
          <button
            onClick={() => handlePreset("clear")}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface border border-border/30 text-foreground/60 hover:bg-surface-hover hover:text-foreground hover:border-border transition-all duration-200 btn-press"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Min"
          value={runtimeGte || ""}
          onChange={(e) =>
            onChange(
              e.target.value ? Number(e.target.value) : undefined,
              runtimeLte
            )
          }
          className="flex-1 bg-surface border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all shadow-sm"
        />
        <input
          type="number"
          placeholder="Max"
          value={runtimeLte || ""}
          onChange={(e) =>
            onChange(
              runtimeGte,
              e.target.value ? Number(e.target.value) : undefined
            )
          }
          className="flex-1 bg-surface border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all shadow-sm"
        />
      </div>
    </div>
  );
}
