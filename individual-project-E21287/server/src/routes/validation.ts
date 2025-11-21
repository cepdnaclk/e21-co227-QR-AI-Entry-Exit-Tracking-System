import { Router } from 'express';
import db from '../db';

const router = Router();

router.post('/', async (req, res) => {
  const { qr_value, building_id, action } = req.body;

  if (!qr_value || !building_id || !['entry', 'exit'].includes(action)) {
    return res.status(400).json({
      error: 'Missing or invalid qr_value, building_id, or action',
    });
  }

  if (!/^\d+$/.test(qr_value)) {
    return res.status(400).json({
      error: 'Invalid QR code: must be a number',
    });
  }

  try {
    // Get logs for this user (latest first)
    const { rows: logs } = await db.query(
      `SELECT log_id, building_id, action
       FROM entryexitlog
       WHERE qr_value = $1
       ORDER BY timestamp DESC`,
      [qr_value]
    );

    // Find last active entry (no exit after it)
    let activeEntry: { log_id: number; building_id: number } | null = null;
    for (let i = 0; i < logs.length; i++) {
      const row = logs[i];
      if (row.action === 'entry') {
        const nextRow = logs[i - 1];
        if (!nextRow || nextRow.action !== 'exit') {
          activeEntry = row;
          break;
        }
      }
    }

    // --- ENTRY LOGIC ---
    if (action === 'entry') {
      if (activeEntry) {
        if (activeEntry.building_id !== building_id) {
          // 🧩 delete the old "entry" since entering new building without exit
          await db.query(
            `DELETE FROM entryexitlog WHERE log_id = $1`,
            [activeEntry.log_id]
          );
          console.log(
            `Deleted old entry (log_id=${activeEntry.log_id}) to allow new building entry`
          );
        } else {
          // Already inside the same building
          return res.status(403).json({
            allowed: false,
            reason: 'Already inside this building',
          });
        }
      }

      // Insert new entry
      const { rows: inserted } = await db.query(
        `INSERT INTO entryexitlog (qr_value, building_id, action, timestamp)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [qr_value, building_id, action]
      );

      return res.status(201).json({ allowed: true, log: inserted[0] });
    }

    // --- EXIT LOGIC ---
    if (action === 'exit') {
      if (!activeEntry) {
        return res.status(403).json({
          allowed: false,
          reason: 'Not inside any building to exit',
        });
      }

      // Cannot exit from different building
      if (activeEntry.building_id !== building_id) {
        return res.status(403).json({
          allowed: false,
          reason: 'Cannot exit from a building you are not inside',
        });
      }

      //  Valid exit
      const { rows: inserted } = await db.query(
        `INSERT INTO entryexitlog (qr_value, building_id, action, timestamp)
         VALUES ($1, $2, $3, NOW(),$4)
         RETURNING *`,
        [qr_value, building_id, action]
      );
      return res.status(201).json({ allowed: true, log: inserted[0] });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (err: unknown) {
    console.error('DB Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown DB error';
    res.status(500).json({ error: message });
  }
});

export default router;
