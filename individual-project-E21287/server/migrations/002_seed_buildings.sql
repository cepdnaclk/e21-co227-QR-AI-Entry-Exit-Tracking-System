-- -- Seed buildings (delete existing and insert canonical list)
-- BEGIN;
-- DELETE FROM building;

-- INSERT INTO building (building_id, building_name) VALUES
--   (1, 'Main Hall'),
--   (2, 'Exhibition Hall A'),
--   (3, 'Engineering Block'),
--   (4, 'Library'),
--   (5, 'Auditorium');

-- -- Reset the serial sequence so future inserts don't conflict
-- SELECT setval(pg_get_serial_sequence('building','building_id'), COALESCE(MAX(building_id), 1)) FROM building;

-- COMMIT;
