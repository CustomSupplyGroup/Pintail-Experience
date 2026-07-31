"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { selectTrip } from "@/app/(client)/actions";

type SwitcherTrip = {
  id: string;
  name: string;
  subtitle: string | null;
  status: "draft" | "live" | "past";
};

/**
 * Top-of-app selector across the member's trips. Scopes every member screen to
 * the chosen trip. With a single trip it renders as a static label — no menu.
 */
export function TripSwitcher({
  trips,
  selectedId,
}: {
  trips: SwitcherTrip[];
  selectedId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const selected = trips.find((t) => t.id === selectedId) ?? trips[0] ?? null;
  if (!selected) return null;

  function choose(id: string) {
    setOpen(false);
    if (id === selectedId) return;
    startTransition(async () => {
      await selectTrip(id);
      router.refresh();
    });
  }

  if (trips.length <= 1) {
    return (
      <span className="font-sans-ui text-sm font-medium text-pintail-cream">
        {selected.name}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 font-sans-ui text-sm font-medium text-pintail-cream hover:bg-pintail-cream/10"
      >
        {selected.name}
        <ChevronDown className="size-4 text-primary" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <ul
            role="listbox"
            className="absolute left-1/2 z-50 mt-2 w-64 -translate-x-1/2 overflow-hidden rounded-lg border border-primary/20 bg-pintail-char shadow-lg shadow-black/40"
          >
            {trips.map((t) => {
              const active = t.id === selected.id;
              return (
                <li key={t.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => choose(t.id)}
                    className={cn(
                      "flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-pintail-cream/5",
                      active && "bg-pintail-cream/5",
                    )}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        active ? "text-primary" : "text-transparent",
                      )}
                    />
                    <span>
                      <span className="block text-sm text-pintail-cream">
                        {t.name}
                        {t.status === "live" && (
                          <span className="ml-2 text-[0.65rem] uppercase tracking-wide text-primary">
                            Live
                          </span>
                        )}
                      </span>
                      {t.subtitle && (
                        <span className="block text-xs text-pintail-cream/60">
                          {t.subtitle}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
