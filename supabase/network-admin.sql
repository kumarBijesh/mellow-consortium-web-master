-- MELLOW Consortium — admin write access for institutions/investigators/
-- trials/trial_sites, plus new publications + platform_settings tables.
-- Run this AFTER schema.sql, institutions-geo.sql, and admin.sql.
--
-- schema.sql only ever granted PUBLIC READ on institutions/investigators/
-- trials/trial_sites — there was no way to write to them outside the
-- Supabase SQL console. This adds admin write policies (same
-- public.is_admin() gate used for news_posts/applications in admin.sql)
-- so the new /admin/network UI can manage them.

create policy "admins can insert institutions" on institutions for insert with check (public.is_admin());
create policy "admins can update institutions" on institutions for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete institutions" on institutions for delete using (public.is_admin());

create policy "admins can insert investigators" on investigators for insert with check (public.is_admin());
create policy "admins can update investigators" on investigators for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete investigators" on investigators for delete using (public.is_admin());

create policy "admins can insert trials" on trials for insert with check (public.is_admin());
create policy "admins can update trials" on trials for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete trials" on trials for delete using (public.is_admin());

create policy "admins can insert trial_sites" on trial_sites for insert with check (public.is_admin());
create policy "admins can update trial_sites" on trial_sites for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete trial_sites" on trial_sites for delete using (public.is_admin());

-- ============================================================
-- Publications — backs the public "Publications" stat. No content
-- model existed anywhere for this (JLIVE, the publishing arm, is still
-- a coming-soon stub), so this is intentionally minimal: enough to
-- list and count real publications, not a full journal CMS.
-- ============================================================
create table publications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text,
  journal text,
  published_on date,
  url text,
  trial_id uuid references trials(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table publications enable row level security;

create policy "public read publications" on publications for select using (true);
create policy "admins can insert publications" on publications for insert with check (public.is_admin());
create policy "admins can update publications" on publications for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete publications" on publications for delete using (public.is_admin());

-- ============================================================
-- Platform settings — single-row-per-key store for public stats that
-- are NOT derived from platform data, e.g. the "$610B Longevity
-- Market" figure. Unlike every other public stat this can't be a
-- COUNT query — it's an external market-size estimate that only a
-- human can source and update. Storing it here (with a mandatory
-- source field) keeps it admin-editable and auditable instead of a
-- silent hardcoded constant in a component.
-- ============================================================
create table platform_settings (
  key text primary key,
  numeric_value numeric,
  unit text,
  source text,
  updated_at timestamptz not null default now()
);

alter table platform_settings enable row level security;

create policy "public read platform_settings" on platform_settings for select using (true);
create policy "admins can insert platform_settings" on platform_settings for insert with check (public.is_admin());
create policy "admins can update platform_settings" on platform_settings for update using (public.is_admin()) with check (public.is_admin());

-- Seeded with the figure the site already displayed. The source field
-- is intentionally a placeholder — flag this for a human to fill in
-- with a real cited market-research source before relying on it.
insert into platform_settings (key, numeric_value, unit, source) values
  ('longevity_market', 610, 'B', 'NEEDS REAL SOURCE: placeholder carried over from the original design. Update via Admin → Network → Market Stat.');
