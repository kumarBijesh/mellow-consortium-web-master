-- MELLOW Consortium — placeholder content seed
-- Run this AFTER schema.sql. Realistic but placeholder copy so every page
-- has something to show; swap for real content whenever it's ready.
-- Uses fixed UUIDs so institutions/investigators/trials can be
-- cross-referenced within this same script.

-- ============================================================
-- Institutions
-- ============================================================
insert into institutions (id, name, country, city, website) values
  ('a0000000-0000-4000-8000-000000000001', 'Karolinska Longevity Institute', 'Sweden', 'Stockholm', 'https://example.org/karolinska-longevity'),
  ('a0000000-0000-4000-8000-000000000002', 'Singapore Centre for Healthy Longevity', 'Singapore', 'Singapore', 'https://example.org/sg-healthy-longevity'),
  ('a0000000-0000-4000-8000-000000000003', 'Mayo Clinic Center for Regenerative Medicine', 'United States', 'Rochester', 'https://example.org/mayo-regenerative'),
  ('a0000000-0000-4000-8000-000000000004', 'Max Planck Institute for Biology of Ageing', 'Germany', 'Cologne', 'https://example.org/mpi-ageing'),
  ('a0000000-0000-4000-8000-000000000005', 'University of São Paulo, Aging Biology Unit', 'Brazil', 'São Paulo', 'https://example.org/usp-aging'),
  ('a0000000-0000-4000-8000-000000000006', 'Kyoto University Institute for Frontier Life Sciences', 'Japan', 'Kyoto', 'https://example.org/kyoto-frontier'),
  ('a0000000-0000-4000-8000-000000000007', 'University of Cape Town, Longevity Research Group', 'South Africa', 'Cape Town', 'https://example.org/uct-longevity');

-- ============================================================
-- Investigators
-- ============================================================
insert into investigators (id, full_name, title, institution_id, bio) values
  ('b0000000-0000-4000-8000-000000000001', 'Elena Kovač', 'MD, PhD', 'a0000000-0000-4000-8000-000000000001', 'Metabolic health researcher focused on early pharmacological intervention in pre-diabetic ageing populations.'),
  ('b0000000-0000-4000-8000-000000000002', 'Wei Tan', 'MBBS, PhD', 'a0000000-0000-4000-8000-000000000002', 'Studies combined exercise and nutrition interventions for cognitive resilience in older adults.'),
  ('b0000000-0000-4000-8000-000000000003', 'Marcus Alvarez', 'MD', 'a0000000-0000-4000-8000-000000000003', 'Leads early-phase senolytic and senomorphic trials targeting frailty and cellular senescence.'),
  ('b0000000-0000-4000-8000-000000000004', 'Sofia Bergmann', 'PhD', 'a0000000-0000-4000-8000-000000000004', 'Investigates circadian and nutrient-timing effects on cardiometabolic biomarkers.'),
  ('b0000000-0000-4000-8000-000000000005', 'Renata Souza', 'MD, PhD', 'a0000000-0000-4000-8000-000000000005', 'Focuses on resistance training dose-response and sarcopenia prevention in ageing populations.'),
  ('b0000000-0000-4000-8000-000000000006', 'Haruto Nakamura', 'PhD', 'a0000000-0000-4000-8000-000000000006', 'Researches circadian light exposure and its downstream effects on sleep quality and healthspan.'),
  ('b0000000-0000-4000-8000-000000000007', 'Naledi Dlamini', 'MBChB, PhD', 'a0000000-0000-4000-8000-000000000007', 'Studies topical and systemic biomarkers of skin ageing and regenerative interventions.');

