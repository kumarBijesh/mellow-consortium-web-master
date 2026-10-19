-- MELLOW Consortium — real destinations for the "integrated global
-- ecosystem" division icons. Run this AFTER schema.sql.
--
-- 'age' (Digital Platform) is intentionally left alone: external_url stays
-- NULL, and EcosystemGrid.tsx's FALLBACK_HREFS already sends it to
-- /mellow-age. 'conferences' (Community) is on hold pending a destination.

update divisions set external_url = 'https://www.jlivejournals.com/' where id = 'jlive';
