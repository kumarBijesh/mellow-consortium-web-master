-- MELLOW Consortium — "Add Mellow Member" (admin-created in-house providers).
-- Run any time after hospitals.sql, applications-account-pipeline.sql,
-- provider-dashboard.sql, provider-dashboard-depth.sql and
-- fix-hospitals-provider-recursion.sql. Safe to re-run.
--
-- A Mellow Member is an ordinary provider_profiles row whose hospital is
-- the one internal "Mellow Consortium" org (hospitals.kind = 'internal').
-- Same invite -> set password -> /provider dashboard flow as any
-- hospital-created provider; the only difference is Admin creates it,
-- not a hospital user. Investigators are unaffected (directory-only).

-- ============================================================
-- 1. The internal org row — deferred from applications-account-pipeline.sql
-- ("Step C"). Nobody signs in as this org (user_id stays null); it only
-- exists so Mellow Members have a hospital_id like every other provider.
-- admin_email is not null + unique on hospitals, so it gets a reserved
-- .invalid address that can never receive mail.
-- ============================================================
create unique index if not exists hospitals_single_internal_org
  on hospitals (kind) where kind = 'internal';

insert into hospitals (name, admin_email, kind, status, countries)
select 'Mellow Consortium', 'internal-org@mellow-consortium.invalid', 'internal', 'ACTIVE', '{}'
where not exists (select 1 from hospitals where kind = 'internal');

-- ============================================================
-- 2. provider_profiles — profile fields from the 4-step reference form.
-- Reuses existing columns where they already mean the same thing:
--   specialty      <- Department / Focus Area
--   bio            <- Professional Biography   (provider-dashboard.sql)
--   credentials    <- Qualifications / Credentials
--   city, state_province                        (provider-dashboard-depth.sql)
-- `name` stays the display name; the split name parts are kept alongside it.
-- ============================================================
alter table provider_profiles
  add column if not exists salutation text,
  add column if not exists first_name text,
  add column if not exists middle_name text,
  add column if not exists last_name text,
  add column if not exists street_address text,
  add column if not exists postal_code text,
  add column if not exists country text,
  add column if not exists core_competencies text[] not null default '{}',
  add column if not exists professional_background text,
  add column if not exists publications text[] not null default '{}',
  add column if not exists linkedin_url text,
  add column if not exists website_url text,
  add column if not exists profile_image_path text,  -- object path in provider-profile-images
  add column if not exists cv_path text;             -- object path in provider-cvs

-- ============================================================
-- 3. Admin insert path. Admins only have SELECT on provider_profiles
-- (hospitals.sql), and a plain "admins can insert" policy that checks
-- hospitals.kind would re-enter the hospitals <-> provider_profiles RLS
-- cycle fixed in fix-hospitals-provider-recursion.sql. A security
-- definer function sidesteps RLS entirely and does its own is_admin()
-- check, and it can only ever write into the internal org.
-- ============================================================
create or replace function public.admin_create_mellow_member(
  p_provider_user_id uuid,
  p_email text,
  p_name text,
  p_salutation text,
  p_first_name text,
  p_middle_name text,
  p_last_name text,
  p_street_address text,
  p_city text,
  p_state_province text,
  p_postal_code text,
  p_country text,
  p_specialty text,
  p_bio text,
  p_credentials text,
  p_core_competencies text[],
  p_professional_background text,
  p_publications text[],
  p_linkedin_url text,
  p_website_url text,
  p_profile_image_path text,
  p_cv_path text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_provider_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can create Mellow Members' using errcode = '42501';
  end if;

  select id into v_org_id from hospitals where kind = 'internal' limit 1;
  if v_org_id is null then
    raise exception 'Internal Mellow Consortium org is missing; run mellow-members.sql' using errcode = 'P0002';
  end if;

  insert into provider_profiles (
    hospital_id, provider_user_id, email, name,
    salutation, first_name, middle_name, last_name,
    street_address, city, state_province, postal_code, country,
    specialty, bio, credentials, core_competencies, professional_background, publications,
    linkedin_url, website_url, profile_image_path, cv_path
  ) values (
    v_org_id, p_provider_user_id, p_email, p_name,
    p_salutation, p_first_name, p_middle_name, p_last_name,
    p_street_address, p_city, p_state_province, p_postal_code, p_country,
    p_specialty, p_bio, p_credentials, coalesce(p_core_competencies, '{}'), p_professional_background, coalesce(p_publications, '{}'),
    p_linkedin_url, p_website_url, p_profile_image_path, p_cv_path
  )
  returning id into v_provider_id;

  return v_provider_id;
end;
$$;

revoke all on function public.admin_create_mellow_member from public, anon;
grant execute on function public.admin_create_mellow_member to authenticated;

-- ============================================================
-- 4. Storage — same split as investigator-registrations.sql: profile
-- image public, CV private. Uploads are admin-only here (the wizard is
-- the only writer); the provider can read their own CV.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('provider-profile-images', 'provider-profile-images', true)
on conflict (id) do nothing;

drop policy if exists "public read provider-profile-images" on storage.objects;
create policy "public read provider-profile-images" on storage.objects
  for select using (bucket_id = 'provider-profile-images');

drop policy if exists "admins can upload provider-profile-images" on storage.objects;
create policy "admins can upload provider-profile-images" on storage.objects
  for insert with check (bucket_id = 'provider-profile-images' and public.is_admin());

drop policy if exists "admins can delete provider-profile-images" on storage.objects;
create policy "admins can delete provider-profile-images" on storage.objects
  for delete using (bucket_id = 'provider-profile-images' and public.is_admin());

insert into storage.buckets (id, name, public)
values ('provider-cvs', 'provider-cvs', false)
on conflict (id) do nothing;

drop policy if exists "admins can upload provider-cvs" on storage.objects;
create policy "admins can upload provider-cvs" on storage.objects
  for insert with check (bucket_id = 'provider-cvs' and public.is_admin());

drop policy if exists "admins can read provider-cvs" on storage.objects;
create policy "admins can read provider-cvs" on storage.objects
  for select using (bucket_id = 'provider-cvs' and public.is_admin());

drop policy if exists "admins can delete provider-cvs" on storage.objects;
create policy "admins can delete provider-cvs" on storage.objects
  for delete using (bucket_id = 'provider-cvs' and public.is_admin());

drop policy if exists "provider can read own cv" on storage.objects;
create policy "provider can read own cv" on storage.objects
  for select using (
    bucket_id = 'provider-cvs'
    and exists (select 1 from provider_profiles pp where pp.cv_path = storage.objects.name and pp.provider_user_id = auth.uid())
  );
