-- P0-1 · Extend trips into the Experience entity (multi-trip + capacity).
-- The `trips` table IS the Experience. We do NOT rename it. We add the fields a
-- named, capacity-bound hunt needs, plus a planning_status for the admin Hunts
-- board (Kanban), and backfill the inaugural trip: First Light.

-- Planning lifecycle for the admin Hunts board (drives card columns + dashboard).
create type public.planning_status as enum
  ('scoping', 'booked', 'prepping', 'ready', 'live', 'wrapped');

alter table public.trips
  add column if not exists experience_type text,
  add column if not exists capacity int,
  add column if not exists tagline text,
  add column if not exists subtitle text,
  add column if not exists planning_status public.planning_status not null default 'scoping',
  add column if not exists planning_owner_id uuid references public.users (id) on delete set null;

-- Backfill the inaugural trip (LOCKED: First Light, duck, capacity 16).
update public.trips
set
  name = 'First Light',
  slug = 'first-light',
  experience_type = 'duck',
  capacity = 16,
  tagline = 'Reelfoot & the Mississippi river bottoms',
  subtitle = '4-day duck · Dec 30 – Jan 3',
  status = 'live',
  planning_status = 'prepping'
where slug = 'december-2026' or name = 'The Pintail Experience';
