-- MELLOW Consortium — admin visibility into profiles
-- Run any time after profiles.sql. Adds email (needed for the admin users
-- table — auth.users isn't queryable from the client, even for admins, so
-- email gets synced onto profiles the same way full_name already is) and
-- lets admins read every profile, not just their own.
--
-- Note: this is a point-in-time copy of the email set at sign-up. If a
-- user changes their email later via Supabase Auth, this column won't
-- follow unless a corresponding update trigger is added later.

alter table profiles
  add column if not exists email text;

update profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create policy "admins can read all profiles" on profiles
  for select
  using (public.is_admin());
