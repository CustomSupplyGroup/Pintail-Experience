import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getSelectedTrip } from "@/lib/trip";
import { currentTripDay } from "@/lib/dates";
import { PageHeader, EmptyState } from "@/components/page-header";
import {
  ScheduleView,
  type ScheduleDay,
  type ScheduleItem,
} from "./schedule-view";

export default async function SchedulePage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { trip, error: tripError } = await getSelectedTrip(supabase, user);
  if (tripError || !trip) {
    return (
      <div>
        <PageHeader title="Schedule" subtitle="The run-of-show, day by day." />
        <EmptyState>The schedule will be published before the trip.</EmptyState>
      </div>
    );
  }

  const { data: items, error } = await supabase
    .from("schedule_items")
    .select("id, day_number, start_time, title, description, location, category")
    .eq("trip_id", trip.id)
    .eq("visible_to_attendees", true)
    .order("day_number", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: true });

  const byDay = new Map<number, ScheduleItem[]>();
  for (const it of items ?? []) {
    if (!byDay.has(it.day_number)) byDay.set(it.day_number, []);
    byDay.get(it.day_number)!.push({
      id: it.id,
      start_time: it.start_time,
      title: it.title,
      description: it.description,
      location: it.location,
      category: it.category,
    });
  }
  const days: ScheduleDay[] = [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, dayItems]) => ({ day, items: dayItems }));

  const currentDay = currentTripDay(trip.start_date, trip.end_date);

  return (
    <div>
      <PageHeader title="Schedule" subtitle="The run-of-show, day by day." />
      {error ? (
        <EmptyState>Couldn&apos;t load the schedule right now.</EmptyState>
      ) : days.length === 0 ? (
        <EmptyState>The schedule will be published before the trip.</EmptyState>
      ) : (
        <ScheduleView
          days={days}
          currentDay={currentDay}
          isLive={trip.status === "live"}
        />
      )}
    </div>
  );
}
