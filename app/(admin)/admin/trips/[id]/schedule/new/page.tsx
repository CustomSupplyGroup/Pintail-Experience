import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { ScheduleForm } from "../schedule-form";

export default async function NewScheduleItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trip, error } = await supabase
    .from("trips")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("new schedule item: trip read failed", error.message);
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Add schedule item" />
        <EmptyState>Couldn&apos;t load the trip: {error.message}</EmptyState>
      </div>
    );
  }
  if (!trip) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/admin/trips/${id}/schedule`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to schedule
      </Link>
      <div className="mt-2">
        <PageHeader title="Add schedule item" />
      </div>
      <ScheduleForm item={null} tripId={trip.id} />
    </div>
  );
}
