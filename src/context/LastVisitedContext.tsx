"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface LastVisitedItem {
  title: string;
  href: string;
  mediaType: "movie" | "tv";
}

interface LastVisitedContextType {
  lastVisited: LastVisitedItem | null;
  setLastVisited: (item: LastVisitedItem) => void;
}

const LastVisitedContext = createContext<LastVisitedContextType | undefined>(undefined);

export function LastVisitedProvider({ children }: { children: ReactNode }) {
  const [lastVisited, setLastVisitedState] = useState<LastVisitedItem | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("lastVisited");
    if (saved) {
      try {
        setLastVisitedState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse last visited item", e);
      }
    }
  }, []);

  const setLastVisited = (item: LastVisitedItem) => {
    setLastVisitedState(item);
    localStorage.setItem("lastVisited", JSON.stringify(item));
  };

  return (
    <LastVisitedContext.Provider value={{ lastVisited, setLastVisited }}>
      {children}
    </LastVisitedContext.Provider>
  );
}

export function useLastVisited() {
  const context = useContext(LastVisitedContext);
  if (context === undefined) {
    throw new Error("useLastVisited must be used within a LastVisitedProvider");
  }
  return context;
}

