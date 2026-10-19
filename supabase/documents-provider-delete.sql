-- MELLOW Consortium — providers can't delete documents at all right now.
-- documents-connection-scoped.sql gave providers read + insert on
-- connection-scoped documents, but no delete policy was ever added — the
-- only delete policy in the whole schema is "patient can delete own
-- documents" (patient-dashboard.sql). DocumentsPanel's Delete button
-- (components/documents/DocumentsPanel.tsx) has always been rendered on
-- the provider side too (patients/[id] page, and now the dedicated
-- /provider/documents pages), so clicking it as a provider silently
-- deletes 0 rows under RLS — no error, the button just does nothing.
--
-- Same connection-ownership check as the existing provider read/insert
-- policies. Storage delete mirrors the existing provider upload policy's
-- path-based check.

drop policy if exists "provider can delete connected patient documents" on documents;
create policy "provider can delete connected patient documents" on documents
  for delete using (exists (
    select 1 from patient_provider_connections c
    join provider_profiles pp on pp.id = c.provider_id
    where c.id = documents.connection_id
      and c.status = 'ACTIVE'
      and pp.provider_user_id = auth.uid()
  ));

drop policy if exists "provider can delete connected patient storage objects" on storage.objects;
create policy "provider can delete connected patient storage objects" on storage.objects
  for delete using (
    bucket_id = 'documents' and exists (
      select 1 from patient_provider_connections c
      join provider_profiles pp on pp.id = c.provider_id
      where c.patient_id = (storage.foldername(name))[1]::uuid
        and c.id = public.safe_uuid((storage.foldername(name))[2])
        and c.status = 'ACTIVE'
        and pp.provider_user_id = auth.uid()
    )
  );
