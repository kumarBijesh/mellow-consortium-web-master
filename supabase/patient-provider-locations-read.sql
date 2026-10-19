-- MELLOW Consortium — let patients see how many locations a provider is
-- at on the Find a Provider directory (/dashboard/patient/providers).
--
-- provider_locations currently has read policies for hospital (own),
-- provider (own), and admin (all) — see hospitals.sql. Nothing lets a
-- patient read it at all, so an embedded provider_locations(count) query
-- from a patient session silently comes back empty under RLS (not an
-- error, just 0 for every provider) rather than reflecting real data.
--
-- Scoped the same way as the existing "patients can read active
-- providers" / "patients can read active hospitals" directory policies
-- (provider-dashboard.sql): only ACTIVE providers, and only a location
-- link — not the location or provider row itself, both already covered
-- by their own directory policies.

create policy "patients can read active provider locations" on provider_locations
  for select using (
    exists (
      select 1 from provider_profiles pp
      where pp.id = provider_locations.provider_id and pp.status = 'ACTIVE'
    )
  );
