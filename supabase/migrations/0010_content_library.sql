-- P0-3 · Reusable content library (merges devotionals + curriculum).
-- A `content_series` is a reusable set (devotional or curriculum). Its
-- `content_entries` are the days/sessions, scheduled by `day_offset` from a
-- trip's start_date. `trip_content` assigns a series to a trip, so one series
-- adapts to any trip length. Old `devotionals` / `curriculum_sessions` tables
-- stay until Phase 2 switches the reads over; then a later migration drops them.

create type public.content_kind as enum ('devotional', 'curriculum');

create table public.content_series (
  id uuid primary key default gen_random_uuid(),
  kind public.content_kind not null,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.content_entries (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.content_series (id) on delete cascade,
  day_offset int,                       -- days from trip.start_date; null = unscheduled (curriculum)
  sort int not null default 0,
  title text not null,
  body_md text,
  scripture_reference text,
  audio_mux_id text,
  video_mux_id text,
  discussion_questions jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.trip_content (
  trip_id uuid not null references public.trips (id) on delete cascade,
  series_id uuid not null references public.content_series (id) on delete cascade,
  primary key (trip_id, series_id)
);

create index idx_content_entries_series on public.content_entries (series_id);
create index idx_trip_content_trip on public.trip_content (trip_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.content_series enable row level security;
alter table public.content_entries enable row level security;
alter table public.trip_content enable row level security;

-- trip_content: assignment rows. Members see assignments for trips they're on;
-- anon sees assignments for live trips (public trip detail); staff manage.
create policy trip_content_member_read on public.trip_content
  for select to authenticated using (
    public.has_content_access()
    or exists (
      select 1 from public.trip_attendees ta
      where ta.trip_id = trip_content.trip_id and ta.user_id = auth.uid()
    )
  );
create policy trip_content_anon_read on public.trip_content
  for select to anon using (
    exists (select 1 from public.trips t where t.id = trip_content.trip_id and t.status = 'live')
  );
create policy trip_content_staff_write on public.trip_content
  for all to authenticated using (public.has_staff_access()) with check (public.has_staff_access());

-- content_series: readable if the series is assigned to a trip the caller can see.
create policy content_series_member_read on public.content_series
  for select to authenticated using (
    public.has_content_access()
    or exists (
      select 1 from public.trip_content tc
      join public.trip_attendees ta on ta.trip_id = tc.trip_id
      where tc.series_id = content_series.id and ta.user_id = auth.uid()
    )
  );
create policy content_series_anon_read on public.content_series
  for select to anon using (
    exists (
      select 1 from public.trip_content tc
      join public.trips t on t.id = tc.trip_id
      where tc.series_id = content_series.id and t.status = 'live'
    )
  );
create policy content_series_staff_write on public.content_series
  for all to authenticated using (public.has_staff_access()) with check (public.has_staff_access());

-- content_entries: members read PUBLISHED entries for series on their trips;
-- anon reads published entries for series on live trips; content staff read/write all.
create policy content_entries_member_read on public.content_entries
  for select to authenticated using (
    public.has_content_access()
    or (
      published = true
      and exists (
        select 1 from public.trip_content tc
        join public.trip_attendees ta on ta.trip_id = tc.trip_id
        where tc.series_id = content_entries.series_id and ta.user_id = auth.uid()
      )
    )
  );
create policy content_entries_anon_read on public.content_entries
  for select to anon using (
    published = true
    and exists (
      select 1 from public.trip_content tc
      join public.trips t on t.id = tc.trip_id
      where tc.series_id = content_entries.series_id and t.status = 'live'
    )
  );
create policy content_entries_content_write on public.content_entries
  for all to authenticated using (public.has_content_access()) with check (public.has_content_access());

-- ============================================================
-- Migrate existing sample content into the library (no hardcoded ids).
-- ============================================================
do $$
declare
  dev_series uuid := gen_random_uuid();
  cur_series uuid := gen_random_uuid();
  t uuid;
  has_dev boolean := exists (select 1 from public.devotionals);
  has_cur boolean := exists (select 1 from public.curriculum_sessions);
begin
  if has_dev then
    insert into public.content_series (id, kind, title, description)
    values (dev_series, 'devotional', 'First Light — Devotionals',
            'Daily devotionals leading into and through the hunt.');

    insert into public.content_entries
      (series_id, day_offset, sort, title, body_md, scripture_reference, audio_mux_id, published)
    select dev_series, d.day_offset, coalesce(d.day_offset, 0), d.title, d.written_content,
           d.scripture, d.audio_mux_id,
           (d.scheduled_for is not null and d.scheduled_for <= now())
    from public.devotionals d;

    for t in select distinct trip_id from public.devotionals loop
      insert into public.trip_content (trip_id, series_id) values (t, dev_series)
      on conflict do nothing;
    end loop;
  end if;

  if has_cur then
    insert into public.content_series (id, kind, title, description)
    values (cur_series, 'curriculum', 'First Light — Curriculum',
            'Teaching sessions for the trip.');

    insert into public.content_entries
      (series_id, day_offset, sort, title, body_md, scripture_reference, audio_mux_id, video_mux_id, discussion_questions, published)
    select cur_series, null, c.session_number, c.title, c.written_content,
           c.scripture_reference, c.audio_mux_id, c.video_mux_id, c.discussion_questions,
           (c.published_at is not null)
    from public.curriculum_sessions c;

    for t in select distinct trip_id from public.curriculum_sessions loop
      insert into public.trip_content (trip_id, series_id) values (t, cur_series)
      on conflict do nothing;
    end loop;
  end if;
end $$;
