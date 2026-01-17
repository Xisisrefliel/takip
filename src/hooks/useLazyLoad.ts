"use client";

import { useState, useEffect, useRef, type RefObject } from "react";

export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, isIntersecting];
}

export function useLazyLoad<T>(
  loadFn: () => Promise<T>,
  options: IntersectionObserverInit = {}
): { data: T | null; isLoading: boolean; error: string | null; ref: RefObject<HTMLDivElement | null> } {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "200px",
    ...options,
  });
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (isIntersecting && !hasLoaded.current) {
      hasLoaded.current = true;

      const loadData = async () => {
        setIsLoading(true);
        setError(null);

        try {
          const result = await loadFn();
          setData(result);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load");
        } finally {
          setIsLoading(false);
        }
      };

      requestAnimationFrame(() => {
        loadData();
      });
    }
  }, [isIntersecting, loadFn]);

  return { data, isLoading, error, ref };
}
