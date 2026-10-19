-- MELLOW Consortium — provider weekly availability, shown on the
-- hospital dashboard's Schedule tab.
--
-- Deliberately two states only (available / unavailable), not three.
-- The reference design shows a "booked" state too, but there is no
-- appointment-booking flow anywhere in this project — patients can't
-- book a slot, so a "booked" indicator would have nothing real driving
-- it. This table is honest about what it actually does: it lets a
-- hospital record which hours a provider is available, nothing more.
-- Add a real booking flow later and this table extends naturally (a
-- slot referenced by an appointment becomes "booked").
--
-- Run any time after hospitals.sql.

create table provider_availability (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references provider_profiles(id) on delete cascade,
  slot_date date not null,
  slot_time time not null,
  available boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (provider_id, slot_date, slot_time)
);

alter table provider_availability enable row level security;

-- Same "reach through provider_profiles to hospitals" pattern already
-- proven safe elsewhere in this project (provider_locations, visits).
create policy "hospital can read own provider availability" on provider_availability
  for select using (exists (
    select 1 from provider_profiles pp join hospitals h on h.id = pp.hospital_id
    where pp.id = provider_availability.provider_id and h.user_id = auth.uid()
  ));
create policy "hospital can manage own provider availability" on provider_availability
  for insert with check (exists (
    select 1 from provider_profiles pp join hospitals h on h.id = pp.hospital_id
    where pp.id = provider_availability.provider_id and h.user_id = auth.uid()
  ));
create policy "hospital can update own provider availability" on provider_availability
  for update using (exists (
    select 1 from provider_profiles pp join hospitals h on h.id = pp.hospital_id
    where pp.id = provider_availability.provider_id and h.user_id = auth.uid()
  ));

create policy "provider can read own availability" on provider_availability
  for select using (exists (
    select 1 from provider_profiles pp where pp.id = provider_availability.provider_id and pp.provider_user_id = auth.uid()
  ));