-- ============================================================
-- Trials
-- ============================================================
insert into trials (id, title, slug, summary, status, therapeutic_area, lead_investigator_id, sponsor_institution_id, starts_on, ends_on) values
  ('c0000000-0000-4000-8000-000000000001', 'Metformin and Healthspan in Pre-Diabetic Adults', 'metformin-healthspan-prediabetic-adults', 'Evaluating whether early metformin intervention slows metabolic ageing markers in pre-diabetic adults aged 50-70.', 'recruiting', 'Metabolic', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2026-10-01', null),
  ('c0000000-0000-4000-8000-000000000002', 'Cognitive Resilience Following Combined Exercise-Nutrition Intervention', 'cognitive-resilience-exercise-nutrition', 'A 12-month combined intervention testing structured exercise plus targeted nutrition on cognitive resilience in adults 65+.', 'active', 'Cognitive', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', '2026-03-01', null),
  ('c0000000-0000-4000-8000-000000000003', 'Senolytic Combination Therapy in Early Frailty', 'senolytic-combination-therapy-early-frailty', 'Phase II study of combination senolytic therapy in adults with early markers of frailty and elevated cellular senescence burden.', 'recruiting', 'Cellular Senescence', 'b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', '2026-11-15', null),
  ('c0000000-0000-4000-8000-000000000004', 'Time-Restricted Eating and Cardiometabolic Risk Markers', 'time-restricted-eating-cardiometabolic-risk', 'Randomized trial comparing time-restricted eating windows against standard dietary guidance on cardiometabolic risk markers.', 'active', 'Cardiovascular', 'b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004', '2026-01-15', null),
  ('c0000000-0000-4000-8000-000000000005', 'Resistance Training Dose-Response in Sarcopenia Prevention', 'resistance-training-dose-response-sarcopenia', 'Completed dose-response study identifying minimum effective resistance training volume for preserving muscle mass in adults 60+.', 'completed', 'Musculoskeletal', 'b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000005', '2024-06-01', '2025-12-01'),
  ('c0000000-0000-4000-8000-000000000006', 'Circadian Light Exposure and Sleep Quality in Older Adults', 'circadian-light-exposure-sleep-quality', 'Upcoming study on structured morning light exposure protocols and their effect on sleep quality and circadian alignment.', 'planned', 'Sleep & Circadian', 'b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000006', '2027-02-01', null),
  ('c0000000-0000-4000-8000-000000000007', 'Topical NAD+ Precursors and Skin Biomarkers of Ageing', 'topical-nad-precursors-skin-biomarkers', 'Evaluating topical NAD+ precursor formulations against placebo on validated biomarkers of skin ageing over 16 weeks.', 'recruiting', 'Skin & Regenerative', 'b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000007', '2026-09-01', null),
  ('c0000000-0000-4000-8000-000000000008', 'Multinational Biological Age Clock Validation Study', 'mellow-clock-multinational-validation', 'The Consortium''s flagship trial: validating a shared biological-age clock across seven countries and diverse ancestries: one protocol, one budget, one dataset.', 'active', 'Metabolic', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2025-09-01', null);

-- ============================================================
-- Trial sites
-- MELLOW-CLOCK is the flagship multi-country trial — one site per
-- member institution, matching the homepage's "six continents" framing.
-- ============================================================
insert into trial_sites (trial_id, country, city, institution_id) values
  ('c0000000-0000-4000-8000-000000000008', 'Sweden', 'Stockholm', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000008', 'Singapore', 'Singapore', 'a0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000008', 'United States', 'Rochester', 'a0000000-0000-4000-8000-000000000003'),
  ('c0000000-0000-4000-8000-000000000008', 'Germany', 'Cologne', 'a0000000-0000-4000-8000-000000000004'),
  ('c0000000-0000-4000-8000-000000000008', 'Brazil', 'São Paulo', 'a0000000-0000-4000-8000-000000000005'),
  ('c0000000-0000-4000-8000-000000000008', 'Japan', 'Kyoto', 'a0000000-0000-4000-8000-000000000006'),
  ('c0000000-0000-4000-8000-000000000008', 'South Africa', 'Cape Town', 'a0000000-0000-4000-8000-000000000007'),
  ('c0000000-0000-4000-8000-000000000003', 'United States', 'Rochester', 'a0000000-0000-4000-8000-000000000003'),
  ('c0000000-0000-4000-8000-000000000003', 'Sweden', 'Stockholm', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000004', 'Germany', 'Cologne', 'a0000000-0000-4000-8000-000000000004'),
  ('c0000000-0000-4000-8000-000000000004', 'Singapore', 'Singapore', 'a0000000-0000-4000-8000-000000000002');

-- ============================================================
-- News posts
-- ============================================================
insert into news_posts (title, slug, division_id, excerpt, body, published_at) values
  (
    'MELLOW Consortium launches seven-country biological age clock validation study',
    'mellow-clock-launch',
    'consortium',
    'MELLOW-CLOCK brings together all seven member institutions under one shared protocol and dataset.',
    'The MELLOW Consortium has formally launched MELLOW-CLOCK, its flagship multinational study validating a shared biological-age clock across seven countries and diverse ancestries.
The trial runs under a single protocol and a single shared budget across all seven member institutions, from Stockholm to Cape Town.
"One trial, six continents, one budget: that''s the whole premise of the Consortium," said Dr. Elena Kovač, the study''s lead investigator. "A biomarker that only validates in one population isn''t good enough for a platform we want the whole world to trust."
Enrollment is underway at all seven sites, with first-year results expected in late 2027.',
    '2026-08-18T09:00:00Z'
  ),
  (
    'MELLOW-Age adds personalized sleep coaching to care plans',
    'mellow-age-sleep-coaching',
    'age',
    'A new module brings circadian-informed sleep coaching to every MELLOW-Age care plan at no extra cost.',
    'MELLOW-Age has rolled out a new sleep coaching module for every active care plan, drawing on circadian research from the Consortium''s Sleep & Circadian trial track.
The module pairs personalized light-exposure guidance with weekly check-ins, and is included automatically for existing subscribers.
Early pilot users reported meaningful improvements in sleep quality scores within six weeks.',
    '2026-08-05T09:00:00Z'
  ),
  (
    'JLIVE opens submissions for inaugural longevity evidence special issue',
    'jlive-inaugural-special-issue',
    'jlive',
    'The new special issue focuses on real-world evidence in longevity and integrated vitality research.',
    'JLIVE, the Consortium''s publishing division, has opened submissions for its inaugural special issue focused on real-world evidence in longevity science.
The editorial board is prioritizing rigorous, fairly-reviewed work, including null and negative results, which are often underrepresented in the field.
Submission guidelines and deadlines are available directly from the JLIVE editorial office.',
    '2026-07-22T09:00:00Z'
  ),
  (
    'Registration opens for the 2027 MELLOW Annual Meeting in Singapore',
    'annual-meeting-2027-singapore',
    'conferences',
    'The 2027 Annual Meeting returns to Singapore, hosted alongside the Singapore Centre for Healthy Longevity.',
    'Registration is now open for the 2027 MELLOW Annual Meeting, hosted in Singapore alongside the Singapore Centre for Healthy Longevity.
This year''s program includes tracks on cellular senescence, metabolic health, and multinational trial design, plus a full day dedicated to early-career investigators.
Member institutions receive a registration discount; details are available through the Conferences division.',
    '2026-07-10T09:00:00Z'
  ),
  (
    'Six-month results from CHRONOFAST show improved fasting glucose',
    'chronofast-six-month-results',
    'consortium',
    'Interim results from the time-restricted eating trial show measurable improvements in fasting glucose markers.',
    'Interim six-month results from CHRONOFAST, the Consortium''s time-restricted eating trial, show measurable improvements in fasting glucose among the intervention group compared to standard dietary guidance.
The trial, led by Dr. Sofia Bergmann at the Max Planck Institute for Biology of Ageing, continues enrollment at its second site in Singapore.
Full results are expected following trial completion.',
    '2026-06-28T09:00:00Z'
  ),
  (
    'MELLOW Consortium welcomes the University of Cape Town as seventh member institution',
    'uct-joins-consortium',
    'consortium',
    'The University of Cape Town''s Longevity Research Group joins as the Consortium''s newest member institution.',
    'The MELLOW Consortium has welcomed the University of Cape Town''s Longevity Research Group as its seventh member institution, extending the network''s trial footprint to the African continent for the first time.
Dr. Naledi Dlamini, who leads the group, will serve as lead investigator on the Consortium''s skin and regenerative biology trial track.
"Longevity science has to be tested everywhere people actually live, not just in a handful of high-income countries," said Dlamini. "This partnership changes what our data can actually say."',
    '2026-06-02T09:00:00Z'
  );

-- ============================================================
-- Founders
-- ============================================================
insert into founders (full_name, title, bio, sort_order) values
  ('Amara Whitfield', 'Co-Founder & Chief Scientific Officer', 'Translational scientist with two decades in multinational trial design, focused on making longevity evidence reproducible across populations.', 1),
  ('Jonas Lindqvist', 'Co-Founder & CEO', 'Previously built research-network infrastructure across three continents; now focused on aligning the Consortium''s member institutions under one shared protocol standard.', 2);
