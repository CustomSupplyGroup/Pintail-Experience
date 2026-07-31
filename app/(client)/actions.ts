"use server";

import { cookies } from "next/headers";
import { TRIP_COOKIE } from "@/lib/trip";

/** Remember which trip the member is viewing (used by the trip switcher). */
export async function selectTrip(tripId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TRIP_COOKIE, tripId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
