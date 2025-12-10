"use client";

import Image from "next/image";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Maximize2 } from "lucide-react";

type MediaKind = "movie" | "tv" | "book";

interface MediaVisualsProps {
  images: string[];
  mediaType: MediaKind;
}

const INITIAL_BATCH = 6;
const BATCH_SIZE = 6;

export function MediaVisuals({ images, mediaType }: MediaVisualsProps) {
  const initialVisible = Math.min(images.length, INITIAL_BATCH);
  const [extraBatches, setExtraBatches] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const canUsePortal = typeof document !== "undefined";

  const activeImage = useMemo(() => {
    if (!selectedImage) return null;
    return images.includes(selectedImage) ? selectedImage : null;
  }, [images, selectedImage]);

  useEffect(() => {
    if (!selectedImage) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedImage]);

  const showMore = () => setExtraBatches((prev) => prev + 1);

  const visibleCount = Math.min(
    images.length,
    initialVisible + extraBatches * BATCH_SIZE
  );
  const canShowMore = visibleCount < images.length;

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const withinImage =
      imageRef.current &&
      target instanceof Node &&
      imageRef.current.contains(target);

    if (withinImage) return;
    setSelectedImage(null);
  };

  return (
    <>
      <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        {/* Subtle textured background */}
        <div className="absolute inset-0 -z-10">
          <Image
            src={images[0]}
            alt=""
            fill
            sizes="100vw"
            className="object-cover blur-3xl opacity-10 scale-110"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.06),transparent_32%)]" />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-background" />
        </div>

        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-6 sm:mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1 h-6 sm:h-8 bg-accent rounded-full"></span>
              <h2 className="text-xl sm:text-2xl font-bold">Visuals</h2>
            </div>
            {canShowMore && (
              <button
                onClick={showMore}
                className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/20"
              >
                Show more
                <span className="text-xs uppercase tracking-wide">
                  +{Math.min(BATCH_SIZE, images.length - visibleCount)}
                </span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {images.slice(0, visibleCount).map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                onClick={() => {
                  // #region agent log: open modal
                  fetch(
                    "http://127.0.0.1:7242/ingest/a9152166-8d97-4c3d-8ed2-83a4373a7e01",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        sessionId: "debug-session",
                        runId: "run1",
                        hypothesisId: "H1",
                        location: "MediaVisuals.tsx:openClick",
                        message: "Image click -> open modal",
                        data: {
                          img,
                          idx,
                          scrollY:
                            typeof window !== "undefined"
                              ? window.scrollY
                              : null,
                        },
                        timestamp: Date.now(),
                      }),
                    }
                  ).catch(() => {});
                  // #endregion
                  setSelectedImage(img);
                }}
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
                  <Maximize2 size={14} />
                  View
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
      {/* Fullscreen viewer */}
      {canUsePortal && activeImage
        ? createPortal(
            <div
              ref={overlayRef}
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center"
              onClick={handleOverlayClick}
            >
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="rounded-full border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20 hover:-translate-y-0.5"
                >
                  <X size={18} />
                </button>
              </div>
              <div ref={imageRef} className="relative w-2/3 h-2/3">
                <Image
                  src={activeImage}
                  alt="Selected visual"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
