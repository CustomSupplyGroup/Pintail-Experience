-- Consolidate roles to the final set: attendee, staff, founder, admin.
-- (Drops father_in_law + vendor user roles; vendor *vendors* are unaffected —
-- that's a separate vendor_role enum.)

alter type public.user_role rename to user_role_old;
create type public.user_role as enum ('attendee', 'staff', 'founder', 'admin');

alter table public.users alter column role drop default;
alter table public.users
  alter column role type public.user_role
  using (
    case role::text
      when 'father_in_law' then 'staff'
      when 'vendor' then 'attendee'
      else role::text
    end::public.user_role
  );
alter table public.users alter column role set default 'attendee';

drop type public.user_role_old;

-- Full access: founder + admin. Content authoring adds staff.
create or replace function public.has_staff_access()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role in ('founder', 'admin'));
$$;

create or replace function public.has_content_access()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role in ('founder', 'admin', 'staff'));
$$;

revoke execute on function public.has_staff_access() from public, anon;
revoke execute on function public.has_content_access() from public, anon;
grant execute on function public.has_staff_access() to authenticated;
grant execute on function public.has_content_access() to authenticated;

-- New-user trigger now seeds known emails with the right role on first sign-in.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    case lower(new.email)
      when 'jamesclyde91@gmail.com' then 'founder'::public.user_role
      when 'isaac@customsupplygroup.com' then 'admin'::public.user_role
      else 'attendee'::public.user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Set existing accounts to their final roles.
update public.users set role = 'admin' where lower(email) = 'isaac@customsupplygroup.com';
update public.users set role = 'founder' where lower(email) = 'jamesclyde91@gmail.com';
