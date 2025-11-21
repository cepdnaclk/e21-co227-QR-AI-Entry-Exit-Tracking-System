import { Router } from 'express';
import db from '../db';

const router = Router();

/**
 * GET /api/counts
 * Returns the current number of people inside each building.
 */
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        b.building_id AS id,
        b.building_name AS name,
        COALESCE(
          SUM(
            CASE 
              WHEN e.action = 'entry' THEN 1
              WHEN e.action = 'exit' THEN -1
              ELSE 0
            END
          ),
          0
        ) AS current_count
      FROM building b
      LEFT JOIN entryexitlog e 
        ON e.building_id = b.building_id
      GROUP BY b.building_id, b.building_name
      ORDER BY b.building_name;
    `;

    const { rows } = await db.query(query);

    //  Calculate total of all building counts
    const totalCount = rows.reduce((sum, b) => sum + Number(b.current_count || 0), 0);

    //  Send both buildings and total count
    res.json({
      buildings: rows,
      total_count: totalCount
    });

  } catch (err: unknown) {
    console.error('Error fetching building counts:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
export default router;
