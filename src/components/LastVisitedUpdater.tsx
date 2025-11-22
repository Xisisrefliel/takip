"use client";

import { useEffect } from "react";
import { useLastVisited } from "@/context/LastVisitedContext";

interface LastVisitedUpdaterProps {
  title: string;
  href: string;
  mediaType: "movie" | "tv";
}

export function LastVisitedUpdater({ title, href, mediaType }: LastVisitedUpdaterProps) {
  const { setLastVisited, lastVisited } = useLastVisited();

  useEffect(() => {
    // Only update if it's different to avoid unnecessary writes/renders
    if (
      !lastVisited ||
      lastVisited.href !== href ||
      lastVisited.title !== title
    ) {
      setLastVisited({ title, href, mediaType });
    }
  }, [title, href, mediaType, setLastVisited, lastVisited]);

  return null;
}

