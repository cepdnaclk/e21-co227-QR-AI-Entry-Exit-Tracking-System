const pool = require('../config/database');

// Get all buildings
exports.getBuildings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "BUILDING" ORDER BY building_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get building by ID
exports.getBuildingById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM "BUILDING" WHERE building_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching building:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};