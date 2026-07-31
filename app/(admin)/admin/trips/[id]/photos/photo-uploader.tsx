"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function PhotoUploader({
  tripId,
  userId,
}: {
  tripId: string | null;
  userId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !tripId) return;

    setBusy(true);
    setProgress({ done: 0, total: files.length });
    const supabase = createClient();
    let ok = 0;

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${tripId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("photos")
        .upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });

      if (upErr) {
        console.error("upload failed:", upErr.message);
        toast.error(`Upload failed: ${file.name}`);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
        continue;
      }

      const { error: rowErr } = await supabase.from("photos").insert({
        trip_id: tripId,
        uploaded_by: userId,
        storage_path: path,
        taken_at: new Date(file.lastModified).toISOString(),
      });
      if (rowErr) {
        console.error("photo row insert failed:", rowErr.message);
        toast.error(`Saved file but record failed: ${file.name}`);
      } else {
        ok += 1;
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    toast.success(`Uploaded ${ok} ${ok === 1 ? "photo" : "photos"}.`);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFiles}
        disabled={busy || !tripId}
      />
      <p className="mb-3 text-sm text-muted-foreground">
        {tripId
          ? "Select photos to add to the gallery — they appear for attendees instantly."
          : "No active trip to upload to."}
      </p>
      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy || !tripId}
      >
        {busy
          ? `Uploading ${progress.done}/${progress.total}…`
          : "Choose photos"}
      </Button>
    </div>
  );
}
