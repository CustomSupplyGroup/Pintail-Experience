import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  ContentAssignmentList,
  type AssignableSeries,
} from "./content-assignment";

export default async function TripContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (tripError) {
    console.error("trip content: trip read failed", tripError.message);
    return (
      <div>
        <PageHeader title="Content" />
        <EmptyState>Couldn&apos;t load the trip: {tripError.message}</EmptyState>
      </div>
    );
  }
  if (!trip) notFound();

  const { data: series, error: seriesError } = await supabase
    .from("content_series")
    .select("id, title, kind, description")
    .order("title", { ascending: true });
  if (seriesError) {
    console.error("trip content: series read failed", seriesError.message);
    return (
      <div>
        <Link
          href={`/admin/trips/${id}?tab=manage`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Manage
        </Link>
        <div className="mt-2">
          <PageHeader title="Content" />
        </div>
        <EmptyState>Couldn&apos;t load content: {seriesError.message}</EmptyState>
      </div>
    );
  }

  const { data: assigned, error: assignedError } = await supabase
    .from("trip_content")
    .select("series_id")
    .eq("trip_id", trip.id);
  if (assignedError) {
    console.error("trip content: assignments read failed", assignedError.message);
  }

  const assignedIds = new Set((assigned ?? []).map((r) => r.series_id));

  const list: AssignableSeries[] = (series ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    kind: s.kind,
    description: s.description,
    assigned: assignedIds.has(s.id),
  }));

  return (
    <div>
      <Link
        href={`/admin/trips/${id}?tab=manage`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Manage
      </Link>
      <div className="mt-2 flex items-end justify-between gap-4">
        <PageHeader
          title="Content"
          subtitle={`Assign devotional & curriculum series to ${trip.name}.`}
        />
        <Link
          href="/admin/content"
          className={buttonVariants({ variant: "outline", className: "mb-6" })}
        >
          Author content
        </Link>
      </div>

      <ContentAssignmentList tripId={trip.id} series={list} />
    </div>
  );
}
