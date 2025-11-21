// import { Router } from 'express';
// import db from '../db';
// const router = Router();

// router.get('/', async (req, res) => {
//   try {
//     const { rows } = await db.query('SELECT count(*)::int AS count FROM building');
//     res.json({
//       pid: process.pid,
//       db_ok: true,
//       building_count: rows[0].count
//     });
//   } catch (e) {
//     if (e instanceof Error) {
//       res.status(500).json({ error: e.message });
//     } else {
//       res.status(500).json({ error: String(e) });
//     }
//   }
// });
// export default router;