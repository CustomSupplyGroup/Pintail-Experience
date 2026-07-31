"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { publicPhotoUrl } from "@/lib/photos";

type Photo = { id: string; storage_path: string; caption: string | null };

export function PhotoGallery({
  initial,
  tripId,
}: {
  initial: Photo[];
  tripId: string | null;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [active, setActive] = useState<Photo | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Lightbox as a real dialog: Escape to close, body-scroll lock, move focus to
  // the close button and restore it to the opening thumbnail on close.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      openerRef.current?.focus();
      openerRef.current = null;
    };
  }, [active]);

  useEffect(() => {
    if (!tripId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`photos-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "photos",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const row = payload.new as Photo;
          setPhotos((prev) =>
            prev.some((p) => p.id === row.id) ? prev : [row, ...prev],
          );
          toast("A new photo just dropped.");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Photos will appear here in real time during the trip.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={(e) => {
              openerRef.current = e.currentTarget;
              setActive(p);
            }}
            className="aspect-square overflow-hidden rounded-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={publicPhotoUrl(p.storage_path)}
              alt={p.caption ?? "Trip photo"}
              loading="lazy"
              className="size-full object-cover transition-transform hover:scale-105"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.caption ?? "Trip photo"}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={() => setActive(null)}
        >
          <button
            ref={closeRef}
            type="button"
            aria-label="Close photo"
            onClick={(e) => {
              e.stopPropagation();
              setActive(null);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={publicPhotoUrl(active.storage_path)}
            alt={active.caption ?? "Trip photo"}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
          {active.caption && (
            <p
              onClick={(e) => e.stopPropagation()}
              className="mt-4 max-w-lg text-center text-sm text-white/80"
            >
              {active.caption}
            </p>
          )}
        </div>
      )}
    </>
  );
}
