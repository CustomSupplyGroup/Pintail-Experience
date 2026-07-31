import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { TripEditForm } from "./trip-edit-form";

export default async function TripEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trip, error } = await supabase
    .from("trips")
    .select("id, name, location, start_date, end_date, description, status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("trip fetch failed:", error.message);
    return (
      <div className="mx-auto max-w-xl">
        <Link
          href="/admin/trips"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to trips
        </Link>
        <div className="mt-2">
          <PageHeader title="Edit trip" />
        </div>
        <EmptyState>Couldn&apos;t load this trip: {error.message}</EmptyState>
      </div>
    );
  }
  if (!trip) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/admin/trips"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to trips
      </Link>
      <div className="mt-2">
        <PageHeader title="Edit trip" />
      </div>
      <TripEditForm trip={trip} />
    </div>
  );
}
