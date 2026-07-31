import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getSelectedTrip } from "@/lib/trip";
import { ClientBottomNav } from "@/components/client-bottom-nav";
import { TripSwitcher } from "@/components/trip-switcher";
import { PintailLockup } from "@/components/pintail-logo";
import { PageTransition } from "@/components/page-transition";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { stock } from "@/lib/stock";

// Open to guests during the build phase (no login) so the app can be shared by
// link. Pages handle the no-user case gracefully.
export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const { trip, memberTrips } = await getSelectedTrip(supabase, user);

  return (
    <div className="flex min-h-dvh flex-col">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center opacity-[0.05]"
        style={{ backgroundImage: `url(${stock("featherDetail")})` }}
      />
      <header className="sticky top-0 z-40 border-b border-primary/15 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3 md:max-w-3xl">
          <Link href="/home" aria-label="The Pintail Experience home">
            <PintailLockup height={26} caption={false} />
          </Link>
          {trip && (
            <TripSwitcher
              trips={memberTrips.map((t) => ({
                id: t.id,
                name: t.name,
                subtitle: t.subtitle,
                status: t.status,
              }))}
              selectedId={trip.id}
            />
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-md flex-1 px-4 pt-5 pb-24 md:max-w-3xl">
        <PageTransition>{children}</PageTransition>
      </div>
      <PwaInstallPrompt />
      <ClientBottomNav />
    </div>
  );
}
