"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { buttonVariants, Button } from "@/components/ui/button";

/**
 * Rendered only for signed-in users (guests never see it). Staff go straight to
 * the control room; everyone else gets a calm "Admin Access Only" popup rather
 * than an error toast.
 */
export function AdminLink({ staff }: { staff: boolean }) {
  const router = useRouter();
  const [showNotice, setShowNotice] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => (staff ? router.push("/admin") : setShowNotice(true))}
        className={buttonVariants({
          variant: "outline",
          className: "w-full justify-start",
        })}
      >
        Admin
      </button>

      {showNotice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-notice-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setShowNotice(false)}
            className="absolute inset-0 bg-pintail-night/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-xs rounded-xl border border-primary/20 bg-pintail-char p-6 text-center shadow-lg shadow-black/40">
            <Lock className="mx-auto size-6 text-primary" />
            <h2
              id="admin-notice-title"
              className="mt-3 font-serif text-lg text-pintail-cream"
            >
              Admin Access Only
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The control room is for the hosting team. If that should be you,
              reach out to the founder.
            </p>
            <Button
              className="mt-5 w-full"
              onClick={() => setShowNotice(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
