-- MELLOW Consortium — Investigator Registration
-- Backs the new public "Investigator Registration" form at
-- /apply/clinical_investigator, replacing the old generic
-- clinical_investigator persona (which funneled into the
-- hospital/individual_provider account pipeline — wrong outcome for
-- "become a listed investigator on the globe").
--
-- Flow: public submits -> row lands in investigator_registrations with
-- status 'pending' -> admin reviews under Network > Investigator
-- Submissions -> approving resolves institution_name to a real
-- institution_id and creates/updates a row in `investigators`, making
-- them appear on the globe. Rejecting just flips status; no
-- investigators row is created.
--
-- Run this AFTER schema.sql and investigator-inquiries.sql.

-- ============================================================
-- 1. New fields on the real `investigators` table (the columns a
-- registration copies into once approved). `full_name`, `title`,
-- `institution_id`, `bio`, `photo_url` already exist and are reused —
-- `bio` covers the (collapsed) professional biography, `photo_url`
-- covers the profile image, `title` stays as-is for credentials
-- (e.g. "MD, PhD"), distinct from the new `salutation`.
-- ============================================================
-- Private contact fields (personal_email, street_address, city, state,
-- postal_code, cv_path) used to be added here too, but `investigators` is
-- publicly readable, so they now live in the admin-only
-- investigator_private table (see investigator-private.sql).
alter table investigators
  add column if not exists salutation text,
  add column if not exists access_tier text,        -- PI / Sponsor / KOL — display label only, no permission gating
  add column if not exists country text,
  add column if not exists department_focus_area text,
  add column if not exists qualifications text,
  add column if not exists core_competencies text[] not null default '{}',
  add column if not exists publications text[] not null default '{}',
  add column if not exists linkedin_url text,
  add column if not exists website_url text;

-- ============================================================
-- 2. The pending-submission queue
-- ============================================================
create table investigator_registrations (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  investigator_id uuid references investigators(id) on delete set null,  -- set once approved; reused if the same person resubmits an edit

  salutation text,
  first_name text not null,
  middle_name text,
  last_name text not null,
  personal_email text not null,

  access_tier text,                      -- PI / Sponsor / KOL
  institution_name text not null,        -- free text at submission time; admin resolves to a real institution_id at approval

  street_address text,
  city text,
  state text,
  postal_code text,
  country text,

  department_focus_area text,
  professional_bio text,
  qualifications text,
  core_competencies text[] not null default '{}',
  publications text[] not null default '{}',
  linkedin_url text,
  website_url text,

  profile_image_path text,               -- object path in investigator-profile-images
  cv_path text,                          -- object path in investigator-cvs

  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create index idx_investigator_registrations_status on investigator_registrations(status);

alter table investigator_registrations enable row level security;

-- Public can submit a registration (same public-insert-only pattern as
-- applications/investigator_inquiries); no public read/update — only
-- admin reviews these.
create policy "public can submit investigator registrations" on investigator_registrations
  for insert
  with check (true);

create policy "admins can read investigator registrations" on investigator_registrations
  for select using (public.is_admin());

create policy "admins can update investigator registrations" on investigator_registrations
  for update using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 3. Storage — profile image (public, shown on the globe/admin once
-- approved, same pattern as event-images) and CV (private; admin-only
-- read, since a resume is sensitive personal data with no public
-- display surface today).
-- ============================================================
insert into storage.buckets (id, name, public)
values ('investigator-profile-images', 'investigator-profile-images', true)
on conflict (id) do nothing;

create policy "public read investigator-profile-images" on storage.objects
  for select using (bucket_id = 'investigator-profile-images');

create policy "public can upload investigator-profile-images" on storage.objects
  for insert with check (bucket_id = 'investigator-profile-images');

create policy "admins can delete investigator-profile-images" on storage.objects
  for delete using (bucket_id = 'investigator-profile-images' and public.is_admin());

insert into storage.buckets (id, name, public)
values ('investigator-cvs', 'investigator-cvs', false)
on conflict (id) do nothing;

create policy "public can upload investigator-cvs" on storage.objects
  for insert with check (bucket_id = 'investigator-cvs');

create policy "admins can read investigator-cvs" on storage.objects
  for select using (bucket_id = 'investigator-cvs' and public.is_admin());

create policy "admins can delete investigator-cvs" on storage.objects
  for delete using (bucket_id = 'investigator-cvs' and public.is_admin());

-- ============================================================
-- 4. Clean up the one pre-existing clinical_investigator application —
-- confirmed test junk (contact_name "qwsqqs", organization_name
-- "TaskPay"), status was hand-flipped to 'accepted' without ever
-- actually provisioning an account (created_hospital_id is null).
-- Nothing real to preserve; the persona/route this belonged to is
-- being retired in favor of investigator_registrations.
-- ============================================================
delete from applications where persona_type = 'clinical_investigator';
