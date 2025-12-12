"use client";

import { GenreStat } from "../actions";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, TooltipProps } from "recharts";

type Props = {
  data?: GenreStat[];
};

// Grayscale shades that work in both light and dark modes
const shades = [
  "#1a1a1a",
  "#2a2a2a",
  "#3a3a3a",
  "#4a4a4a",
  "#5a5a5a",
  "#6a6a6a",
  "#7a7a7a",
  "#8a8a8a",
];

const renderTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as GenreStat;
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/90 backdrop-blur-2xl px-4 py-3 text-xs shadow-xl">
      <div className="font-semibold text-foreground">{item.name}</div>
      <div className="text-foreground/60 mt-1">{item.count} films</div>
    </div>
  );
};

export function GenreChart({ data }: Props) {
  if (!data || data.length === 0) return null;
  const trimmed = data.slice(0, 8);

  return (
    <div className="w-full min-w-0">
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={trimmed}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              stroke="currentColor"
              className="stroke-black/10 dark:stroke-white/10"
            >
              {trimmed.map((_, idx) => (
                <Cell key={idx} fill={shades[idx % shades.length]} />
              ))}
            </Pie>
            <Tooltip content={renderTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 w-full min-w-0 flex flex-wrap gap-2 text-xs text-foreground/60">
        {trimmed.map((g, idx) => (
          <span
            key={g.name}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-2xl px-2.5 py-1"
          >
            <span className="h-2 w-2 rounded-full bg-foreground/60 shrink-0" style={{ opacity: 1 - (idx * 0.1) }} />
            <span className="whitespace-nowrap">{g.name} ({g.count})</span>
          </span>
        ))}
      </div>
    </div>
  );
}
