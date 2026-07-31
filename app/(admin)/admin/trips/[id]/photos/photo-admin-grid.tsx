"use client";

import { useTransition } from "react";
import { Star, Eye, EyeOff, Trash2 } from "lucide-react";
import { publicPhotoUrl } from "@/lib/photos";
import { setPhotoPublic, setPhotoFeatured, deletePhoto } from "./actions";
import { cn } from "@/lib/utils";

type Photo = {
  id: string;
  storage_path: string;
  caption: string | null;
  public_visible: boolean;
  featured: boolean;
};

function IconButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-md bg-background/80 backdrop-blur transition-colors hover:bg-background",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function PhotoAdminGrid({
  photos,
  tripId,
}: {
  photos: Photo[];
  tripId: string;
}) {
  const [, startTransition] = useTransition();

  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No photos yet. Upload the first batch above.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((p) => (
        <div
          key={p.id}
          className="group relative aspect-square overflow-hidden rounded-lg border border-border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={publicPhotoUrl(p.storage_path)}
            alt={p.caption ?? "Trip photo"}
            className="size-full object-cover"
          />
          <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <IconButton
              title={p.public_visible ? "Public — click to hide" : "Private — click to make public"}
              active={p.public_visible}
              onClick={() =>
                startTransition(() =>
                  setPhotoPublic(p.id, !p.public_visible, tripId),
                )
              }
            >
              {p.public_visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </IconButton>
            <IconButton
              title="Feature"
              active={p.featured}
              onClick={() =>
                startTransition(() =>
                  setPhotoFeatured(p.id, !p.featured, tripId),
                )
              }
            >
              <Star className="size-4" fill={p.featured ? "currentColor" : "none"} />
            </IconButton>
            <IconButton
              title="Delete"
              onClick={() => {
                if (confirm("Delete this photo?"))
                  startTransition(() =>
                    deletePhoto(p.id, p.storage_path, tripId),
                  );
              }}
            >
              <Trash2 className="size-4" />
            </IconButton>
          </div>
          {p.public_visible && (
            <span className="absolute bottom-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
              public
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
