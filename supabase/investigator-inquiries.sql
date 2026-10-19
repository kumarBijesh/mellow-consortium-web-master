-- MELLOW Consortium — Investigator Inquiries
-- Backs the globe click-through flow (dot -> country -> institution ->
-- investigator -> "Request Discovery Call" form).
--
-- Deliberately a NEW table, not a row in `applications`: applications'
-- whole purpose is account provisioning ("Accepting one creates a real
-- Hospital or Individual Provider account and sends the invite email" —
-- see app/[locale]/admin/(dashboard)/applications/page.tsx). An
-- investigator inquiry is a lead/discovery-call request about a specific
-- named investigator, not someone applying to become an account. It also
-- needs institution_id/investigator_id references for real relational
-- context that applications' generic form_data jsonb has no field for.
--
-- Run this AFTER schema.sql and institutions-geo.sql.

create table investigator_inquiries (
  id uuid primary key default gen_random_uuid(),
  investigator_id uuid references investigators(id) on delete set null,
  institution_id uuid references institutions(id) on delete set null,
  investigator_name text not null,   -- snapshot at submission time, survives investigator_id going null
  institution_name text not null,    -- snapshot at submission time, survives institution_id going null
  first_name text not null,
  last_name text not null,
  company_institution text not null,
  email text not null,
  phone text not null,
  organization_type text not null,
  partnership_interest text not null,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create index idx_investigator_inquiries_status on investigator_inquiries(status);
create index idx_investigator_inquiries_investigator on investigator_inquiries(investigator_id);

alter table investigator_inquiries enable row level security;

-- Public can submit an inquiry (same public-insert-only pattern as
-- applications/newsletter_subscribers); no public read/update — only
-- admin reviews these.
create policy "public can submit investigator inquiries" on investigator_inquiries
  for insert
  with check (true);

create policy "admins can read investigator inquiries" on investigator_inquiries
  for select using (public.is_admin());

create policy "admins can update investigator inquiries" on investigator_inquiries
  for update using (public.is_admin()) with check (public.is_admin());
