import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TripTabs } from "./trip-tabs";

export default async function TripWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trip, error } = await supabase
    .from("trips")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("trip workspace layout: name read failed", error.message);
  }

  return (
    <div>
      <Link
        href="/admin/trips"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to trips
      </Link>
      <h1 className="mt-2 mb-4 font-heading text-3xl italic tracking-tight">
        {trip?.name ?? "Trip"}
      </h1>
      <TripTabs tripId={id} />
      {children}
    </div>
  );
}
