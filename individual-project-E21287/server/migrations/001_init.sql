-- -- existing schema (keeps your current definitions)
-- CREATE TABLE IF NOT EXISTS building (
--   building_id serial PRIMARY KEY,
--   building_name text NOT NULL
-- );

-- CREATE TABLE IF NOT EXISTS entryexitlog (
--   id serial PRIMARY KEY,
--   qr_value text NOT NULL,
--   building_id int REFERENCES building(building_id),
--   action text NOT NULL CHECK (action IN ('entry','exit')),
--   timestamp timestamptz DEFAULT now()
-- );

-- -- populate building table with explicit ids
-- INSERT INTO building (building_id, building_name) VALUES
--   (1, 'Main Hall'),
--   (2, 'Exhibition Hall A'),
--   (3, 'Engineering Block'),
--   (4, 'Library'),
--   (5, 'Auditorium')
-- ON CONFLICT (building_id) DO NOTHING;

-- -- ensure the serial sequence for building_id is set to max(existing id)
-- SELECT setval(pg_get_serial_sequence('building','building_id'), COALESCE(MAX(building_id), 1)) FROM building;