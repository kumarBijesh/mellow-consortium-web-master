-- MELLOW Consortium — public visitor accounts
-- Run any time after schema.sql. Links applications to the account that
-- submitted them (only for applications submitted while signed in —
-- there's no reliable way to retroactively link earlier anonymous ones).

alter table applications
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_applications_user_id on applications(user_id);

-- Signed-in users can read their own applications. The existing
-- "public can submit applications" insert policy (schema.sql) stays as-is,
-- but is replaced below with a check that stops a signed-in user from
-- attributing an application to someone else's account.
drop policy if exists "public can submit applications" on applications;

create policy "public can submit applications" on applications
  for insert
  with check (user_id is null or user_id = auth.uid());

create policy "users can read own applications" on applications
  for select
  using (auth.uid() is not null and user_id = auth.uid());

-- ============================================================
-- Google sign-in note: this can't be done via SQL. In the Supabase
-- dashboard: Authentication -> Providers -> Google, enable it and supply
-- an OAuth Client ID/Secret from a Google Cloud project (APIs & Services
-- -> Credentials -> OAuth client ID, type "Web application"). Add
-- <your-supabase-project>.supabase.co/auth/v1/callback as an authorized
-- redirect URI on the Google side.
-- ============================================================
