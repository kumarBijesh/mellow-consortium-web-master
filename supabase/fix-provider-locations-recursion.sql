-- MELLOW Consortium — fixes the real bug behind "Provider created, but
-- assigning locations failed": inserting into provider_locations threw
-- Postgres 42P17 "infinite recursion detected in policy for relation
-- provider_locations". Root cause, confirmed by reproducing it directly:
--
--   "hospital can insert own provider_locations" (this policy) checks
--   the `locations` table to confirm the location belongs to the
--   caller's hospital. Reading `locations` triggers ITS OWN RLS, and one
--   of `locations`' policies — "provider can read assigned locations" —
--   queries provider_locations right back. Postgres detects the cycle
--   and refuses to evaluate it at all.
--
-- Same category of bug as the original `admins` self-reference (see
-- admin.sql) and the documents/storage.objects issue from earlier —
-- same fix: a `security definer` helper that checks location ownership
-- without going through `locations`' own RLS, breaking the cycle.
--
-- Also adds create_provider_with_locations(), an RPC that does the
-- provider_profiles insert + provider_locations inserts in one Postgres
-- function call — a plpgsql function body is one transaction, so if the
-- location-assignment step fails for any reason, the provider row from
-- the same call is automatically rolled back too. This replaces the two
-- separate, non-atomic inserts that let "provider exists but isn't
-- linked anywhere" happen in the first place.

-- ============================================================
-- 1. Break the recursion
-- ============================================================
create or replace function public.hospital_owns_location(p_location_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from locations l
    join hospitals h on h.id = l.hospital_id
    where l.id = p_location_id and h.user_id = auth.uid()
  );
$$;

drop policy if exists "hospital can insert own provider_locations" on provider_locations;
create policy "hospital can insert own provider_locations" on provider_locations
  for insert with check (
    exists (
      select 1 from provider_profiles pp join hospitals h on h.id = pp.hospital_id
      where pp.id = provider_locations.provider_id and h.user_id = auth.uid()
    )
    and public.hospital_owns_location(provider_locations.location_id)
  );

-- ============================================================
-- 2. Atomic provider-creation RPC. security invoker (the default) so
-- normal RLS still applies to both inserts — this only fixes
-- atomicity, not authorization. A hospital still can't create a
-- provider for someone else's org or assign a location it doesn't own;
-- it just now can't end up half-succeeded either.
-- ============================================================
create or replace function public.create_provider_with_locations(
  p_name text,
  p_email text,
  p_specialty text,
  p_hospital_id uuid,
  p_provider_user_id uuid,
  p_location_ids uuid[]
)
returns uuid
language plpgsql
as $$
declare
  v_provider_id uuid;
  v_location_id uuid;
begin
  insert into provider_profiles (name, email, specialty, hospital_id, provider_user_id)
  values (p_name, p_email, p_specialty, p_hospital_id, p_provider_user_id)
  returning id into v_provider_id;

  if p_location_ids is not null then
    foreach v_location_id in array p_location_ids loop
      insert into provider_locations (provider_id, location_id, assigned_by)
      values (v_provider_id, v_location_id, auth.uid());
    end loop;
  end if;

  return v_provider_id;
end;
$$;
