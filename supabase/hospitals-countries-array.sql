-- MELLOW Consortium — hospitals.countries becomes a text[] column,
-- replacing the hospital_countries join table (per the new Admin/
-- Hospital spec). Confirmed with the user first — small dataset (10
-- hospitals, 14 country rows), no data loss: array_agg below carries
-- every existing hospital's full country list across before the old
-- table is dropped.

-- ============================================================
-- 1. New column, backfilled from the join table in one statement
-- ============================================================
alter table hospitals add column if not exists countries text[] not null default '{}';

update hospitals h
set countries = coalesce(sub.agg, '{}')
from (
  select hospital_id, array_agg(country order by country) as agg
  from hospital_countries
  group by hospital_id
) sub
where sub.hospital_id = h.id;

-- ============================================================
-- 2. Drop the old table (RLS policies go with it automatically)
-- ============================================================
drop table if exists hospital_countries;

