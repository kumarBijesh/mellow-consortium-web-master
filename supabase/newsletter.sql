-- MELLOW Consortium — newsletter signups
-- Run any time after schema.sql. Same pattern as `applications`: public
-- insert-only, no public read (review subscribers from the Supabase
-- dashboard or a future admin view).

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table newsletter_subscribers enable row level security;

create policy "public can subscribe" on newsletter_subscribers
  for insert
  with check (true);

-- No select/update/delete policy for anon — intentional, same reasoning
-- as `applications`.
