-- MELLOW Consortium — real events/conferences data model.
-- Run this AFTER schema.sql and admin.sql.
-- Backs /conferences: public read, admin write (same pattern as
-- institutions/trials — see supabase/network-admin.sql).

create type event_type as enum ('conference', 'webinar', 'workshop', 'meeting', 'consortium', 'other');

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  event_type event_type not null default 'conference',
  start_date date not null,
  end_date date,                          -- null = single-day event
  is_virtual boolean not null default false,
  location text,                          -- city/venue text; ignored when is_virtual
  tags text[] not null default '{}',
  cover_image_url text,
  created_at timestamptz not null default now()
);

create index idx_events_start_date on events(start_date);
create index idx_events_event_type on events(event_type);

alter table events enable row level security;

create policy "public read events" on events for select using (true);
create policy "admins can insert events" on events for insert with check (public.is_admin());
create policy "admins can update events" on events for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete events" on events for delete using (public.is_admin());

-- ============================================================
-- Seed: 5 placeholder events spanning types/dates, clearly not real
-- announcements — swap for real events via /admin/network/events.
-- ============================================================
insert into events (title, slug, description, event_type, start_date, end_date, is_virtual, location, tags, cover_image_url) values
  (
    'MELLOW Annual Meeting 2027',
    'mellow-annual-meeting-2027',
    'The Consortium''s flagship gathering: three days of plenary sessions, poster tracks, and member-institution updates on the current trial portfolio.',
    'conference',
    '2027-03-15', '2027-03-17',
    false, 'Singapore',
    array['Longevity', 'Consortium', 'Networking'],
    null
  ),
  (
    'Biological Age Clocks: State of the Field',
    'biological-age-clocks-webinar',
    'A live session on validation approaches for biological-age biomarkers, featuring lead investigators from the MELLOW-CLOCK study.',
    'webinar',
    '2026-11-04', null,
    true, null,
    array['Biomarkers', 'Data Science', 'Longevity'],
    null
  ),
  (
    'Microbiome & Metabolic Health Workshop',
    'microbiome-metabolic-health-workshop',
    'A hands-on workshop for investigators working on microbiome-linked metabolic ageing endpoints, run in partnership with the Consortium''s Metabolic track.',
    'workshop',
    '2026-12-09', '2026-12-10',
    false, 'Stockholm, Sweden',
    array['Microbiome', 'Metabolic'],
    null
  ),
  (
    'Q1 Member Institution Sync',
    'q1-member-institution-sync',
    'Quarterly coordination meeting for all seven member institutions to review shared-protocol progress and upcoming site enrollment.',
    'meeting',
    '2027-01-20', null,
    true, null,
    array['Consortium'],
    null
  ),
  (
    'JLIVE Editorial Symposium',
    'jlive-editorial-symposium',
    'An open symposium on peer-review standards for longevity and integrated vitality evidence, hosted by the JLIVE editorial board.',
    'other',
    '2027-02-11', null,
    false, 'Cologne, Germany',
    array['Publishing', 'Longevity'],
    null
  );
