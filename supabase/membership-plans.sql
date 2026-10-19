-- MELLOW Consortium — admin-editable membership plans.
-- Run this AFTER schema.sql and admin.sql.
-- Backs /membership-plans: public read, admin write (same pattern as
-- events.sql). Edited at /admin/cms/membership-plans.
--
-- Comparison-table cell semantics (membership_benefit_values):
--   row with value_text null  -> checkmark (included)
--   row with value_text "..." -> that text instead of a checkmark ("Comp.", "40–50%")
--   no row                    -> dash (not included)

create type membership_tier_kind as enum ('sponsor', 'individual');

create table membership_tiers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,               -- stable key; not shown on the site
  name text not null,
  price_label text not null,               -- free text: "$65K", "$2,500/yr"
  kind membership_tier_kind not null default 'sponsor',
  description text,                        -- shown on the individual (Member) card
  cta_label text,                          -- null = "Get started"
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table membership_benefit_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sort_order int not null default 0
);

create table membership_benefits (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references membership_benefit_sections(id) on delete cascade,
  label text not null,
  sort_order int not null default 0
);

create table membership_benefit_values (
  benefit_id uuid not null references membership_benefits(id) on delete cascade,
  tier_id uuid not null references membership_tiers(id) on delete cascade,
  value_text text,
  primary key (benefit_id, tier_id)
);

create index idx_membership_benefits_section on membership_benefits(section_id);

alter table membership_tiers enable row level security;
alter table membership_benefit_sections enable row level security;
alter table membership_benefits enable row level security;
alter table membership_benefit_values enable row level security;

create policy "public read membership_tiers" on membership_tiers for select using (true);
create policy "admins can insert membership_tiers" on membership_tiers for insert with check (public.is_admin());
create policy "admins can update membership_tiers" on membership_tiers for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete membership_tiers" on membership_tiers for delete using (public.is_admin());

create policy "public read membership_benefit_sections" on membership_benefit_sections for select using (true);
create policy "admins can insert membership_benefit_sections" on membership_benefit_sections for insert with check (public.is_admin());
create policy "admins can update membership_benefit_sections" on membership_benefit_sections for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete membership_benefit_sections" on membership_benefit_sections for delete using (public.is_admin());

create policy "public read membership_benefits" on membership_benefits for select using (true);
create policy "admins can insert membership_benefits" on membership_benefits for insert with check (public.is_admin());
create policy "admins can update membership_benefits" on membership_benefits for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete membership_benefits" on membership_benefits for delete using (public.is_admin());

create policy "public read membership_benefit_values" on membership_benefit_values for select using (true);
create policy "admins can insert membership_benefit_values" on membership_benefit_values for insert with check (public.is_admin());
create policy "admins can update membership_benefit_values" on membership_benefit_values for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete membership_benefit_values" on membership_benefit_values for delete using (public.is_admin());

-- ============================================================
-- save_membership_plans(payload): replaces the whole plans config in ONE
-- transaction, so a failed save can never leave /membership-plans half
-- updated. security invoker = the RLS policies above still apply; the
-- explicit is_admin() check just gives a clear error message.
--
-- payload = {
--   tiers:    [{ id|null, key, slug, name, price_label, kind, description, cta_label, is_featured }],
--   sections: [{ id|null, title, benefits: [{ id|null, label, values: [{ tier_key, value_text }] }] }]
-- }
-- Array order = sort_order. `key` lets cells reference a tier created in
-- this same save (no id yet). Rows missing from the payload are deleted.
-- ============================================================
create or replace function public.save_membership_plans(payload jsonb)
returns void
language plpgsql
security invoker
as $$
declare
  t jsonb;
  s jsonb;
  b jsonb;
  v jsonb;
  t_idx int := 0;
  s_idx int;
  b_idx int;
  row_id uuid;
  cur_section_id uuid;
  tier_ids jsonb := '{}'::jsonb;   -- tier key -> uuid
  kept_tiers uuid[] := '{}';
  kept_sections uuid[] := '{}';
  kept_benefits uuid[] := '{}';
