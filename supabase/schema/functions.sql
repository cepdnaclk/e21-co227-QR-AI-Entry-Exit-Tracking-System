-- Entry Exit Tracking Trigger Function
-- This function handles the logic for processing IN and OUT scans

CREATE OR REPLACE FUNCTION handle_scan_before()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE NOTICE 'Trigger fired: tag_id=%, building_id=%, direction=%',
    NEW.tag_id, NEW.building_id, NEW.direction;

  IF NEW.direction = 'IN' THEN
    -- For IN scans: set entry time and allow insertion/update
    NEW.entry_time := NOW();
    NEW.exit_time := NULL;
    
    -- Increment building count
    UPDATE "BUILDING"
    SET total_count = total_count + 1,
        count_per_day = count_per_day + 1
    WHERE building_id = NEW.building_id;

    RAISE NOTICE 'IN detected → Processing tag_id=%', NEW.tag_id;
    RETURN NEW;

  ELSIF NEW.direction = 'OUT' THEN
    -- For OUT scans: UPDATE the existing record instead of inserting new one
    UPDATE "EntryExitLog"
    SET exit_time = NOW()
    WHERE tag_id = NEW.tag_id;
    
    -- Check if update was successful
    IF FOUND THEN
      -- Decrement building count
      UPDATE "BUILDING"
      SET total_count = GREATEST(total_count - 1, 0)
      WHERE building_id = NEW.building_id;
      
      RAISE NOTICE 'OUT detected → Updated exit_time for tag_id=%', NEW.tag_id;
    ELSE
      RAISE WARNING 'No record found for OUT scan: tag_id=%', NEW.tag_id;
    END IF;

    -- Discard the OUT insert completely
    RETURN NULL; 
  END IF;

  RETURN NULL;
END;
$$;


-- Function to update building counts based on manual count inserts
CREATE OR REPLACE FUNCTION update_building_count(
    p_building_id TEXT,
    p_direction TEXT,
    p_count INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_total INT;
    diff INT;
BEGIN
    SELECT total_count INTO current_total FROM "BUILDING" WHERE building_id = p_building_id;

    IF UPPER(TRIM(p_direction)) = 'IN' THEN
        UPDATE "BUILDING"
        SET total_count = total_count + p_count,
            count_per_day = count_per_day + p_count
        WHERE building_id = p_building_id;

    ELSIF UPPER(TRIM(p_direction)) = 'OUT' THEN
        UPDATE "BUILDING"
        SET total_count = GREATEST(total_count - p_count, 0)
        WHERE building_id = p_building_id;
        
    END IF;
END;
$$;
