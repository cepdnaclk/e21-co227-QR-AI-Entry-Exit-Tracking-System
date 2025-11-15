// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const aiRoutes = require('./routes/aiRoutes');
const buildingRoutes = require('./routes/buildingRoutes');
const scanRoutes = require('./routes/scanRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploaded videos
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// API Routes
app.use('/api/buildings', buildingRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/ai', aiRoutes);

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Catch-all
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  console.log(`🧠 AI endpoints: /api/ai/*`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
});