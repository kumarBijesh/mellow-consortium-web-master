-- MELLOW Consortium — trial location + external enrolment link.
-- Run any time after schema.sql. Safe to re-run.
--
-- Supports manually syncing trials from musbresearch.com/trials: the
-- admin copies the trial in and links back to its MusB listing, which
-- stays the source of truth for eligibility and enrolment. The public
-- trial page shows an enrol button pointing there.

alter table trials
  add column if not exists location text,     -- e.g. 'Tampa Bay, FL'
  add column if not exists enroll_url text;   -- external listing / enrolment page

-- Rendered as a public <a href>, so only http(s) links are allowed —
-- blocks javascript:/data: URLs even if the app-side check is bypassed.
alter table trials drop constraint if exists trials_enroll_url_http;
alter table trials add constraint trials_enroll_url_http
  check (enroll_url is null or enroll_url ~* '^https?://');
