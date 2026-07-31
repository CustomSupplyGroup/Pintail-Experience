import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { emailConfigured } from "@/lib/email";
import { PageHeader, EmptyState } from "@/components/page-header";
import { BroadcastForm } from "./broadcast-form";

export default async function BroadcastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trip, error } = await supabase
    .from("trips")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("broadcast: trip read failed", error.message);
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title="Send a broadcast" />
        <EmptyState>Couldn&apos;t load the trip: {error.message}</EmptyState>
      </div>
    );
  }
  if (!trip) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <div>
        <PageHeader
          title="Send a broadcast"
          subtitle={`Posts an in-app announcement to everyone on ${trip.name}, with an option to also email them.`}
        />
      </div>
      <BroadcastForm emailReady={emailConfigured()} tripId={trip.id} />
    </div>
  );
}
