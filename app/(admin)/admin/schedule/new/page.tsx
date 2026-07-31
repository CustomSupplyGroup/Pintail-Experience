import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ScheduleForm } from "../schedule-form";

export default async function NewScheduleItemPage() {
  const supabase = await createClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select("id")
    .neq("status", "draft")
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) console.error("new schedule item: trip read failed", error.message);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/schedule"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to schedule
      </Link>
      <div className="mt-2">
        <PageHeader title="Add schedule item" />
      </div>
      <ScheduleForm item={null} tripId={trip?.id ?? null} />
    </div>
  );
}
