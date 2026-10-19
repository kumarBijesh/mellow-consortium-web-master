-- MELLOW Consortium — application acceptance -> real account pipeline.
--
-- Note on ordering: the spec's Step C is what formally introduces the
-- hospitals.kind column ('external' | 'individual_provider' | 'internal'),
-- but Step B's "accept as Individual Provider" path needs somewhere to
-- record that choice on the created account. Pulling just the column
-- forward here (not the internal Mellow org row or the admin-list
-- badges — those still land in Step C) so Step B has something to write
-- to. Run any time after hospitals.sql.

-- ============================================================
-- 1. hospitals.kind — distinguishes a real external partner hospital
-- from an Individual Provider account (same table/dashboard, per spec
-- section 4) and from the internal Mellow Consortium org (Step C).
-- ============================================================
alter table hospitals
  add column if not exists kind text not null default 'external'
    check (kind in ('external', 'individual_provider', 'internal'));

-- ============================================================
-- 2. applications.created_hospital_id — traceability from an accepted
-- application back to the account it produced (a Hospital row and an
-- Individual Provider row are both `hospitals` rows per spec section 4,
-- so one FK covers both outcomes; the outcome itself is read off that
-- row's `kind`).
-- ============================================================
alter table applications
  add column if not exists created_hospital_id uuid references hospitals(id) on delete set null;

-- reviewed_by already exists (text) but has never been populated by any
-- code path so far — the new accept/reject actions start setting it to
-- the reviewing admin's email.
