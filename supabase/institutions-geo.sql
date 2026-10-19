-- MELLOW Consortium — institutions geo/network fields
-- Run this AFTER schema.sql and seed.sql. Adds the fields the homepage's
-- Global Network map needs (see production spec section 6.3: Site data
-- model) and backfills them for the 7 already-seeded institutions, plus
-- adds the MusB Research HQ marker (matches the reference implementation's
-- hardcoded HQ pin exactly: New Port Richey, FL — 28.24, -82.72).

alter table institutions
  add column if not exists region text
    check (region in ('North America','South America','Europe','Africa','Middle East','Asia-Pacific')),
  add column if not exists lat numeric,
  add column if not exists lon numeric,
  add column if not exists is_hq boolean not null default false,
  add column if not exists specializations text[] not null default '{}';

-- Karolinska Longevity Institute — Stockholm, Sweden
update institutions set
  region = 'Europe', lat = 59.33, lon = 18.06,
  specializations = ARRAY['Metabolic Health','Biological Age']
where id = 'a0000000-0000-4000-8000-000000000001';

-- Singapore Centre for Healthy Longevity — Singapore
update institutions set
  region = 'Asia-Pacific', lat = 1.35, lon = 103.82,
  specializations = ARRAY['Cognitive Health']
where id = 'a0000000-0000-4000-8000-000000000002';

-- Mayo Clinic Center for Regenerative Medicine — Rochester, MN, USA
update institutions set
  region = 'North America', lat = 44.02, lon = -92.47,
  specializations = ARRAY['Cellular Senescence','Regenerative Medicine']
where id = 'a0000000-0000-4000-8000-000000000003';

-- Max Planck Institute for Biology of Ageing — Cologne, Germany
update institutions set
  region = 'Europe', lat = 50.94, lon = 6.96,
  specializations = ARRAY['Cardiovascular','Biology of Ageing']
where id = 'a0000000-0000-4000-8000-000000000004';

-- University of São Paulo — Aging Biology Unit — São Paulo, Brazil
update institutions set
  region = 'South America', lat = -23.55, lon = -46.63,
  specializations = ARRAY['Musculoskeletal','Aging Biology']
where id = 'a0000000-0000-4000-8000-000000000005';

-- Kyoto University Institute for Frontier Life Sciences — Kyoto, Japan
update institutions set
  region = 'Asia-Pacific', lat = 35.01, lon = 135.77,
  specializations = ARRAY['Sleep & Circadian','Frontier Life Sciences']
where id = 'a0000000-0000-4000-8000-000000000006';

-- University of Cape Town — Longevity Research Group — Cape Town, South Africa
update institutions set
  region = 'Africa', lat = -33.92, lon = 18.42,
  specializations = ARRAY['Skin & Regenerative','Longevity Research']
where id = 'a0000000-0000-4000-8000-000000000007';

-- MusB Research HQ marker
insert into institutions (name, country, city, region, lat, lon, is_hq, specializations)
values (
  'MusB Research Institute',
  'United States',
  'New Port Richey, FL',
  'North America',
  28.24, -82.72,
  true,
  ARRAY['Microbiome','Aging','Metabolic Health']
);
