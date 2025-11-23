"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type MediaType = "movies" | "books";

interface MediaContextType {
  mediaType: MediaType;
  setMediaType: (type: MediaType) => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export function MediaProvider({ children }: { children: ReactNode }) {
  const [mediaType, setMediaTypeState] = useState<MediaType>("movies");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("mediaType");
    if (saved === "movies" || saved === "books") {
      setMediaTypeState(saved);
    }
    setIsInitialized(true);
  }, []);

  const setMediaType = (type: MediaType) => {
    setMediaTypeState(type);
    localStorage.setItem("mediaType", type);
  };

  return (
    <MediaContext.Provider value={{ mediaType, setMediaType }}>
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error("useMedia must be used within a MediaProvider");
  }
  return context;
}

