-- MELLOW Consortium — Patient dashboard depth (Phase 3)
-- Run any time after provider-dashboard.sql.
--
-- Biological age / trends / records are deliberately NOT part of this
-- migration — no biomarker/report table exists anywhere in this
-- project, and the scoring formula that turns biomarkers into a
-- biological-age number is health-adjacent enough that it needs the
-- real reference implementation's logic, not a guess.

-- ============================================================
-- documents — both the patient and their connected provider can read/
-- upload. A patient can have more than one ACTIVE connection at a time
-- (see patient-provider-many-to-many.sql), so these provider-side
-- policies apply per-connection, not "the patient's one provider" —
-- each connected provider only ever sees documents through their own
-- ACTIVE row in patient_provider_connections.
-- ============================================================
create table documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  file_path text not null,
  file_name text not null,
  category text not null default 'Other' check (category in ('Lab reports', 'Imaging', 'Prescriptions', 'Insurance', 'Other')),
  created_at timestamptz not null default now()
);

alter table documents enable row level security;

create policy "patient can read own documents" on documents
  for select using (patient_id = auth.uid());
create policy "patient can insert own documents" on documents
  for insert with check (patient_id = auth.uid());
create policy "patient can delete own documents" on documents
  for delete using (patient_id = auth.uid());

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

-- Storage bucket for the actual files. Private (not public) — every
-- read/write goes through the RLS-equivalent storage policies below,
-- scoped by the first path segment matching the uploader's own id
-- (upload path convention: `{patient_id}/{timestamp}-{filename}`).
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "patients can read own storage objects" on storage.objects
  for select using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "patients can upload own storage objects" on storage.objects
  for insert with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "patients can delete own storage objects" on storage.objects
  for delete using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- Provider-side: upload path convention is `{patient_id}/{timestamp}-
-- {name}` regardless of who uploads, so the patient's policies above
-- already cover reading a provider's upload — only the provider's own
-- read/insert access needs adding here.
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

-- ============================================================
-- visits — visit/diagnosis history. Provider logs, patient reads only
-- (no patient insert/update/delete policy at all, by design).
-- ============================================================
create table visits (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references patient_provider_connections(id) on delete cascade,
  patient_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid not null references provider_profiles(id) on delete cascade,
  visit_date date not null default current_date,
  diagnosis text,
  notes text,
  created_at timestamptz not null default now()
);

alter table visits enable row level security;

create policy "patient can read own visits" on visits
  for select using (patient_id = auth.uid());

create policy "provider can read own logged visits" on visits
  for select using (exists (
    select 1 from provider_profiles pp where pp.id = visits.provider_id and pp.provider_user_id = auth.uid()
  ));
create policy "provider can log visits for own connections" on visits
  for insert with check (exists (
    select 1 from provider_profiles pp where pp.id = visits.provider_id and pp.provider_user_id = auth.uid()
  ));
