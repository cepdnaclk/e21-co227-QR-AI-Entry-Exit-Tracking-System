const pool = require('../config/database');

// Process QR scan
exports.processScan = async (req, res) => {
  const { building_id, direction, tag_id } = req.body;
  
  if (!building_id || !direction || !['IN', 'OUT'].includes(direction) || !tag_id) {
    return res.status(400).json({ 
      error: 'Invalid request parameters. Required: building_id, direction (IN/OUT), tag_id (numeric)' 
    });
  }
  
  try {
    // Insert into EntryExitLog - the trigger will handle the logic
    const query = `
      INSERT INTO "EntryExitLog" (building_id, direction, tag_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    
    const result = await pool.query(query, [building_id, direction, tag_id]);
    
    // Get updated building count
    const buildingResult = await pool.query(
      'SELECT * FROM "BUILDING" WHERE building_id = $1',
      [building_id]
    );
    
    res.json({
      message: `Successfully processed ${direction} scan for person ${tag_id}`,
      building: buildingResult.rows[0],
      log: result.rows[0]
    });
  } catch (error) {
    console.error('Error processing scan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get entry/exit logs (unchanged)
exports.getLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM "EntryExitLog" 
      ORDER BY entry_time DESC 
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};