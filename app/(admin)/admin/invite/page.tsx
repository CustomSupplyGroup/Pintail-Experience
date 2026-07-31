import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { serviceRoleConfigured } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/page-header";
import { InviteForm } from "./invite-form";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ trip?: string }>;
}) {
  const configured = serviceRoleConfigured();
  const { trip: tripId } = await searchParams;

  // When a trip is passed, name it so it's clear who these invites enroll.
  let tripName: string | null = null;
  if (tripId) {
    const supabase = await createClient();
    const { data: trip, error } = await supabase
      .from("trips")
      .select("name")
      .eq("id", tripId)
      .maybeSingle();
    if (error) {
      console.error("invite: trip name lookup failed", error.message);
    }
    tripName = trip?.name ?? null;
  }

  const backHref = tripId ? `/admin/trips/${tripId}/roster` : "/admin/trips";

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href={backHref}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back
      </Link>
      <div className="mt-2">
        <PageHeader
          title="Invite attendees"
          subtitle={
            tripName
              ? `Enrolling into ${tripName}. One email per line, optionally as “Name <email>”.`
              : "One email per line. Optionally as “Name <email>”."
          }
        />
      </div>

      {!configured && (
        <div className="mb-6 rounded-lg border border-primary/40 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-primary">Service-role key required</p>
          <p className="mt-1 text-muted-foreground">
            Inviting attendees creates their accounts, which needs the
            <code className="mx-1 rounded bg-muted px-1">SUPABASE_SERVICE_ROLE_KEY</code>
            in your environment (local <code>.env.local</code> and Vercel). Add
            it, redeploy, and this will work. You can draft invites below
            regardless.
          </p>
        </div>
      )}

      <InviteForm tripId={tripId ?? null} />
    </div>
  );
}