begin
  if not public.is_admin() then
    raise exception 'Only admins can edit membership plans.';
  end if;

  for t in select * from jsonb_array_elements(payload->'tiers') loop
    if nullif(t->>'id', '') is null then
      insert into membership_tiers (slug, name, price_label, kind, description, cta_label, is_featured, sort_order)
      values (t->>'slug', t->>'name', t->>'price_label', (t->>'kind')::membership_tier_kind,
              nullif(t->>'description', ''), nullif(t->>'cta_label', ''), coalesce((t->>'is_featured')::boolean, false), t_idx)
      returning id into row_id;
    else
      row_id := (t->>'id')::uuid;
      update membership_tiers set
        name = t->>'name',
        price_label = t->>'price_label',
        kind = (t->>'kind')::membership_tier_kind,
        description = nullif(t->>'description', ''),
        cta_label = nullif(t->>'cta_label', ''),
        is_featured = coalesce((t->>'is_featured')::boolean, false),
        sort_order = t_idx
      where id = row_id;
    end if;
    tier_ids := tier_ids || jsonb_build_object(t->>'key', row_id);
    kept_tiers := kept_tiers || row_id;
    t_idx := t_idx + 1;
  end loop;

  delete from membership_tiers where id <> all(kept_tiers);

  s_idx := 0;
  for s in select * from jsonb_array_elements(payload->'sections') loop
    if nullif(s->>'id', '') is null then
      insert into membership_benefit_sections (title, sort_order) values (s->>'title', s_idx) returning id into cur_section_id;
    else
      cur_section_id := (s->>'id')::uuid;
      update membership_benefit_sections set title = s->>'title', sort_order = s_idx where id = cur_section_id;
    end if;
    kept_sections := kept_sections || cur_section_id;

    b_idx := 0;
    for b in select * from jsonb_array_elements(s->'benefits') loop
      if nullif(b->>'id', '') is null then
        insert into membership_benefits (section_id, label, sort_order) values (cur_section_id, b->>'label', b_idx) returning id into row_id;
      else
        row_id := (b->>'id')::uuid;
        update membership_benefits set section_id = cur_section_id, label = b->>'label', sort_order = b_idx where id = row_id;
      end if;
      kept_benefits := kept_benefits || row_id;

      delete from membership_benefit_values where benefit_id = row_id;
      for v in select * from jsonb_array_elements(b->'values') loop
        insert into membership_benefit_values (benefit_id, tier_id, value_text)
        values (row_id, (tier_ids->>(v->>'tier_key'))::uuid, nullif(v->>'value_text', ''));
      end loop;

      b_idx := b_idx + 1;
    end loop;
    s_idx := s_idx + 1;
  end loop;

  delete from membership_benefits where id <> all(kept_benefits);
  delete from membership_benefit_sections where id <> all(kept_sections);
end;
$$;

-- ============================================================
-- Seed: exactly the content that was hardcoded in
-- components/MembershipPlansTable.tsx and app/[locale]/membership-plans/page.tsx,
-- so the page is unchanged after switching to the DB.
-- ============================================================
insert into membership_tiers (slug, name, price_label, kind, description, cta_label, is_featured, sort_order) values
  ('founding', 'Founding', '$65K', 'sponsor', null, 'Contact us about Founding', true, 0),
  ('platinum', 'Platinum', '$35K', 'sponsor', null, null, false, 1),
  ('gold', 'Gold', '$15K', 'sponsor', null, null, false, 2),
  ('associate', 'Associate', '$8K', 'sponsor', null, null, false, 3),
  ('member', 'Member', '$2,500/yr', 'individual',
   'Access to the KOL network, an Editorial Board seat in JLIVE, a partner directory listing, educational webinars, discounted Annual Meeting registration, and the quarterly newsletter.',
   null, false, 4);

insert into membership_benefit_sections (title, sort_order) values
  ('Visibility & Marketing', 0),
  ('Recruitment & Network Access', 1),
  ('Strategic & Governance', 2),
  ('Clinical & Regulatory', 3),
  ('Publishing & Recognition', 4),
  ('Annual Meeting', 5),
  ('Business Development', 6);

