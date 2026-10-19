-- MELLOW Consortium — public contact form (/contact)
-- Same pattern as newsletter_subscribers: public insert-only, no public
-- read (review messages from the Supabase dashboard or a future admin
-- view). Run any time after schema.sql.

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text,
  reason text not null check (reason in ('Individual', 'Provider', 'Hospital', 'Researcher', 'Partner', 'Other')),
  message text not null,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

create policy "public can send a message" on contact_messages
  for insert
  with check (true);

-- No select/update/delete policy for anon — intentional, same reasoning
-- as `newsletter_subscribers` and `applications`.
