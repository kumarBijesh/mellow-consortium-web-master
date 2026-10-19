-- MELLOW Consortium — Supabase schema
-- Plain Postgres + RLS only (no Supabase-specific extensions relied on)
-- so this ports cleanly to AWS RDS/Aurora later.

-- ============================================================
-- Divisions (Consortium / MELLOW-Age / JLIVE / Conferences / News)
-- Mostly static, editable by you/dev team directly in the table.
-- ============================================================
create table divisions (
  id text primary key,                 -- 'consortium' | 'age' | 'jlive' | 'conferences' | 'news'
  name text not null,
  kicker text not null,                -- e.g. 'Research Network'
  description text not null,
  accent_color text not null,          -- hex, matches design tokens
  external_url text,                   -- link to MELLOW-Age app etc.
  sort_order int not null default 0
);

-- ============================================================
-- Institutions & Investigators
-- ============================================================
create table institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  city text,
  website text,
  logo_url text,
  created_at timestamptz not null default now()
);

create table investigators (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  title text,                          -- e.g. 'MD, PhD'
  institution_id uuid references institutions(id) on delete set null,
  bio text,
  photo_url text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Trials
-- ============================================================
create table trials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  status text not null default 'active' check (status in ('active','recruiting','completed','planned')),
  therapeutic_area text,                -- e.g. 'Metabolic', 'Cognitive'
  lead_investigator_id uuid references investigators(id) on delete set null,
  sponsor_institution_id uuid references institutions(id) on delete set null,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now()
);

create table trial_sites (
  id uuid primary key default gen_random_uuid(),
  trial_id uuid not null references trials(id) on delete cascade,
  country text not null,
  city text,
  institution_id uuid references institutions(id) on delete set null
);

-- ============================================================
-- News & Founders (site content)
-- ============================================================
create table news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  division_id text references divisions(id),
  excerpt text,
  body text,
  cover_image_url text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table founders (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  title text,
  bio text,
  photo_url text,
  sort_order int not null default 0
);

-- ============================================================
-- Applications — one table for every persona sign-up path.
-- persona_type + jsonb form_data absorbs field changes without
-- schema churn while the form fields are still settling.
-- ============================================================
create type persona_type as enum (
  'biotech_company',
  'clinical_investigator',
  'academic_institution',
  'individual',
  'healthcare_provider',
  'hospital_wellness_group',
  'journal_conference_partner'
);

create type application_status as enum ('new', 'in_review', 'accepted', 'rejected');

create table applications (
  id uuid primary key default gen_random_uuid(),
  persona_type persona_type not null,
  contact_name text not null,
  contact_email text not null,
  organization_name text,
  country text,
  form_data jsonb not null default '{}'::jsonb,   -- persona-specific fields
  status application_status not null default 'new',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create index idx_applications_persona_type on applications(persona_type);
create index idx_applications_status on applications(status);

-- ============================================================
-- Row Level Security
-- Content tables: public read, no public write (writes come from
-- an authenticated admin role or the Supabase dashboard for now).
-- applications: public INSERT only (anyone can apply), no public
-- read/update — only your service role / admin can review them.
-- ============================================================
alter table divisions enable row level security;
alter table institutions enable row level security;
alter table investigators enable row level security;
alter table trials enable row level security;
alter table trial_sites enable row level security;
alter table news_posts enable row level security;
alter table founders enable row level security;
alter table applications enable row level security;

create policy "public read divisions" on divisions for select using (true);
create policy "public read institutions" on institutions for select using (true);
create policy "public read investigators" on investigators for select using (true);
create policy "public read trials" on trials for select using (true);
create policy "public read trial_sites" on trial_sites for select using (true);
create policy "public read news_posts" on news_posts for select using (true);
create policy "public read founders" on founders for select using (true);

create policy "public can submit applications" on applications
  for insert
  with check (true);

-- No select/update/delete policy on applications for the anon role —
-- intentional. Review those from the Supabase dashboard or a
-- service-role-backed admin route until an internal admin UI exists.

-- ============================================================
-- Seed the 5 divisions (matches the reference design's ecosystem grid)
-- ============================================================
insert into divisions (id, name, kicker, description, accent_color, sort_order) values
  ('consortium', 'MELLOW Consortium', 'Research Network', 'Harmonized multinational trials, industry partnerships, institutions, and investigators.', '#006EB6', 1),
  ('age', 'MELLOW-Age', 'Digital Platform', 'Biological-age intelligence and personalized, localized wellness planning.', '#15A8A0', 2),
  ('jlive', 'JLIVE', 'Publishing', 'Rigorous, fair peer review in longevity and integrated vitality evidence.', '#6B4EC7', 3),
  ('conferences', 'Conferences', 'Community', 'Global scientific events, member discounts, and the MELLOW Annual Meeting.', '#D9B447', 4),
  ('news', 'News & Updates', 'Media', 'Consortium news, blogs, discoveries, and global updates from the network.', '#E8735A', 5);