insert into membership_benefits (section_id, label, sort_order)
select s.id, v.label, v.sort_order
from (values
  ('Visibility & Marketing', 'Press release co-distribution', 0),
  ('Visibility & Marketing', 'Co-branding on MELLOW materials', 1),
  ('Visibility & Marketing', 'Exhibit booth at Annual Meeting', 2),
  ('Recruitment & Network Access', 'Participant recruitment database access', 0),
  ('Recruitment & Network Access', 'Speaking bureau placement', 1),
  ('Recruitment & Network Access', 'Multi-country KOL network', 2),
  ('Recruitment & Network Access', 'Pre-vetted global investigator network', 3),
  ('Recruitment & Network Access', 'Shared-arm model access', 4),
  ('Strategic & Governance', 'Board seat / Strategic input', 0),
  ('Strategic & Governance', 'Dedicated relationship manager', 1),
  ('Strategic & Governance', 'Private leadership briefings (quarterly)', 2),
  ('Strategic & Governance', 'Biomarker co-IP rights', 3),
  ('Clinical & Regulatory', 'Priority clinical trial access', 0),
  ('Clinical & Regulatory', 'Trial budget discount', 1),
  ('Clinical & Regulatory', 'Regulatory strategy consultation', 2),
  ('Clinical & Regulatory', 'Evidence dossier packaging', 3),
  ('Clinical & Regulatory', 'White-label clinical summary reports', 4),
  ('Clinical & Regulatory', 'Real-time sponsor data dashboard', 5),
  ('Publishing & Recognition', 'JLIVE APC waivers / year', 0),
  ('Publishing & Recognition', 'Editorial Board seat in JLIVE', 1),
  ('Publishing & Recognition', 'MELLOW Validated quality mark', 2),
  ('Annual Meeting', 'Keynote speaker slot', 0),
  ('Annual Meeting', 'Complimentary seat', 1),
  ('Business Development', 'Retailer introduction program', 0),
  ('Business Development', 'Investor introduction program', 1)
) as v(section_title, label, sort_order)
join membership_benefit_sections s on s.title = v.section_title;

