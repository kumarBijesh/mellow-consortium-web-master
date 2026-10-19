-- MELLOW Consortium — per-user theme preference
-- One shared table for every authenticated user regardless of role
-- (patient, provider, hospital staff, admin) rather than adding a
-- theme column to each of the separate profile/allow-list tables.

create table user_preferences (
  id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  updated_at timestamptz not null default now()
);

alter table user_preferences enable row level security;

create policy "users can read own preferences" on user_preferences
  for select
  using (auth.uid() = id);

create policy "users can upsert own preferences" on user_preferences
  for insert
  with check (auth.uid() = id);

create policy "users can update own preferences" on user_preferences
  for update
  using (auth.uid() = id);
