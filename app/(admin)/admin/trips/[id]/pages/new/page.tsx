import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { PageForm } from "../page-form";

export default async function NewTripPagePage({
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
    console.error("new info page: trip read failed", error.message);
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="New info page" />
        <EmptyState>Couldn&apos;t load the trip: {error.message}</EmptyState>
      </div>
    );
  }
  if (!trip) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/admin/trips/${id}/pages`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Trip Info
      </Link>
      <div className="mt-2">
        <PageHeader title="New info page" />
      </div>
      <PageForm page={null} tripId={trip.id} />
    </div>
  );
}
