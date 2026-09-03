"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { PropertyImage } from "@/types";
import { cn } from "@/lib/utils";

interface PropertyGalleryProps {
  images: PropertyImage[];
  title: string;
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const safeImages = images.length > 0 ? images : [];
  const count = safeImages.length;

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setActiveIndex((current) => (current + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowLeft") go(localStorage.getItem("ama2_dir") === "rtl" ? 1 : -1);
      if (e.key === "ArrowRight") go(localStorage.getItem("ama2_dir") === "rtl" ? -1 : 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, go]);

  if (count === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
        No images
      </div>
    );
  }

  const active = safeImages[activeIndex]!;

  return (
    <div>
      {/* Main image */}
      <div className="group relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-muted">
        <Image
          src={active.url}
          alt={title}
          fill
          sizes="(min-width: 1024px) 70vw, 100vw"
          className="object-cover"
          priority
        />
        <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {activeIndex + 1} / {count}
        </span>
        <button
          onClick={() => setFullscreen(true)}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-gold hover:text-black"
          aria-label="Fullscreen"
        >
          <Expand className="h-4 w-4" aria-hidden="true" />
        </button>

        {count > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-gold hover:text-black rtl:rotate-180"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-gold hover:text-black rtl:rotate-180"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {safeImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                index === activeIndex
                  ? "border-gold shadow-gold-glow"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
              aria-label={`Image ${index + 1}`}
              aria-current={index === activeIndex}
            >
              <Image
                src={image.url}
                alt={`${title} ${index + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen gallery"
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-gold hover:text-black"
            aria-label="Close fullscreen"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="relative h-[80vh] w-[85vw] max-w-6xl">
            <Image
              src={active.url}
              alt={title}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
          {count > 1 && (
            <>
              <button
                onClick={() => go(-1)}
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-gold hover:text-black rtl:rotate-180"
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button
                onClick={() => go(1)}
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-gold hover:text-black rtl:rotate-180"
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
