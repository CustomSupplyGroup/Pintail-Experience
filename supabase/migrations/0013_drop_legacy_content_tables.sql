-- P2-ADM-7 · The reusable content library (content_series / content_entries /
-- trip_content) now backs every member + admin read, and the sample rows were
-- migrated in 0010. Drop the legacy per-trip content tables. Their RLS policies
-- and indexes drop with them.

drop table if exists public.devotionals;
drop table if exists public.curriculum_sessions;
