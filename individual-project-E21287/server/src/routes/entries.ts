// import { Router } from 'express';
// import db from '../db';
// const router = Router();

// router.post('/', async (req, res) => {
//   const { qr_value, building_id, action } = req.body;
//   try {
//     const { rows } = await db.query(
//       `INSERT INTO entryexitlog (qr_value, building_id, action, timestamp) VALUES ($1, $2, $3, now()) RETURNING *`,
//       [qr_value, building_id, action]
//     );
//     res.json(rows[0]);
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ error: 'Insert failed' });
//   }
// });

// export default router;