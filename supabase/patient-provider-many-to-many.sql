-- MELLOW Consortium — patient <-> provider many-to-many
-- Run this AFTER patient-provider-documents-and-single-connection.sql
-- (or even if that file was never run — every statement here is
-- idempotent either way).
--
-- Per the Role Hierarchy & Data-Sharing Spec v2: a patient can be
-- connected to more than one provider at the same time. The original
-- migration (patient-provider-documents-and-single-connection.sql)
-- enforced exactly one ACTIVE connection per patient via a unique
-- index — that restriction is removed here.
--
-- Nothing else needs to change. documents/visits/messages/
-- provider_recommendations were already scoped per-connection
-- (`connection_id`) or via an `EXISTS (... patient_provider_connections
-- ... status = 'ACTIVE' ...)` check, never "the patient's one provider"
-- — so a patient with two simultaneous ACTIVE connections just gets two
-- independent document/message/visit streams automatically. Verified
-- with a live test (two throwaway providers, one patient connected to
-- both) — see the session notes for what was checked.

-- ============================================================
-- 1. Drop the one-active-connection-per-patient restriction
-- ============================================================
drop index if exists one_active_connection_per_patient;

-- ============================================================
-- 2. Consolidate the duplicate documents/storage policies
-- ============================================================
-- These four policies were defined identically in both
-- patient-dashboard.sql and patient-provider-documents-and-single-
-- connection.sql — harmless if only one of those ever ran against this
-- database, but a fresh setup running both in order would fail on the
-- second CREATE POLICY (Postgres has no "or replace" for policies).
-- Dropping-then-recreating here makes this migration safe regardless of
-- which combination already ran, and patient-provider-documents-and-
-- single-connection.sql has been trimmed down to just the index it
-- introduced (now removed above) so it won't redefine these again on a
-- fresh database.
drop policy if exists "provider can read connected patient documents" on documents;
create policy "provider can read connected patient documents" on documents
  for select using (exists (
    select 1 from patient_provider_connections c
    join provider_profiles pp on pp.id = c.provider_id
    where c.patient_id = documents.patient_id
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
      where c.patient_id = documents.patient_id
        and c.status = 'ACTIVE'
        and pp.provider_user_id = auth.uid()
    )
  );

drop policy if exists "provider can read connected patient storage objects" on storage.objects;
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

drop policy if exists "provider can upload connected patient storage objects" on storage.objects;
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
