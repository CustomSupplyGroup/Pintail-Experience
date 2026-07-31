import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { PhotoGallery } from "./photo-gallery";

export default async function PhotosPage() {
  const supabase = await createClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id")
    .neq("status", "draft")
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (tripError) console.error("photos: trip read failed", tripError.message);

  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("id, storage_path, caption")
    .order("created_at", { ascending: false });
  if (photosError) console.error("photos: photos read failed", photosError.message);

  return (
    <div>
      <PageHeader title="Photos" subtitle="The trip, as it happens." />
      <PhotoGallery initial={photos ?? []} tripId={trip?.id ?? null} />
    </div>
  );
}
