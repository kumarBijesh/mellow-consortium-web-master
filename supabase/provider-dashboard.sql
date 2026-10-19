-- MELLOW Consortium — Provider dashboard (Phase 2)
-- Run any time after hospitals.sql (needs public.is_admin() from
-- admin.sql and provider_profiles from hospitals.sql).
--
-- Adds the missing link between patients (profiles/auth.users) and the
-- hospital/location/provider hierarchy from Phase 1 — nothing before
-- this connected a patient to a provider at all.
--
-- Reports/biomarker data and the risk-category view are deliberately
-- NOT part of this migration — no such table exists anywhere in this
-- project yet, and guessing at its shape would risk building against
-- fields that don't match the real reference implementation.

-- ============================================================
-- patient_provider_connections — one row is both a request AND (once
-- approved) the "patient is connected to this provider" relationship.
-- Also doubles as the thread key for messages/recommendations below.
-- ============================================================
create table patient_provider_connections (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid not null references provider_profiles(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACTIVE', 'DECLINED')),
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (patient_id, provider_id)
);

-- Hospital -> many providers -> many patients, and (per the Role
-- Hierarchy & Data-Sharing Spec v2) a patient can hold multiple ACTIVE
-- connections at once too — no uniqueness restriction on patient_id.
-- (An earlier version of this file added one; it was dropped in
-- patient-provider-many-to-many.sql and isn't recreated here.)

alter table patient_provider_connections enable row level security;

create policy "patient can read own connections" on patient_provider_connections
  for select using (patient_id = auth.uid());
-- Patients can only ever create a PENDING request — flipping straight
-- to ACTIVE/DECLINED is the provider's call, enforced by "with check".
create policy "patient can request a connection" on patient_provider_connections
  for insert with check (patient_id = auth.uid() and status = 'PENDING');

create policy "provider can read own connections" on patient_provider_connections
  for select using (exists (
    select 1 from provider_profiles pp
    where pp.id = patient_provider_connections.provider_id and pp.provider_user_id = auth.uid()
  ));
create policy "provider can respond to own connections" on patient_provider_connections
  for update using (exists (
    select 1 from provider_profiles pp
    where pp.id = patient_provider_connections.provider_id and pp.provider_user_id = auth.uid()
  ));

create policy "admins can read all connections" on patient_provider_connections
  for select using (public.is_admin());

-- ============================================================
-- messages — a connection IS the thread; no separate threads table.
-- Only usable once the connection is ACTIVE.
-- ============================================================
create table messages (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references patient_provider_connections(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

create policy "connection participants can read messages" on messages
  for select using (exists (
    select 1 from patient_provider_connections c
    left join provider_profiles pp on pp.id = c.provider_id
    where c.id = messages.connection_id
      and c.status = 'ACTIVE'
      and (c.patient_id = auth.uid() or pp.provider_user_id = auth.uid())
  ));
create policy "connection participants can send messages" on messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from patient_provider_connections c
      left join provider_profiles pp on pp.id = c.provider_id
      where c.id = messages.connection_id
        and c.status = 'ACTIVE'
        and (c.patient_id = auth.uid() or pp.provider_user_id = auth.uid())
    )
  );

-- ============================================================
-- provider_recommendations — provider leaves a note on a patient's
-- file. patient_id/provider_id are denormalized (not just derived via
-- connection_id) to keep the read policies a single join instead of
-- two, matching how provider_locations already stores both sides of
-- its relationship directly rather than forcing a longer join chain.
-- ============================================================
create table provider_recommendations (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references patient_provider_connections(id) on delete cascade,
  provider_id uuid not null references provider_profiles(id) on delete cascade,
  patient_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table provider_recommendations enable row level security;

create policy "provider can read own recommendations" on provider_recommendations
  for select using (exists (
    select 1 from provider_profiles pp where pp.id = provider_recommendations.provider_id and pp.provider_user_id = auth.uid()
  ));
create policy "provider can insert own recommendations" on provider_recommendations
  for insert with check (exists (
    select 1 from provider_profiles pp where pp.id = provider_recommendations.provider_id and pp.provider_user_id = auth.uid()
  ));
-- Patient-side display is Phase 3 (patient dashboard) work, but the
-- policy is added now so no further RLS change is needed when that's
-- built.
create policy "patient can read own recommendations" on provider_recommendations
  for select using (patient_id = auth.uid());

-- ============================================================
-- provider_profiles — self-service profile editing didn't exist before
-- (only the owning hospital could write to this table).
-- ============================================================
alter table provider_profiles
  add column if not exists credentials text,
  add column if not exists bio text;

create policy "provider can update own profile" on provider_profiles
  for update using (provider_user_id = auth.uid());

-- ============================================================
-- profiles — providers need to read the name/email of patients who've
-- requested or hold a connection with them (both PENDING and ACTIVE,
-- since the requests queue has to show who's asking before it's
-- approved). Without this, profiles' existing "own row only" / admin
-- policies would silently return zero rows for a provider's queries —
-- not an error, just blank names throughout the provider dashboard.
-- ============================================================
create policy "provider can read connected patient profiles" on profiles
  for select using (exists (
    select 1 from patient_provider_connections c
    join provider_profiles pp on pp.id = c.provider_id
    where c.patient_id = profiles.id and pp.provider_user_id = auth.uid()
  ));

-- ============================================================
-- hospitals — the provider profile page shows which hospital a
-- provider belongs to (a simple embedded join). hospitals.sql never
-- gave providers read access to their own hospital row at all — same
-- silent-empty-result gap as the profiles policy above.
--
-- Goes through public.my_provider_hospital_id() (a `security definer`
-- helper, same technique as is_admin() in admin.sql) rather than an
-- inline `exists (select 1 from provider_profiles ...)` — that inline
-- form is a SELECT against provider_profiles, whose own "hospital can
-- read own providers" policy (hospitals.sql) is a SELECT against
-- hospitals, which re-triggers this policy again: infinite recursion,
-- Postgres error 42P17 ("infinite recursion detected in policy for
-- relation hospitals"). See fix-hospitals-provider-recursion.sql for
-- the full explanation and the patch for databases that already ran
-- the old version of this file.
-- ============================================================
create or replace function public.my_provider_hospital_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select hospital_id from provider_profiles where provider_user_id = auth.uid() limit 1;
$$;

create policy "provider can read own hospital" on hospitals
  for select using (id = public.my_provider_hospital_id());

-- ============================================================
-- Patient-facing "request a provider" page (/dashboard/patient/providers)
-- needs to browse hospitals and their active providers before any
-- connection exists — nothing currently lets a patient read either
-- table. Scoped to ACTIVE rows only (an onboarded hospital's name and
-- an active provider's name/specialty aren't sensitive — this is a
-- directory, the same shape as the public institutions/trials tables
-- elsewhere in this schema).
-- ============================================================
create policy "patients can read active hospitals" on hospitals
  for select using (status = 'ACTIVE');

create policy "patients can read active providers" on provider_profiles
  for select using (status = 'ACTIVE');
