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
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex h-full w-full flex-col gap-6 rounded-2xl border border-black/8 dark:border-white/8",
        "bg-gradient-to-b from-white/80 to-white/60 dark:from-black/60 dark:to-black/40",
        "backdrop-blur-sm p-6 sm:p-8",
        "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_1px_rgba(255,255,255,0.05)]",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-foreground/50 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </motion.div>
  );
}
