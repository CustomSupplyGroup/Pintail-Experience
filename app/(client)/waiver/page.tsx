import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { WaiverPad } from "./waiver-pad";
import {
  PLACEHOLDER_WAIVER_TEXT,
  WAIVER_TITLE,
  WAIVER_IS_DRAFT,
} from "@/lib/waiver-copy";

export default async function WaiverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tripId, error: enrollError } = await supabase.rpc(
    "ensure_trip_enrollment",
  );
  if (enrollError) {
    console.error("waiver: ensure_trip_enrollment failed", enrollError.message);
  }

  let signedAt: string | null = null;
  if (tripId) {
    const { data, error: waiverError } = await supabase
      .from("waivers")
      .select("signed_at")
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .order("signed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (waiverError) {
      console.error("waiver: signed_at read failed", waiverError.message);
    }
    signedAt = data?.signed_at ?? null;
  }

  return (
    <div>
      <PageHeader
        title="Liability waiver"
        subtitle="Required before the trip."
      />

      {signedAt ? (
        <Card className="border-primary/40">
          <CardContent className="pt-6 text-center">
            <p className="font-serif text-xl text-primary">Signed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Received {new Date(signedAt).toLocaleDateString()}. Thank you —
              nothing else needed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {WAIVER_IS_DRAFT && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              <span className="font-semibold">DRAFT — not legally binding.</span>{" "}
              This placeholder release will be replaced with the final,
              attorney-reviewed waiver before the trip.
            </div>
          )}
          <Card>
            <CardContent className="space-y-3 pt-6 text-sm text-foreground/85">
              <p className="font-medium text-foreground">{WAIVER_TITLE}</p>
              {PLACEHOLDER_WAIVER_TEXT.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </CardContent>
          </Card>

          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              Sign with your finger:
            </p>
            <WaiverPad userId={user.id} />
          </div>
        </div>
      )}
    </div>
  );
}
