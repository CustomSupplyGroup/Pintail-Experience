import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { PageForm } from "../page-form";

export default async function NewTripPagePage() {
  const supabase = await createClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select("id")
    .neq("status", "draft")
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) console.error("new info page: trip read failed", error.message);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/pages"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to logistics
      </Link>
      <div className="mt-2">
        <PageHeader title="New info page" />
      </div>
      <PageForm page={null} tripId={trip?.id ?? null} />
    </div>
  );
}
