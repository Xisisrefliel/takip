"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function StatsCard({ title, subtitle, icon, children, className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "flex h-full w-full flex-col gap-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/60 p-6 sm:p-8",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-foreground/60 border border-black/10 dark:border-white/10">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-foreground/50 mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </motion.div>
  );
}
