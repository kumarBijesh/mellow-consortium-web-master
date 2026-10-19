-- MELLOW Consortium — fix "infinite recursion detected in policy for
-- relation admins" (Postgres error 42P17)
--
-- Root cause: every admin-gated policy in this project (across admin.sql,
-- profiles-admin-view.sql, and hospitals.sql) checks admin status with
--   exists (select 1 from admins a where a.user_id = auth.uid())
-- which is itself a SELECT against `admins` — subject to `admins`' own
-- RLS. `admins`' own SELECT policy runs that exact same subquery, which
-- triggers its own policy again, forever. Postgres detects the cycle and
-- refuses the query outright. This was never caught in the SQL editor
-- during earlier debugging because the SQL editor runs as the postgres
-- superuser, which bypasses RLS entirely — the recursion only fires for
-- real authenticated requests going through PostgREST/supabase-js.
--
-- Fix: a `security definer` function runs with the privileges of its
-- owner (postgres, when created here), which has BYPASSRLS — so the
-- lookup inside it never re-enters `admins`' RLS policy, breaking the
-- cycle. Every policy below is redefined to call this function instead
-- of repeating the inline subquery.
--
-- Run this after admin.sql, profiles-admin-view.sql, and hospitals.sql
-- (i.e. last, any time after your existing setup).

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ============================================================
-- admins (admin.sql) — the actual source of the recursion.
-- ============================================================
drop policy if exists "admins can read admins" on admins;
create policy "admins can read admins" on admins
  for select using (public.is_admin());

-- ============================================================
-- applications (admin.sql)
-- ============================================================
drop policy if exists "admins can read applications" on applications;
create policy "admins can read applications" on applications
  for select using (public.is_admin());

drop policy if exists "admins can update applications" on applications;
create policy "admins can update applications" on applications
  for update using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- news_posts (admin.sql)
-- ============================================================
drop policy if exists "admins can insert news_posts" on news_posts;
create policy "admins can insert news_posts" on news_posts
  for insert with check (public.is_admin());

drop policy if exists "admins can update news_posts" on news_posts;
create policy "admins can update news_posts" on news_posts
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins can delete news_posts" on news_posts;
create policy "admins can delete news_posts" on news_posts
  for delete using (public.is_admin());

-- ============================================================
-- profiles (profiles-admin-view.sql)
-- ============================================================
drop policy if exists "admins can read all profiles" on profiles;
create policy "admins can read all profiles" on profiles
  for select using (public.is_admin());

-- ============================================================
-- hospitals (hospitals.sql)
-- ============================================================
drop policy if exists "admins can read all hospitals" on hospitals;
create policy "admins can read all hospitals" on hospitals
  for select using (public.is_admin());

drop policy if exists "admins can insert hospitals" on hospitals;
create policy "admins can insert hospitals" on hospitals
  for insert with check (public.is_admin());

drop policy if exists "admins can update hospitals" on hospitals;
create policy "admins can update hospitals" on hospitals
  for update using (public.is_admin());

-- hospital_countries policies used to be re-created here too, but that
-- table is gone — hospitals.countries is a plain text[] column now (see
-- hospitals-countries-array.sql), nothing left to fix RLS recursion on.

-- ============================================================
-- locations (hospitals.sql)
-- ============================================================
drop policy if exists "admins can read all locations" on locations;
create policy "admins can read all locations" on locations
  for select using (public.is_admin());

-- ============================================================
-- provider_profiles (hospitals.sql)
-- ============================================================
drop policy if exists "admins can read all providers" on provider_profiles;
create policy "admins can read all providers" on provider_profiles
  for select using (public.is_admin());

-- ============================================================
-- provider_locations (hospitals.sql)
-- ============================================================
drop policy if exists "admins can read all provider_locations" on provider_locations;
create policy "admins can read all provider_locations" on provider_locations
  for select using (public.is_admin());