insert into membership_benefit_values (benefit_id, tier_id, value_text)
select b.id, t.id, v.value_text
from (values
  ('Visibility & Marketing', 'Press release co-distribution', 'founding', null),
  ('Visibility & Marketing', 'Press release co-distribution', 'platinum', null),
  ('Visibility & Marketing', 'Press release co-distribution', 'gold', null),
  ('Visibility & Marketing', 'Co-branding on MELLOW materials', 'founding', null),
  ('Visibility & Marketing', 'Co-branding on MELLOW materials', 'platinum', null),
  ('Visibility & Marketing', 'Exhibit booth at Annual Meeting', 'founding', 'Comp.'),
  ('Visibility & Marketing', 'Exhibit booth at Annual Meeting', 'platinum', 'Pref.'),
  ('Visibility & Marketing', 'Exhibit booth at Annual Meeting', 'gold', 'Disc.'),
  ('Visibility & Marketing', 'Exhibit booth at Annual Meeting', 'associate', 'Disc.'),
  ('Recruitment & Network Access', 'Participant recruitment database access', 'founding', null),
  ('Recruitment & Network Access', 'Participant recruitment database access', 'platinum', null),
  ('Recruitment & Network Access', 'Participant recruitment database access', 'gold', null),
  ('Recruitment & Network Access', 'Participant recruitment database access', 'associate', null),
  ('Recruitment & Network Access', 'Speaking bureau placement', 'founding', null),
  ('Recruitment & Network Access', 'Speaking bureau placement', 'platinum', null),
  ('Recruitment & Network Access', 'Speaking bureau placement', 'gold', null),
  ('Recruitment & Network Access', 'Speaking bureau placement', 'associate', null),
  ('Recruitment & Network Access', 'Multi-country KOL network', 'founding', null),
  ('Recruitment & Network Access', 'Multi-country KOL network', 'platinum', null),
  ('Recruitment & Network Access', 'Multi-country KOL network', 'gold', null),
  ('Recruitment & Network Access', 'Multi-country KOL network', 'associate', null),
  ('Recruitment & Network Access', 'Pre-vetted global investigator network', 'founding', null),
  ('Recruitment & Network Access', 'Pre-vetted global investigator network', 'platinum', null),
  ('Recruitment & Network Access', 'Pre-vetted global investigator network', 'gold', null),
  ('Recruitment & Network Access', 'Pre-vetted global investigator network', 'associate', null),
  ('Recruitment & Network Access', 'Shared-arm model access', 'founding', null),
  ('Recruitment & Network Access', 'Shared-arm model access', 'platinum', null),
  ('Recruitment & Network Access', 'Shared-arm model access', 'gold', null),
  ('Recruitment & Network Access', 'Shared-arm model access', 'associate', null),
  ('Strategic & Governance', 'Board seat / Strategic input', 'founding', null),
  ('Strategic & Governance', 'Dedicated relationship manager', 'founding', null),
  ('Strategic & Governance', 'Private leadership briefings (quarterly)', 'founding', null),
  ('Strategic & Governance', 'Biomarker co-IP rights', 'founding', null),
  ('Clinical & Regulatory', 'Priority clinical trial access', 'founding', null),
  ('Clinical & Regulatory', 'Priority clinical trial access', 'platinum', null),
  ('Clinical & Regulatory', 'Trial budget discount', 'founding', '40–50%'),
  ('Clinical & Regulatory', 'Trial budget discount', 'platinum', '30–40%'),
  ('Clinical & Regulatory', 'Trial budget discount', 'gold', '25–30%'),
  ('Clinical & Regulatory', 'Trial budget discount', 'associate', '20–25%'),
  ('Clinical & Regulatory', 'Regulatory strategy consultation', 'founding', null),
  ('Clinical & Regulatory', 'Regulatory strategy consultation', 'platinum', null),
  ('Clinical & Regulatory', 'Regulatory strategy consultation', 'gold', null),
  ('Clinical & Regulatory', 'Evidence dossier packaging', 'founding', null),
  ('Clinical & Regulatory', 'Evidence dossier packaging', 'platinum', null),
  ('Clinical & Regulatory', 'White-label clinical summary reports', 'founding', null),
  ('Clinical & Regulatory', 'White-label clinical summary reports', 'platinum', null),
  ('Clinical & Regulatory', 'White-label clinical summary reports', 'gold', null),
  ('Clinical & Regulatory', 'Real-time sponsor data dashboard', 'founding', null),
  ('Clinical & Regulatory', 'Real-time sponsor data dashboard', 'platinum', null),
  ('Clinical & Regulatory', 'Real-time sponsor data dashboard', 'gold', null),
  ('Clinical & Regulatory', 'Real-time sponsor data dashboard', 'associate', null),
  ('Publishing & Recognition', 'JLIVE APC waivers / year', 'founding', '4'),
  ('Publishing & Recognition', 'JLIVE APC waivers / year', 'platinum', '2'),
  ('Publishing & Recognition', 'JLIVE APC waivers / year', 'gold', '1'),
  ('Publishing & Recognition', 'JLIVE APC waivers / year', 'associate', '1'),
  ('Publishing & Recognition', 'Editorial Board seat in JLIVE', 'founding', null),
  ('Publishing & Recognition', 'Editorial Board seat in JLIVE', 'platinum', null),
  ('Publishing & Recognition', 'Editorial Board seat in JLIVE', 'gold', null),
  ('Publishing & Recognition', 'Editorial Board seat in JLIVE', 'associate', null),
  ('Publishing & Recognition', 'MELLOW Validated quality mark', 'founding', null),
  ('Publishing & Recognition', 'MELLOW Validated quality mark', 'platinum', null),
  ('Publishing & Recognition', 'MELLOW Validated quality mark', 'gold', null),
  ('Publishing & Recognition', 'MELLOW Validated quality mark', 'associate', null),
  ('Annual Meeting', 'Keynote speaker slot', 'founding', null),
  ('Annual Meeting', 'Keynote speaker slot', 'platinum', null),
  ('Annual Meeting', 'Keynote speaker slot', 'gold', null),
  ('Annual Meeting', 'Keynote speaker slot', 'associate', null),
  ('Annual Meeting', 'Complimentary seat', 'founding', null),
  ('Annual Meeting', 'Complimentary seat', 'platinum', null),
  ('Annual Meeting', 'Complimentary seat', 'gold', null),
  ('Business Development', 'Retailer introduction program', 'founding', null),
  ('Business Development', 'Retailer introduction program', 'platinum', null),
  ('Business Development', 'Investor introduction program', 'founding', null),
  ('Business Development', 'Investor introduction program', 'platinum', null)
) as v(section_title, label, tier_slug, value_text)
join membership_benefit_sections s on s.title = v.section_title
join membership_benefits b on b.section_id = s.id and b.label = v.label
join membership_tiers t on t.slug = v.tier_slug;
