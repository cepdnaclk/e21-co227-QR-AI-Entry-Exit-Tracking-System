import { Router } from 'express';
import db from '../db';
const router = Router();

//  GET all buildings
router.get('/', async (req, res) => {
  const { rows } = await db.query(
    'SELECT building_id AS id, building_name AS name FROM building ORDER BY building_name'
  );
  res.json(rows);
});

// POST - Add a new building
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing building name' });

  const { rows } = await db.query(
    'INSERT INTO building (building_name) VALUES ($1) RETURNING *',
    [name]
  );
  res.status(201).json(rows[0]);
});

// PUT - Update building name
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing building name' });

  const { rows } = await db.query(
    'UPDATE building SET building_name = $1 WHERE building_id = $2 RETURNING *',
    [name, id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Building not found' });
  res.json(rows[0]);
});

// DELETE - Remove a building
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM building WHERE building_id = $1', [id]);
  res.json({ success: true });
});

export default router;
