-- MELLOW Consortium — Discovery Call Requests
-- Backs the "Book a Discovery Call" form at /discovery-call, reached from
-- the "Partner with MELLOW" CTA section's "Book a discovery call" button
-- and every CTA on /membership-plans.
--
-- Separate from investigator_inquiries (Step 1's "Request Discovery
-- Call" popup, which is scoped to a specific investigator/institution
-- from the globe) — this is a general partnership lead with no
-- investigator/institution context. Also separate from `applications`
-- (which provisions a real account on accept) — this never creates an
-- account, it's just a lead for the team to follow up on, same
-- new/contacted/closed pattern as investigator_inquiries.

create table discovery_call_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  organization text not null,
  job_title text,
  area_of_expertise text,
  country text,
  collaboration_type text,   -- one of the "How would you like to collaborate?" options; optional per spec
  source_tier text,          -- which /membership-plans tier CTA this came from, if any (e.g. "Founding"); null when reached from the homepage's general "Book a discovery call" button
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create index idx_discovery_call_requests_status on discovery_call_requests(status);

alter table discovery_call_requests enable row level security;

create policy "public can submit discovery call requests" on discovery_call_requests
  for insert
  with check (true);

create policy "admins can read discovery call requests" on discovery_call_requests
  for select using (public.is_admin());

create policy "admins can update discovery call requests" on discovery_call_requests
  for update using (public.is_admin()) with check (public.is_admin());
