import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getSelectedTrip } from "@/lib/trip";
import { PageHeader } from "@/components/page-header";
import { PhotoGallery } from "./photo-gallery";

export default async function PhotosPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { trip, error: tripError } = await getSelectedTrip(supabase, user);
  if (tripError) console.error("photos: trip read failed", tripError);

  let photos: { id: string; storage_path: string; caption: string | null }[] = [];
  if (trip) {
    const { data, error: photosError } = await supabase
      .from("photos")
      .select("id, storage_path, caption")
      .eq("trip_id", trip.id)
      .order("created_at", { ascending: false });
    if (photosError) {
      console.error("photos: photos read failed", photosError.message);
    }
    photos = data ?? [];
  }

  return (
    <div>
      <PageHeader title="Photos" subtitle="The trip, as it happens." />
      <PhotoGallery initial={photos} tripId={trip?.id ?? null} />
    </div>
  );
}
