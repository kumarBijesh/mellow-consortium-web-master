-- MELLOW Consortium — two related changes to the patient/provider
-- relationship model:
--
-- 1. A patient may have at most one ACTIVE provider connection at a time
--    (hospital -> many providers -> many patients, but patient -> one
--    provider). Enforced with a partial unique index, not just app-level
--    checks, so it holds even if a future code path forgets to check.
--
-- 2. Documents become bidirectional: a patient's connected provider can
--    now read (and upload into) that patient's documents, not just the
--    patient themselves. documents.sql originally scoped this to
--    patient-only "not requested explicitly" — now it is.
--
-- Run any time after patient-dashboard.sql and provider-dashboard.sql.

-- ============================================================
-- 1. One active connection per patient
-- ============================================================
create unique index if not exists one_active_connection_per_patient
  on patient_provider_connections (patient_id)
  where status = 'ACTIVE';

-- ============================================================
-- 2. Documents — bidirectional patient <-> provider access
-- ============================================================
alter table documents
  add column if not exists uploaded_by uuid references auth.users(id),
  add column if not exists category text not null default 'Other'
    check (category in ('Lab reports', 'Imaging', 'Prescriptions', 'Insurance', 'Other'));

update documents set uploaded_by = patient_id where uploaded_by is null;

-- Table RLS: same "reach through provider_profiles + hospitals-shaped"
-- pattern already proven safe elsewhere (provider can read connected
-- patient profiles, hospital can read connected patient profiles) —
-- documents is a pure leaf table nothing else queries back into, so this
-- can't create a recursion cycle.
create policy "provider can read connected patient documents" on documents
  for select using (exists (
    select 1 from patient_provider_connections c
    join provider_profiles pp on pp.id = c.provider_id
    where c.patient_id = documents.patient_id
      and c.status = 'ACTIVE'
      and pp.provider_user_id = auth.uid()
  ));

create policy "provider can insert connected patient documents" on documents
  for insert with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from patient_provider_connections c
      join provider_profiles pp on pp.id = c.provider_id
      where c.patient_id = documents.patient_id
        and c.status = 'ACTIVE'
        and pp.provider_user_id = auth.uid()
    )
  );

-- Storage RLS: upload path convention is `{patient_id}/{timestamp}-{name}`
-- regardless of who uploads, so the patient's existing storage policies
-- (scoped to their own uid as the first path segment) already let them
-- read/manage a provider's upload with zero changes — only the provider
-- side needs new policies here.
create policy "provider can read connected patient storage objects" on storage.objects
  for select using (
    bucket_id = 'documents' and exists (
      select 1 from patient_provider_connections c
      join provider_profiles pp on pp.id = c.provider_id
      where c.patient_id = (storage.foldername(name))[1]::uuid
        and c.status = 'ACTIVE'
        and pp.provider_user_id = auth.uid()
    )
  );

create policy "provider can upload connected patient storage objects" on storage.objects
  for insert with check (
    bucket_id = 'documents' and exists (
      select 1 from patient_provider_connections c
      join provider_profiles pp on pp.id = c.provider_id
      where c.patient_id = (storage.foldername(name))[1]::uuid
        and c.status = 'ACTIVE'
        and pp.provider_user_id = auth.uid()
    )
  );
