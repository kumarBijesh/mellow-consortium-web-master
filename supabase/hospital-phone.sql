-- MELLOW Consortium — optional phone number on hospitals, shown on the
-- admin "Add hospital" form. Run any time after hospitals.sql.

alter table hospitals
  add column if not exists phone text;
