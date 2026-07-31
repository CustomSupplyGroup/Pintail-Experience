import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/page-header";
import { PhotoUploader } from "./photo-uploader";
import { PhotoAdminGrid } from "./photo-admin-grid";

export default async function PhotosAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (tripError) {
    console.error("admin photos: trip read failed", tripError.message);
    return (
      <div>
        <PageHeader title="Photos" />
        <EmptyState>Couldn&apos;t load the trip: {tripError.message}</EmptyState>
      </div>
    );
  }
  if (!trip) notFound();

  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("id, storage_path, caption, public_visible, featured")
    .eq("trip_id", trip.id)
    .order("created_at", { ascending: false });
  if (photosError) console.error("admin photos: photos read failed", photosError.message);

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/trips/${id}?tab=manage`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Manage
      </Link>
      <PageHeader
        title="Photos"
        subtitle="Upload from the field. Toggle which appear in the public gallery."
      />
      <PhotoUploader tripId={trip.id} userId={user!.id} />
      <PhotoAdminGrid photos={photos ?? []} tripId={trip.id} />
    </div>
  );
}
