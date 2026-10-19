-- MELLOW Consortium — fixes em dashes baked into already-seeded content.
-- The site-wide em-dash cleanup only touched hardcoded strings/translations;
-- this covers the same text that lives in the database instead (seed.sql
-- content, plus the platform_settings row from network-admin.sql). Run
-- this any time after seed.sql / network-admin.sql have been applied.

update institutions set name = 'University of São Paulo, Aging Biology Unit'
  where id = 'a0000000-0000-4000-8000-000000000005';

update institutions set name = 'University of Cape Town, Longevity Research Group'
  where id = 'a0000000-0000-4000-8000-000000000007';

update trials set summary = 'The Consortium''s flagship trial: validating a shared biological-age clock across seven countries and diverse ancestries: one protocol, one budget, one dataset.'
  where id = 'c0000000-0000-4000-8000-000000000008';

update news_posts set body = 'The MELLOW Consortium has formally launched MELLOW-CLOCK, its flagship multinational study validating a shared biological-age clock across seven countries and diverse ancestries.
The trial runs under a single protocol and a single shared budget across all seven member institutions, from Stockholm to Cape Town.
"One trial, six continents, one budget: that''s the whole premise of the Consortium," said Dr. Elena Kovač, the study''s lead investigator. "A biomarker that only validates in one population isn''t good enough for a platform we want the whole world to trust."
Enrollment is underway at all seven sites, with first-year results expected in late 2027.'
  where slug = 'mellow-clock-launch';

update news_posts set body = 'JLIVE, the Consortium''s publishing division, has opened submissions for its inaugural special issue focused on real-world evidence in longevity science.
The editorial board is prioritizing rigorous, fairly-reviewed work, including null and negative results, which are often underrepresented in the field.
Submission guidelines and deadlines are available directly from the JLIVE editorial office.'
  where slug = 'jlive-inaugural-special-issue';

update platform_settings set source = 'NEEDS REAL SOURCE: placeholder carried over from the original design. Update via Admin → Network → Market Stat.'
  where key = 'longevity_market' and source like '%—%';
