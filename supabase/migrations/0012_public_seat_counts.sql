-- P2-PUB-1 support: the public "Upcoming Hunts" list needs seats-filled per
-- trip, but anon can't read trip_attendees (PII, by design). Expose ONLY the
-- aggregate count via a SECURITY DEFINER function — no attendee data leaks.

create or replace function public.trip_seat_counts()
returns table (trip_id uuid, seats_taken bigint)
language sql
stable
security definer
set search_path = public
as $$
  select trip_id, count(*)::bigint
  from public.trip_attendees
  group by trip_id;
$$;

revoke execute on function public.trip_seat_counts() from public;
grant execute on function public.trip_seat_counts() to anon, authenticated;
