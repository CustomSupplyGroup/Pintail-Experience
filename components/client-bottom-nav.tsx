"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Sunrise, Image as ImageIcon, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

// Curriculum now lives inside Trip Info — a single Devotional tab replaces it.
const TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/devotionals", label: "Devotional", icon: Sunrise },
  { href: "/photos", label: "Photos", icon: ImageIcon },
  { href: "/more", label: "More", icon: Menu },
];

export function ClientBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-around md:max-w-lg">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
