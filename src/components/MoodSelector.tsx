"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Flame, Heart, Zap, Lightbulb, Film, LucideIcon } from "lucide-react";
import { MOOD_IDS, MOOD_LABELS, type MoodId } from "@/lib/constants";

interface MoodSelectorProps {
  initialMood?: string;
  onMoodChange: (mood: string) => void;
  availableMoods?: string[]; // Only show these moods (if provided)
  className?: string;
}

// Map mood IDs to their icons (client-only)
const MOOD_ICONS: Record<MoodId, LucideIcon> = {
  "uplifting": Sparkles,
  "mind-bending": Brain,
  "dark-intense": Flame,
  "feel-good": Heart,
  "adrenaline": Zap,
  "thought-provoking": Lightbulb,
  "classic": Film,
};

// Combined mood data for the component
const MOODS = MOOD_IDS.map(id => ({
  id,
  label: MOOD_LABELS[id],
  icon: MOOD_ICONS[id],
}));

export function MoodSelector({
  initialMood,
  onMoodChange,
  availableMoods,
  className,
}: MoodSelectorProps) {
  const [selectedMood, setSelectedMood] = useState<MoodId | null>(null);
  const [hoveredMood, setHoveredMood] = useState<MoodId | null>(null);

  // Filter moods based on availableMoods prop
  const visibleMoods = availableMoods
    ? MOODS.filter((m) => availableMoods.includes(m.id))
    : MOODS;

  useEffect(() => {
    if (initialMood && visibleMoods.some((m) => m.id === initialMood)) {
      setSelectedMood(initialMood as MoodId);
    } else if (visibleMoods.length > 0) {
      setSelectedMood(visibleMoods[0].id);
    }
  }, [initialMood, visibleMoods]);

  const handleMoodSelect = useCallback(
    (moodId: MoodId) => {
      setSelectedMood(moodId);
      onMoodChange(moodId);
    },
    [onMoodChange]
  );

  if (selectedMood === null || visibleMoods.length === 0) {
    return (
      <div className={cn("flex gap-2 overflow-x-auto pb-2", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-24 bg-surface animate-pulse rounded-full"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2 sm:gap-3", className)}>
      <AnimatePresence mode="popLayout">
        {visibleMoods.map((mood) => {
          const Icon = mood.icon;
          const isSelected = selectedMood === mood.id;
          const isHovered = hoveredMood === mood.id;

          return (
            <button
              key={mood.id}
              onClick={() => handleMoodSelect(mood.id)}
              onMouseEnter={() => setHoveredMood(mood.id)}
              onMouseLeave={() => setHoveredMood(null)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 outline-none",
                isSelected
                  ? "text-background"
                  : "text-foreground/70 hover:text-foreground"
              )}
            >
              {isSelected && (
                <motion.div
                  className="absolute inset-0 bg-foreground rounded-full shadow-sm z-10"
                  layoutId="mood-bg"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              {isHovered && !isSelected && (
                <motion.div
                  className="absolute inset-0 bg-surface rounded-full z-0"
                  layoutId={`mood-hover-${mood.id}`}
                  transition={{ duration: 0.2 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon
                  size={14}
                  className={cn(
                    "transition-colors",
                    isSelected ? "text-background/80" : "text-foreground/50"
                  )}
                />
                <span className="hidden sm:inline">{mood.label}</span>
                <span className="sm:hidden">{mood.label.split(" ")[0]}</span>
              </span>
            </button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export { MOODS };
export type { MoodSelectorProps };
