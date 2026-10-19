-- MELLOW Consortium — hospital/location/provider hierarchy
-- Run any time after admin.sql and profiles.sql.
--
-- Hierarchy: Admin creates Hospitals -> Hospital creates Locations and
-- Providers, and assigns Providers to Locations (many-to-many). Admin
-- never directly manages individual locations/providers.

-- ============================================================
-- Hospitals
-- Note: `user_id` is not in the original field list from the spec doc,
-- but is required — without it RLS has no way to know which hospital a
-- signed-in user manages (admin_email alone is just a text field, not a
-- link to an auth account). Set right after the invite is sent, from the
-- new user's id.
-- ============================================================
create table hospitals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  admin_email text not null unique,
  phone text,
  -- Was a separate hospital_countries join table; folded into a plain
  -- array here per the Admin/Hospital spec doc. Still holds more than
  -- one country fine (e.g. ARRAY['Australia','India']) — no capability
  -- lost, just one less join for every read path.
  countries text[] not null default '{}',
  status text not null default 'PENDING_SETUP' check (status in ('PENDING_SETUP', 'ACTIVE', 'DISABLED')),
  created_by_admin_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Locations — every location belongs to exactly one hospital
-- ============================================================
create table locations (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  name text not null,
  address text,
  city text,
  state_province text,
  country text not null,
  postal_code text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'DISABLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Providers — every provider belongs to exactly one hospital
-- ============================================================
create table provider_profiles (
  id uuid primary key default gen_random_uuid(),
  provider_user_id uuid references auth.users(id) on delete set null,
  hospital_id uuid not null references hospitals(id) on delete cascade,
  name text not null,
  email text not null unique,
  specialty text,
  status text not null default 'PENDING_SETUP' check (status in ('PENDING_SETUP', 'ACTIVE', 'DISABLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Provider <-> Location assignment (many-to-many join table —
-- deliberately not a single location_id on provider_profiles)
-- ============================================================
create table provider_locations (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references provider_profiles(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  status text not null default 'ACTIVE',
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id),
  unique (provider_id, location_id)
);

-- ============================================================
-- RLS
-- ============================================================
alter table hospitals enable row level security;
alter table locations enable row level security;
alter table provider_profiles enable row level security;
alter table provider_locations enable row level security;

-- hospitals — admin: full read/create/edit. Hospital: read own only.
-- Admin checks go through public.is_admin() (defined in admin.sql), not
-- an inline `exists (select 1 from admins ...)` — that inline form
-- causes "infinite recursion detected in policy for relation admins"
-- (Postgres 42P17) because it's itself a SELECT against `admins`,
-- subject to `admins`' own RLS policy, which runs the same subquery
-- again. See admin.sql for the full explanation.
create policy "admins can read all hospitals" on hospitals
  for select using (public.is_admin());
create policy "admins can insert hospitals" on hospitals
  for insert with check (public.is_admin());
create policy "admins can update hospitals" on hospitals
  for update using (public.is_admin());
create policy "hospital can read own record" on hospitals
  for select using (user_id = auth.uid());

-- locations — admin: read-only (managing locations is the hospital's job).
-- Hospital: full CRUD on its own. Provider: read locations they're assigned to.
create policy "admins can read all locations" on locations
  for select using (public.is_admin());
create policy "hospital can read own locations" on locations
  for select using (exists (select 1 from hospitals h where h.id = locations.hospital_id and h.user_id = auth.uid()));
create policy "hospital can insert own locations" on locations
  for insert with check (exists (select 1 from hospitals h where h.id = locations.hospital_id and h.user_id = auth.uid()));
create policy "hospital can update own locations" on locations
  for update using (exists (select 1 from hospitals h where h.id = locations.hospital_id and h.user_id = auth.uid()));
create policy "hospital can delete own locations" on locations
  for delete using (exists (select 1 from hospitals h where h.id = locations.hospital_id and h.user_id = auth.uid()));
create policy "provider can read assigned locations" on locations
  for select using (exists (
    select 1 from provider_locations pl
    join provider_profiles pp on pp.id = pl.provider_id
    where pl.location_id = locations.id and pp.provider_user_id = auth.uid()
  ));

-- provider_profiles — admin: read-only. Hospital: full CRUD on its own.
-- Provider: read own profile only.
create policy "admins can read all providers" on provider_profiles
  for select using (public.is_admin());
create policy "hospital can read own providers" on provider_profiles
  for select using (exists (select 1 from hospitals h where h.id = provider_profiles.hospital_id and h.user_id = auth.uid()));
create policy "hospital can insert own providers" on provider_profiles
  for insert with check (exists (select 1 from hospitals h where h.id = provider_profiles.hospital_id and h.user_id = auth.uid()));
create policy "hospital can update own providers" on provider_profiles
  for update using (exists (select 1 from hospitals h where h.id = provider_profiles.hospital_id and h.user_id = auth.uid()));
create policy "hospital can delete own providers" on provider_profiles
  for delete using (exists (select 1 from hospitals h where h.id = provider_profiles.hospital_id and h.user_id = auth.uid()));
create policy "provider can read own profile" on provider_profiles
  for select using (provider_user_id = auth.uid());

-- provider_locations — admin: read-only. Hospital: full CRUD, but only
-- when BOTH the provider and the location belong to that same hospital
-- (this is what stops a hospital assigning another hospital's provider
-- to its own location, or vice versa). Provider: read own assignments.
create policy "admins can read all provider_locations" on provider_locations
  for select using (public.is_admin());
create policy "hospital can read own provider_locations" on provider_locations
  for select using (exists (
    select 1 from provider_profiles pp join hospitals h on h.id = pp.hospital_id
    where pp.id = provider_locations.provider_id and h.user_id = auth.uid()
  ));
create policy "hospital can insert own provider_locations" on provider_locations
  for insert with check (
    exists (select 1 from provider_profiles pp join hospitals h on h.id = pp.hospital_id
            where pp.id = provider_locations.provider_id and h.user_id = auth.uid())
    and
    exists (select 1 from locations l join hospitals h2 on h2.id = l.hospital_id
            where l.id = provider_locations.location_id and h2.user_id = auth.uid())
  );
create policy "hospital can delete own provider_locations" on provider_locations
  for delete using (exists (
    select 1 from provider_profiles pp join hospitals h on h.id = pp.hospital_id
    where pp.id = provider_locations.provider_id and h.user_id = auth.uid()
  ));
create policy "provider can read own assignments" on provider_locations
  for select using (exists (
    select 1 from provider_profiles pp where pp.id = provider_locations.provider_id and pp.provider_user_id = auth.uid()
  ));

-- ============================================================
-- Stop hospital/provider invites from also getting a patient `profiles`
-- row. inviteUserByEmail() sets user_metadata.role to 'hospital' or
-- 'provider'; only patient signups (no role, or role='patient') get a
-- profiles row from here on.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  invited_role text := new.raw_user_meta_data->>'role';
begin
  if invited_role is null or invited_role = 'patient' then
    insert into public.profiles (id, email, full_name)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
