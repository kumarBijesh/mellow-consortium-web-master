-- MELLOW Consortium — provider dashboard depth: biomarker reports (real,
-- provider-entered — no fabricated scoring), care plans, meeting link,
-- and provider location fields. AI-generated recommendations are
-- deliberately NOT part of this migration — that needs its own scoping
-- conversation (LLM provider, cost, prompt design), same as the
-- video-consult deferral from earlier Phase 5 notes.
--
-- Run any time after provider-dashboard.sql.

-- ============================================================
-- biomarker_reports — one row per lab report a provider logs for a
-- patient, connection-scoped like visits/messages/documents already
-- are. risk_level is the provider's own judgment call, not a computed
-- score — there's no real scoring algorithm to build against, so this
-- doesn't invent one.
-- ============================================================
create table biomarker_reports (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references patient_provider_connections(id) on delete cascade,
  patient_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid not null references provider_profiles(id) on delete cascade,
  recorded_date date not null default current_date,
  biological_age numeric,
  chronological_age numeric,
  crp numeric,
  glucose numeric,
  risk_level text check (risk_level in ('Very low', 'Low', 'Moderate', 'High')),
  notes text,
  created_at timestamptz not null default now()
);

alter table biomarker_reports enable row level security;

create policy "patient can read own biomarker reports" on biomarker_reports
  for select using (patient_id = auth.uid());

create policy "provider can read own logged biomarker reports" on biomarker_reports
  for select using (exists (
    select 1 from provider_profiles pp where pp.id = biomarker_reports.provider_id and pp.provider_user_id = auth.uid()
  ));
create policy "provider can log biomarker reports for own connections" on biomarker_reports
  for insert with check (exists (
    select 1 from provider_profiles pp where pp.id = biomarker_reports.provider_id and pp.provider_user_id = auth.uid()
  ));

-- ============================================================
-- care_plans — one editable plan per connection (upsert by
-- connection_id), pushed to the patient's own view. Provider-authored
-- free text throughout, same trust model as provider_recommendations.
-- ============================================================
create table care_plans (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references patient_provider_connections(id) on delete cascade unique,
  patient_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid not null references provider_profiles(id) on delete cascade,
  diet_plan text,
  exercise_protocol text,
  yoga text,
  meditation text,
  medications text,
  cautions text,
  clinical_note text,
  updated_at timestamptz not null default now()
);

alter table care_plans enable row level security;

create policy "patient can read own care plan" on care_plans
  for select using (patient_id = auth.uid());

create policy "provider can read own care plans" on care_plans
  for select using (exists (
    select 1 from provider_profiles pp where pp.id = care_plans.provider_id and pp.provider_user_id = auth.uid()
  ));
create policy "provider can insert own care plans" on care_plans
  for insert with check (exists (
    select 1 from provider_profiles pp where pp.id = care_plans.provider_id and pp.provider_user_id = auth.uid()
  ));
create policy "provider can update own care plans" on care_plans
  for update using (exists (
    select 1 from provider_profiles pp where pp.id = care_plans.provider_id and pp.provider_user_id = auth.uid()
  ));

-- ============================================================
-- patient_provider_connections — a provider can now also create a new
-- connection directly (invitePatient(), the reverse of
-- requestConnection()), not just respond to one a patient already
-- started. Distinct from the patient's own insert policy (which only
-- allows status='PENDING') — this one only allows a provider to insert
-- for their OWN provider_id, and only as ACTIVE (immediate enrollment,
-- not a request the patient has to separately accept — we have no
-- reverse-accept UI built).
-- ============================================================
create policy "provider can create own connections" on patient_provider_connections
  for insert with check (
    status = 'ACTIVE'
    and exists (
      select 1 from provider_profiles pp where pp.id = patient_provider_connections.provider_id and pp.provider_user_id = auth.uid()
    )
  );

-- ============================================================
-- provider_profiles additions — meeting link (a plain stored URL, not
-- a real video API integration) + location fields. The existing
-- "provider can update own profile" policy has no column restriction,
-- so these are writable via that policy already — no new RLS needed.
-- ============================================================
alter table provider_profiles
  add column if not exists meeting_url text,
  add column if not exists city text,
  add column if not exists state_province text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;
