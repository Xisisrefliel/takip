"use client";

import { RatingStat } from "../actions";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = {
  data?: RatingStat[];
};

const renderTooltip = ({ active, payload }: { active?: boolean; payload?: readonly { payload: RatingStat }[] }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as RatingStat;
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/90 backdrop-blur-2xl px-4 py-3 text-xs shadow-xl">
      <div className="font-semibold text-foreground">{item.rating} ★</div>
      <div className="text-foreground/60 mt-1">{item.count} ratings</div>
    </div>
  );
};

export function RatingDistribution({ data }: Props) {
  if (!data || data.length === 0) return null;

  const prepared = data.map((item) => ({ ...item, label: `${item.rating}★` }));

  return (
    <div className="h-56 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={prepared} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="currentColor" strokeDasharray="3 3" className="text-black/10 dark:text-white/10" />
          <XAxis dataKey="label" tick={{ fill: "currentColor", fontSize: 11 }} className="text-foreground/40" axisLine={false} tickLine={false} />
          <YAxis width={28} tick={{ fill: "currentColor", fontSize: 11 }} className="text-foreground/40" axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={renderTooltip} cursor={{ fill: "rgba(0,0,0,0.05)", className: "dark:fill-white/5" }} />
          <Bar dataKey="count" fill="currentColor" className="text-foreground/80" radius={[8, 8, 6, 6]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
