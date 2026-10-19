-- MELLOW Consortium — documents become connection-scoped, not just
-- patient-scoped. A provider can now only read/write documents shared
-- under a connection they actually own, matching how messages/visits/
-- provider_recommendations already work. Run any time after
-- patient-provider-many-to-many.sql.
--
-- Backfill: checked the live data first — exactly 2 documents exist,
-- belonging to 2 different patients, and NEITHER patient has any
-- provider connection at all. There's nothing sensible to backfill them
-- to, and there doesn't need to be: connection_id stays nullable, and a
-- null connection_id means "uploaded before connecting to any provider,
-- not shared with anyone yet" — the patient still sees it fine (their
-- own read policy is keyed on patient_id, not connection_id); no
-- provider can, correctly, since none has a relationship to it.

-- ============================================================
-- 1. The column
-- ============================================================
alter table documents
  add column if not exists connection_id uuid references patient_provider_connections(id) on delete set null;

-- ============================================================
-- 2. documents table RLS — provider access keyed on connection_id, not
-- "any active connection this patient happens to have."
-- ============================================================
drop policy if exists "provider can read connected patient documents" on documents;
create policy "provider can read connected patient documents" on documents
  for select using (exists (
    select 1 from patient_provider_connections c
    join provider_profiles pp on pp.id = c.provider_id
    where c.id = documents.connection_id
      and c.status = 'ACTIVE'
      and pp.provider_user_id = auth.uid()
  ));

drop policy if exists "provider can insert connected patient documents" on documents;
create policy "provider can insert connected patient documents" on documents
  for insert with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from patient_provider_connections c
      join provider_profiles pp on pp.id = c.provider_id
      where c.id = documents.connection_id
        and c.status = 'ACTIVE'
        and pp.provider_user_id = auth.uid()
    )
  );

-- Patient uploads can still go unattached to any connection (a document
-- shared with nobody yet), but if a connection_id IS given, it has to
-- actually be one of the patient's own ACTIVE connections — otherwise a
-- patient could attach someone else's connection id to their document.
drop policy if exists "patient can insert own documents" on documents;
create policy "patient can insert own documents" on documents
  for insert with check (
    patient_id = auth.uid()
    and (
      connection_id is null
      or exists (
        select 1 from patient_provider_connections c
        where c.id = documents.connection_id
          and c.patient_id = auth.uid()
          and c.status = 'ACTIVE'
      )
    )
  );

-- ============================================================
-- 3. Storage RLS — the upload path convention becomes
-- `{patient_id}/{connection_id-or-"unassigned"}/{timestamp}-{filename}`
-- so a provider's storage access can be checked directly from the path,
-- without needing the `documents` row to exist yet (the file uploads to
-- storage before the metadata row is inserted). safe_uuid() turns an
-- invalid segment (the literal "unassigned") into null instead of
-- erroring the whole policy check.
-- ============================================================
create or replace function public.safe_uuid(input text)
returns uuid
language plpgsql
immutable
as $$
begin
  return input::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

drop policy if exists "provider can read connected patient storage objects" on storage.objects;
create policy "provider can read connected patient storage objects" on storage.objects
  for select using (
    bucket_id = 'documents' and exists (
      select 1 from patient_provider_connections c
      join provider_profiles pp on pp.id = c.provider_id
      where c.patient_id = (storage.foldername(name))[1]::uuid
        and c.id = public.safe_uuid((storage.foldername(name))[2])
        and c.status = 'ACTIVE'
        and pp.provider_user_id = auth.uid()
    )
  );

drop policy if exists "provider can upload connected patient storage objects" on storage.objects;
create policy "provider can upload connected patient storage objects" on storage.objects
  for insert with check (
    bucket_id = 'documents' and exists (
      select 1 from patient_provider_connections c
      join provider_profiles pp on pp.id = c.provider_id
      where c.patient_id = (storage.foldername(name))[1]::uuid
        and c.id = public.safe_uuid((storage.foldername(name))[2])
        and c.status = 'ACTIVE'
        and pp.provider_user_id = auth.uid()
    )
  );

-- Patient storage policies are unaffected — they only ever checked path
-- segment 1 (their own id), and that segment's position hasn't changed.
