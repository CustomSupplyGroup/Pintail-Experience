import { redirect } from "next/navigation";

// The Trips list has been replaced by the Hunts board (P2-ADM-3).
export default function TripsPage() {
  redirect("/admin/hunts");
}
