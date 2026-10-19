-- MELLOW Consortium — fix for a real bug found while testing
-- documents-connection-scoped.sql: the provider storage policies'
-- `EXISTS (... join patient_provider_connections ... join
-- provider_profiles ...)` check works perfectly as a plain table-level
-- RLS policy (verified directly), but silently evaluates to false when
-- the identical logic runs inside a storage.objects policy — Storage
-- API's underlying session doesn't carry the nested-table RLS
-- visibility the same way plain PostgREST table access does. Same root
-- category as the earlier `admins` self-referential recursion bug: RLS
-- policies referencing other RLS-protected tables are fragile in
-- contexts beyond a simple same-table check.
--
-- Fix: a `security definer` helper (same pattern as public.is_admin() in
-- admin.sql) that runs with the function owner's privileges, bypassing
-- RLS on patient_provider_connections/provider_profiles internally
-- instead of depending on the caller's visibility into them. It only
-- ever returns a boolean, so it doesn't leak row data.
--
-- Run this after documents-connection-scoped.sql.

create or replace function public.provider_owns_connection(p_connection_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from patient_provider_connections c
    join provider_profiles pp on pp.id = c.provider_id
    where c.id = p_connection_id
      and c.status = 'ACTIVE'
      and pp.provider_user_id = auth.uid()
  );
$$;

drop policy if exists "provider can read connected patient storage objects" on storage.objects;
create policy "provider can read connected patient storage objects" on storage.objects
  for select using (
    bucket_id = 'documents'
    and public.provider_owns_connection(public.safe_uuid((storage.foldername(name))[2]))
  );

drop policy if exists "provider can upload connected patient storage objects" on storage.objects;
create policy "provider can upload connected patient storage objects" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and public.provider_owns_connection(public.safe_uuid((storage.foldername(name))[2]))
  );
