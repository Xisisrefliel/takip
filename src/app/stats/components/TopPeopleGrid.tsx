"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { PeopleStat } from "../actions";

type Props = {
  data?: PeopleStat[];
};

function PeopleGrid({ data }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-5">
      {data.slice(0, 6).map((person, idx) => (
        <motion.div
          key={person.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="flex items-center gap-5 rounded-xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/40 px-5 py-5"
        >
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-black/10 dark:border-white/10">
            {person.profilePath ? (
              <Image
                src={person.profilePath}
                alt={person.name}
                width={96}
                height={96}
                className="h-full w-full object-cover"
                sizes="96px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-black/5 dark:bg-white/5">
                <span className="text-sm font-medium text-foreground/60">{person.name.slice(0, 2)}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium text-foreground mb-1">{person.name}</p>
            <p className="text-sm text-foreground/50">{person.count} appearances</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function TopActorsGrid({ data }: Props) {
  return <PeopleGrid data={data} />;
}

export function TopDirectorsGrid({ data }: Props) {
  return <PeopleGrid data={data} />;
}
