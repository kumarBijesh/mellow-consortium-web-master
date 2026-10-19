-- MELLOW Consortium — hospital-side visibility for All Patients / Clinical
-- Visits / Analytics on the hospital dashboard.
--
-- None of these existed before: patient_provider_connections, profiles,
-- and visits only ever granted read access to the patient themselves, the
-- connected provider, or admins — never to the hospital that owns the
-- provider. Run any time after provider-dashboard.sql and
-- patient-dashboard.sql.
--
-- Every policy below reaches the target row through provider_profiles and
-- hospitals only (never queries back into its own table, and none of
-- provider_profiles/hospitals' own policies query these tables back) —
-- same shape already proven safe by the existing "provider can read
-- connected patient profiles" policy, just extended one hop further to
-- the owning hospital. See fix-hospitals-provider-recursion.sql for what
-- happens when that rule gets broken.

create policy "hospital can read own connections" on patient_provider_connections
  for select using (exists (
    select 1 from provider_profiles pp
    join hospitals h on h.id = pp.hospital_id
    where pp.id = patient_provider_connections.provider_id and h.user_id = auth.uid()
  ));

create policy "hospital can read connected patient profiles" on profiles
  for select using (exists (
    select 1 from patient_provider_connections c
    join provider_profiles pp on pp.id = c.provider_id
    join hospitals h on h.id = pp.hospital_id
    where c.patient_id = profiles.id and h.user_id = auth.uid()
  ));

create policy "hospital can read own logged visits" on visits
  for select using (exists (
    select 1 from provider_profiles pp
    join hospitals h on h.id = pp.hospital_id
    where pp.id = visits.provider_id and h.user_id = auth.uid()
  ));
