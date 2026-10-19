-- MELLOW Consortium — fix "infinite recursion detected in policy for
-- relation hospitals" (Postgres 42P17), take two.
--
-- Root cause: "provider can read own hospital" (provider-dashboard.sql)
-- queries provider_profiles to check whether the calling user is a
-- provider at that hospital:
--   exists (select 1 from provider_profiles pp where pp.hospital_id = hospitals.id and pp.provider_user_id = auth.uid())
-- provider_profiles' own "hospital can read own providers" policy
-- (hospitals.sql) queries hospitals right back:
--   exists (select 1 from hospitals h where h.id = provider_profiles.hospital_id and h.user_id = auth.uid())
-- That's a two-table cycle: evaluating hospitals' SELECT policies
-- requires evaluating provider_profiles' SELECT policies, which
-- requires evaluating hospitals' SELECT policies again, forever.
-- fix-admin-rls-recursion.sql never touched this because it isn't an
-- admin check — it's the same class of bug (self-reference through
-- RLS) via a different table pair, introduced later when the provider
-- dashboard policy was added without re-checking hospitals.sql's
-- existing policies for a cycle back.
--
-- Fix: same technique as is_admin() — a `security definer` helper that
-- looks up the calling provider's hospital_id. The function runs as its
-- owner (postgres, when created here), which bypasses RLS by default,
-- so the lookup never re-enters provider_profiles' policy and the cycle
-- never starts.
--
-- Run this any time after provider-dashboard.sql.

create or replace function public.my_provider_hospital_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select hospital_id from provider_profiles where provider_user_id = auth.uid() limit 1;
$$;

drop policy if exists "provider can read own hospital" on hospitals;
create policy "provider can read own hospital" on hospitals
  for select using (id = public.my_provider_hospital_id());
