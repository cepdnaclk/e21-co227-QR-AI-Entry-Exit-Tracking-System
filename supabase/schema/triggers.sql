-- Entry Exit Tracking Trigger for QR scans

CREATE OR REPLACE TRIGGER process_scan_before
BEFORE INSERT ON "EntryExitLog"
FOR EACH ROW
EXECUTE FUNCTION handle_scan_before();

