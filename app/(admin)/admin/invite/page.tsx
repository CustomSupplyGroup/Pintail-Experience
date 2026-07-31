import Link from "next/link";
import { serviceRoleConfigured } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/page-header";
import { InviteForm } from "./invite-form";

export default function InvitePage() {
  const configured = serviceRoleConfigured();

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/admin/trips"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to trips
      </Link>
      <div className="mt-2">
        <PageHeader
          title="Invite attendees"
          subtitle="One email per line. Optionally as “Name <email>”."
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

      <InviteForm />
    </div>
  );
}
