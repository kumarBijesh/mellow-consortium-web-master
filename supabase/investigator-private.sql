-- MELLOW Consortium — move investigators' private contact fields out of the
-- publicly readable `investigators` table.
--
-- Why: `investigators` has "public read investigators ... using (true)"
-- (schema.sql), which covers every column, and investigator-registrations.sql
-- added personal_email / street_address / city / state / postal_code /
-- cv_path to it. Anyone with the public anon key could read them via the
-- REST API — at the time of writing, personal_email for all 32 imported
-- investigators. Column choice in page code doesn't help; RLS is per row.
--
-- Run BEFORE deploying the code that reads/writes investigator_private
-- (lib/actions/investigator-registrations.ts, admin investigator page).
-- Safe to re-run. Wrapped in a transaction so the copy and the column
-- drop happen together or not at all.

begin;

create table if not exists investigator_private (
  investigator_id uuid primary key references investigators(id) on delete cascade,
  personal_email text,
  street_address text,
  city text,          -- from the registration's personal address block
  state text,
  postal_code text,
  cv_path text,       -- object path in the private investigator-cvs bucket
  updated_at timestamptz not null default now()
);

alter table investigator_private enable row level security;

-- Admin-only, every operation. No public/anon policy at all.
drop policy if exists "admins manage investigator private data" on investigator_private;
create policy "admins manage investigator private data" on investigator_private
  for all using (public.is_admin()) with check (public.is_admin());

-- Copy existing values across (only when the old columns still exist, so
-- re-running after the drop below is a no-op instead of an error).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'investigators' and column_name = 'personal_email'
  ) then
    insert into investigator_private (investigator_id, personal_email, street_address, city, state, postal_code, cv_path)
    select id, personal_email, street_address, city, state, postal_code, cv_path
    from investigators
    where coalesce(personal_email, street_address, city, state, postal_code, cv_path) is not null
    on conflict (investigator_id) do update set
      personal_email = excluded.personal_email,
      street_address = excluded.street_address,
      city = excluded.city,
      state = excluded.state,
      postal_code = excluded.postal_code,
      cv_path = excluded.cv_path,
      updated_at = now();
  end if;
end $$;

alter table investigators
  drop column if exists personal_email,
  drop column if exists street_address,
  drop column if exists city,
  drop column if exists state,
  drop column if exists postal_code,
  drop column if exists cv_path;

commit;
