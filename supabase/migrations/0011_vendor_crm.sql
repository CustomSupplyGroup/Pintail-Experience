-- P0-4 · Vendor CRM. Vendors stay a global master list (single source of
-- truth). Add back-office notes + photos, multiple contacts per vendor, and a
-- trip<->vendor join with a role-on-trip. Seed First Light's three vendors.

alter table public.vendors
  add column if not exists notes text,
  add column if not exists photos jsonb not null default '[]'::jsonb;

create table public.vendor_contacts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.trip_vendors (
  trip_id uuid not null references public.trips (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  role_on_trip text,
  created_at timestamptz not null default now(),
  primary key (trip_id, vendor_id)
);

create index idx_vendor_contacts_vendor on public.vendor_contacts (vendor_id);
create index idx_trip_vendors_trip on public.trip_vendors (trip_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.vendor_contacts enable row level security;
alter table public.trip_vendors enable row level security;

-- vendor_contacts hold PII (emails/phones) — staff only, no member/anon read.
create policy vendor_contacts_staff_all on public.vendor_contacts
  for all to authenticated using (public.has_staff_access()) with check (public.has_staff_access());

-- trip_vendors: which vendors serve which trip. Members read for their trips;
-- anon reads for live trips (public trip detail lists vendors); staff manage.
create policy trip_vendors_member_read on public.trip_vendors
  for select to authenticated using (
    public.has_content_access()
    or exists (
      select 1 from public.trip_attendees ta
      where ta.trip_id = trip_vendors.trip_id and ta.user_id = auth.uid()
    )
  );
create policy trip_vendors_anon_read on public.trip_vendors
  for select to anon using (
    exists (select 1 from public.trips t where t.id = trip_vendors.trip_id and t.status = 'live')
  );
create policy trip_vendors_staff_write on public.trip_vendors
  for all to authenticated using (public.has_staff_access()) with check (public.has_staff_access());

-- Seed the inaugural trip's three vendors (by slug + live trip, no hardcoded ids).
insert into public.trip_vendors (trip_id, vendor_id, role_on_trip)
select t.id, v.id,
  case v.slug
    when 'js-migrators' then 'Guides & lodge'
    when 'ruby-ridge-retrievers' then 'Dogs & handlers'
    when 'pintail-goods' then 'Host & outfitter'
    else null
  end
from public.trips t
cross join public.vendors v
where t.status = 'live'
  and v.slug in ('pintail-goods', 'ruby-ridge-retrievers', 'js-migrators')
on conflict do nothing;
