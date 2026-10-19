-- MELLOW Consortium — visitor profiles + role
-- Run any time after accounts.sql. Adds a role to every visitor account so
-- /dashboard can route patients and staff to the right place.
--
-- Note: 'admin' is intentionally NOT a value this column is meant to hold.
-- Admin access stays governed entirely by the existing `admins` allow-list
-- table (supabase/admin.sql) — a separate, manually-managed mechanism, so
-- admin access can never be granted just by someone signing up publicly.
-- This table is for public-facing account types only (for now: 'patient').

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'patient',
  full_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "users can read own profile" on profiles
  for select
  using (auth.uid() = id);

create policy "users can update own profile" on profiles
  for update
  using (auth.uid() = id);

-- Auto-create a profile row for every new auth user. Fires on any insert
-- into auth.users regardless of how the account was created, so it covers
-- email/password sign-up and Google OAuth sign-up with one trigger.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any accounts created before this migration ran.
insert into public.profiles (id, full_name)
select id, raw_user_meta_data->>'full_name' from auth.users
on conflict (id) do nothing;
