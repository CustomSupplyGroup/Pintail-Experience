import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { getSelectedTrip } from "@/lib/trip";
import { fmtRange } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import {
  ReadinessChecklist,
  type ReadinessRow,
} from "@/components/readiness-checklist";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { AdminLink } from "./admin-link";

function fmtMonthYear(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default async function MorePage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const photo = user?.photo_url ?? user?.avatar_url ?? null;
  const initials = (user?.full_name ?? user?.email ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  let myTrips: Awaited<ReturnType<typeof getSelectedTrip>>["memberTrips"] = [];
  let readiness: ReadinessRow[] | null = null;
  if (user) {
    const { trip, memberTrips, error } = await getSelectedTrip(supabase, user);
    if (error) console.error("more: selected trip read failed", error);
    myTrips = memberTrips;

    if (trip) {
      const { data: attendee, error: attendeeError } = await supabase
        .from("trip_attendees")
        .select("shirt_size, waiver_signed_at, amount_paid_cents")
        .eq("trip_id", trip.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (attendeeError)
        console.error("more: attendee read failed", attendeeError.message);

      const profileDone =
        Boolean(user.full_name) && Boolean(attendee?.shirt_size);
      const waiverDone = Boolean(attendee?.waiver_signed_at);
      const price = trip.price_cents;
      const paymentDone =
        price == null ||
        price === 0 ||
        (attendee?.amount_paid_cents ?? 0) >= price;

      readiness = [
        {
          label: "Complete your profile",
          done: profileDone,
          href: "/onboarding",
          hint: profileDone ? undefined : "Name & sizes",
        },
        {
          label: "Sign the waiver",
          done: waiverDone,
          href: "/waiver",
        },
        {
          label: "Payment",
          done: paymentDone,
          href: "/home",
          hint: paymentDone ? undefined : "Balance due",
        },
      ];
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="More" />

      {readiness && <ReadinessChecklist rows={readiness} />}

      {/* Profile */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={user?.full_name ?? "Profile"}
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-pintail-slate font-sans-ui text-lg text-pintail-cream">
              {user ? initials : "?"}
            </div>
          )}
          <div className="min-w-0">
            {user ? (
              <>
                <p className="font-serif text-lg leading-tight">
                  {user.full_name ?? "Your profile"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
                {user.member_since && (
                  <p className="mt-0.5 text-xs text-primary">
                    Member since {fmtMonthYear(user.member_since)}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="font-serif text-lg">You&apos;re previewing</p>
                <p className="text-sm text-muted-foreground">
                  Sign in to set up your profile and see who else is coming.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* My Trips */}
      {user && myTrips.length > 0 && (
        <section>
          <h2 className="mb-2 font-sans-ui text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            My Trips
          </h2>
          <ul className="space-y-2">
            {myTrips.map((t) => (
              <li key={t.id}>
                <Card>
                  <CardContent className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-serif text-base leading-tight">
                        {t.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmtRange(t.start_date, t.end_date)}
                      </p>
                    </div>
                    <Badge
                      variant={t.status === "live" ? "default" : "secondary"}
                      className="shrink-0"
                    >
                      {t.status === "past" ? "Past" : t.status === "live" ? "Live" : "Upcoming"}
                    </Badge>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Navigation */}
      <nav className="grid gap-2">
        <Link
          href="/trip"
          className={buttonVariants({ variant: "outline", className: "w-full justify-start" })}
        >
          Trip Info
        </Link>
        <Link
          href="/devotionals"
          className={buttonVariants({ variant: "outline", className: "w-full justify-start" })}
        >
          Devotionals
        </Link>
        <Link
          href="/vendors"
          className={buttonVariants({ variant: "outline", className: "w-full justify-start" })}
        >
          The Hosting Team
        </Link>
        <Link
          href="/roster"
          className={buttonVariants({ variant: "outline", className: "w-full justify-start" })}
        >
          Who&apos;s coming
        </Link>
        {user && (
          <>
            <Link
              href="/waiver"
              className={buttonVariants({ variant: "outline", className: "w-full justify-start" })}
            >
              Sign the waiver
            </Link>
            <Link
              href="/onboarding"
              className={buttonVariants({ variant: "outline", className: "w-full justify-start" })}
            >
              Edit my profile
            </Link>
            <AdminLink staff={isStaff(user.role)} />
          </>
        )}
      </nav>

      {user ? (
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="ghost" className="w-full">
            Sign out
          </Button>
        </form>
      ) : (
        <Link href="/login" className={buttonVariants({ className: "w-full" })}>
          Sign in
        </Link>
      )}
    </div>
  );
}
