"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { recordWaiver } from "./actions";
import { Button } from "@/components/ui/button";

export function WaiverPad({ userId }: { userId: string }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  // Size the canvas to its container with crisp lines on retina displays.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#eee7e0";
    }
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasInk.current = true;
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
  }

  async function submit() {
    if (!hasInk.current) {
      toast.error("Please sign in the box first.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSubmitting(true);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) {
      setSubmitting(false);
      toast.error("Couldn't capture the signature. Try again.");
      return;
    }

    const supabase = createClient();
    const path = `${userId}/waiver-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("signatures")
      .upload(path, blob, { contentType: "image/png", upsert: true });

    if (uploadError) {
      setSubmitting(false);
      toast.error(`Upload failed: ${uploadError.message}`);
      return;
    }

    const result = await recordWaiver(path);
    setSubmitting(false);
    if (result.ok) {
      toast.success(result.message);
      // Flip the page to the "Signed" state without a manual reload.
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-40 w-full touch-none rounded-lg border border-input bg-secondary"
      />
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={clear} disabled={submitting}>
          Clear
        </Button>
        <Button type="button" onClick={submit} disabled={submitting} className="flex-1">
          {submitting ? "Saving…" : "Sign & submit"}
        </Button>
      </div>
    </div>
  );
}
