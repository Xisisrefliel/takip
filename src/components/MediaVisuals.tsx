"use client";

import Image from "next/image";
import type React from "react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

type MediaKind = "movie" | "tv" | "book";

interface MediaVisualsProps {
  images: string[];
  mediaType: MediaKind;
}

const INITIAL_BATCH = 6;
const BATCH_SIZE = 9;

const TMDB_IMAGE_BASE_URL_ORIGINAL = "https://image.tmdb.org/t/p/original";
const TMDB_IMAGE_BASE_URL_W1280 = "https://image.tmdb.org/t/p/w1280";

function getOriginalUrl(thumbnailUrl: string): string {
  if (thumbnailUrl.includes("image.tmdb.org")) {
    const filePath = thumbnailUrl.replace(TMDB_IMAGE_BASE_URL_W1280, "");
    return `${TMDB_IMAGE_BASE_URL_ORIGINAL}${filePath}`;
  }
  return thumbnailUrl;
}

export function MediaVisuals({ images, mediaType }: MediaVisualsProps) {
  const initialVisible = Math.min(images.length, INITIAL_BATCH);
  const [extraBatches, setExtraBatches] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const canUsePortal = typeof document !== "undefined";

  const visibleCount = Math.min(
    images.length,
    initialVisible + extraBatches * BATCH_SIZE
  );
  const canShowMore = visibleCount < images.length;

  const showMore = () => setExtraBatches((prev) => prev + 1);

  const currentImage = useMemo(() => {
    if (selectedIndex === null) return null;
    return images[selectedIndex];
  }, [images, selectedIndex]);

  const currentFullsize = useMemo(() => {
    if (!currentImage) return null;
    return getOriginalUrl(currentImage);
  }, [currentImage]);

  const goToPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedIndex(null);
      if (event.key === "ArrowLeft") goToPrev();
      if (event.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIndex, goToPrev, goToNext]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const withinImage =
      imageContainerRef.current &&
      target instanceof Node &&
      imageContainerRef.current.contains(target);

    if (withinImage) return;
    setSelectedIndex(null);
  };

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <>
      <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2">
              <span className="w-1 h-6 sm:h-8 bg-accent rounded-full"></span>
              <h2 className="text-xl sm:text-2xl font-bold">Visuals</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {images.slice(0, visibleCount).map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                onClick={() => handleImageClick(idx)}
                className={`group relative w-full overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl focus:outline-none focus:ring-2 focus:ring-accent/70 ${mediaType === "book" ? "aspect-3/4" : "aspect-video"}`}
              >
                <Image
                  src={img}
                  alt={`Scene ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/0 to-black/30 group-hover:from-black/10 group-hover:to-black/50 transition-colors" />
                <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white opacity-0 backdrop-blur group-hover:opacity-100 transition-opacity">
                  <ZoomIn size={14} />
                  View
                </div>
              </button>
            ))}
          </div>

          {canShowMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={showMore}
                className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-6 py-3 text-sm font-medium text-accent transition duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/20"
              >
                Show more
                <span className="text-xs uppercase tracking-wide">
                  +{Math.min(BATCH_SIZE, images.length - visibleCount)}
                </span>
              </button>
            </div>
          )}
        </div>
      </section>

      {canUsePortal && selectedIndex !== null && currentFullsize
        ? createPortal(
          <div
            ref={overlayRef}
            className="fixed inset-0 z-50 bg-black/98 backdrop-blur-sm flex items-center justify-center"
            onClick={handleOverlayClick}
          >
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex gap-2">
              <button
                onClick={() => setSelectedIndex(null)}
                className="rounded-full border border-white/20 bg-white/10 p-3 text-white transition hover:bg-white/20 hover:-translate-y-0.5"
              >
                <X size={20} />
              </button>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 rounded-full border border-white/20 bg-black/40 p-3 text-white transition hover:bg-white/20 hover:scale-110"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 rounded-full border border-white/20 bg-black/40 p-3 text-white transition hover:bg-white/20 hover:scale-110"
            >
              <ChevronRight size={24} />
            </button>

            <div ref={imageContainerRef} className="relative w-full h-full max-w-[95vw] max-h-[90vh] p-4 sm:p-8">
              <Image
                src={currentFullsize}
                alt={`Visual ${selectedIndex + 1} of ${images.length}`}
                fill
                className="object-contain"
                priority
                sizes="95vw"
              />
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>,
          document.body
        )
        : null}
    </>
  );
}
