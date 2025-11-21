// import { Router } from 'express';
// import db from '../db';
// const router = Router();

// // POST - Record entry or exit
// router.post('/', async (req, res) => {
//   const { qr_value, building_id, action } = req.body;

//   if (!qr_value || !building_id || !['entry', 'exit'].includes(action)) {
//     return res.status(400).json({ error: 'Invalid or missing data' });
//   }

//   try {
//     const { rows } = await db.query(
//       `INSERT INTO entryexitlog (qr_value, building_id, action,timestamp)
//        VALUES ($1, $2, $3,now())
//        RETURNING *`,
//       [qr_value, building_id, action]
//     );
//     res.status(201).json(rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Database insert failed' });
//   }
// });

// // GET - Recent scans (latest 200)
// router.get('/recent', async (req, res) => {
//   const { rows } = await db.query(
//     'SELECT * FROM entryexitlog ORDER BY timestamp DESC LIMIT 200'
//   );
//   res.json(rows);
// });

// export default router;
