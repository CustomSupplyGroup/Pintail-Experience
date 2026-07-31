-- Payment tracking (no in-app processing — amounts are recorded by staff, and
-- guests pay via an external link, per v1 scope). Money is stored in integer
-- cents to avoid floating-point drift.

alter table public.trips
  add column if not exists price_cents int,      -- total per guest
  add column if not exists deposit_cents int,    -- required deposit (optional)
  add column if not exists payment_url text;      -- external pay link (WeTravel/Stripe)

alter table public.trip_attendees
  add column if not exists amount_paid_cents int not null default 0;

-- Seed First Light's price from the existing public copy ($2,400 / guest).
update public.trips set price_cents = 240000
where status = 'live' and price_cents is null;
