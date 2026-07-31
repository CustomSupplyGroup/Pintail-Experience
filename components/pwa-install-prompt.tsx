"use client";

import { useEffect, useState } from "react";
import { X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PintailMark } from "@/components/pintail-logo";

const DISMISS_KEY = "pintail-install-dismissed";
const IOS_HINT_KEY = "pintail-ios-hint-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari exposes standalone on navigator, not via display-mode.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  // Register the service worker (installability + offline shell).
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("service worker registration failed", err);
      });
    }
  }, []);

  // Android/Chrome: capture the native install prompt.
  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (isStandalone()) return;

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  // iOS Safari never fires beforeinstallprompt — show a manual hint once.
  useEffect(() => {
    if (localStorage.getItem(IOS_HINT_KEY)) return;
    if (!isIos() || isStandalone()) return;
    const t = setTimeout(() => setShowIosHint(true), 2500);
    return () => clearTimeout(t);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setShow(false);
    setDeferred(null);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  function dismiss() {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  function dismissIos() {
    setShowIosHint(false);
    localStorage.setItem(IOS_HINT_KEY, "1");
  }

  if (showIosHint) {
    return (
      <div className="fixed inset-x-0 bottom-[72px] z-50 mx-auto max-w-md px-4">
        <div className="rounded-lg border border-primary/30 bg-card p-4 shadow-lg shadow-black/40">
          <div className="flex items-start gap-3">
            <PintailMark className="mt-0.5 h-5 w-auto shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Add Pintail to your home screen</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tap the Share icon{" "}
                <Share className="mx-0.5 inline size-3.5 align-text-bottom" />{" "}
                below, then choose <span className="text-foreground">Add to Home Screen</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissIos}
              aria-label="Dismiss"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-[72px] z-50 mx-auto max-w-md px-4">
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-card p-3 shadow-lg shadow-black/40">
        <PintailMark className="h-5 w-auto shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Add Pintail to your home screen</p>
          <p className="text-xs text-muted-foreground">
            Open it like an app, all trip long.
          </p>
        </div>
        <Button size="sm" onClick={install}>
          Add
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
