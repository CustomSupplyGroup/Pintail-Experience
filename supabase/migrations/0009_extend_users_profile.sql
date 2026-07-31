-- P0-2 · Extend members (users) into a persistent community profile.
-- `bio` already exists (from 0001). Add photo, member_since, city.
-- RLS already lets a member read/update their own row and staff read all
-- (users_update_own + users_staff_all from 0001), so no policy change needed.

alter table public.users
  add column if not exists photo_url text,
  add column if not exists member_since timestamptz not null default now(),
  add column if not exists city text;

-- Members have existed since their account was created.
update public.users set member_since = created_at where member_since is null;
