-- MELLOW Consortium — admin panel support
-- Run this AFTER schema.sql (and seed.sql if you're using it).
--
-- The /admin routes authenticate via Supabase Auth (email/password).
-- Being logged in is not enough to read/write applications or manage
-- news — the RLS policies below additionally require the user's id to
-- be present in `admins`. Add yourself after creating your account:
--
--   1. Supabase dashboard → Authentication → Users → Add user
--      (or have the user sign up once via /admin/login — signups are
--      disabled by default in most projects, so creating via dashboard
--      is the simpler path for a single admin).
--   2. insert into admins (user_id) values ('<that user's UUID>');

create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- `security definer` so this runs with the function owner's privileges
-- (bypasses RLS internally) instead of the caller's. Every admin check
-- in this project goes through this function rather than repeating
-- `exists (select 1 from admins a where a.user_id = auth.uid())` inline
-- — that inline form, when used in `admins`' own policy below, is a
-- SELECT against `admins` that re-triggers `admins`' own RLS policy,
-- which runs the same subquery again, forever ("infinite recursion
-- detected in policy for relation admins", Postgres error 42P17). This
-- function breaks that cycle: it can read `admins` without going
-- through `admins`' RLS at all.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- Admins can see who else is an admin; nobody else can read this table
-- (it's not exposed to any public UI either way).
create policy "admins can read admins" on admins
  for select
  using (public.is_admin());

-- ============================================================
-- Applications — admins can read and update status; still no public
-- select/update (the public-insert-only policy from schema.sql stays).
-- ============================================================
create policy "admins can read applications" on applications
  for select
  using (public.is_admin());

create policy "admins can update applications" on applications
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- News posts — admins get full write access. Public read policy from
-- schema.sql already covers the public-facing /news pages.
-- ============================================================
create policy "admins can insert news_posts" on news_posts
  for insert
  with check (public.is_admin());

create policy "admins can update news_posts" on news_posts
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins can delete news_posts" on news_posts
  for delete
  using (public.is_admin());
