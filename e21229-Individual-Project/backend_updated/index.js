const express = require('express');                // import express - used to build APIs and web applications
const cors = require('cors');                     // import cors - used to enable Cross-Origin Resource Sharing
const bodyParser = require('body-parser');                  // import body-parser - Converts JSON-formatted request bodies into JavaScript objects that you can use easily
const pool = require('./db');                               // import the database connection pool(allows executing SQL queries)


const app = express();                            //app is the Express application — it handles incoming requests and sends responses.
const PORT = 3000;                                //local server port

// Enable CORS for all origins(any frontend can make HTTP requests to this API)
app.use(cors());


// enable JSON parsing for incoming requests
app.use(bodyParser.json());


// API Documentation setup using Swagger
const swaggerUi = require('swagger-ui-express');              // import swagger-ui-express - serves auto-generated API docs
const YAML = require('yamljs');                               // import yamljs - loads YAML files
const swaggerDocument = YAML.load('./swagger.yaml');          

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));                      //serve API docs at /docs endpoint


// Test route
app.get('/', (req, res) => res.send("RFID API is running "));                //simple test route to verify server is running

// Insert RFID scan
app.post('/api/rfid-scan', async (req, res) => {                             //async because it will perform a database operation using await.
  try {
    console.log(" Received body:", req.body); 
    const { tag_id, reader_id, location, direction } = req.body;          //destructure the request body to get the RFID scan details
    const result = await pool.query(
      "INSERT INTO rfid_scans (tag_id, reader_id, location, direction, scan_time) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
      [tag_id, reader_id, location, direction]
    );
    res.json({ success: true, data: result.rows[0] });        //send back the inserted record as JSON response
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all RFID scans
app.get('/api/rfid-scans', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM rfid_scans ORDER BY scan_time DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(` Server running on http://localhost:${PORT}`));      // start the server and listen on port 3000

// 3. Get crowd count per building
app.get('/api/building-crowd', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
  location AS building_name,
  SUM(CASE WHEN direction = 'entry' THEN 1 WHEN direction = 'exit' THEN -1 ELSE 0 END) AS crowd_count,
  MAX(scan_time) AS last_updated
FROM rfid_scans
WHERE scan_time > NOW() - INTERVAL '5 minutes'
GROUP BY location`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Last location of a visitor
app.get('/api/visitor/:tag_id/last-location', async (req, res) => {
  try {
    const { tag_id } = req.params;
    const result = await pool.query(
      `SELECT location, scan_time 
       FROM rfid_scans 
       WHERE tag_id = $1 
       ORDER BY scan_time DESC LIMIT 1`,
      [tag_id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Total crowd count 

app.get('/api/total', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS total
      FROM (
        SELECT DISTINCT ON (tag_id) tag_id, direction
        FROM rfid_scans
        ORDER BY tag_id, scan_time DESC
      ) AS latest_scans
      WHERE direction = 'entry'
    `);

    res.json({ success: true, total_crowd: parseInt(result.rows[0].total) });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});





