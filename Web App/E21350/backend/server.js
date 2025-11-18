const express = require('express'); 
const cors = require('cors'); 
const buildingRoutes = require('./routes/buildingRoutes'); 
const scanRoutes = require('./routes/scanRoutes'); 

// Initialize Express application
const app = express();

// Enable CORS all origins
app.use(cors());

// This makes req.body available in route handlers
app.use(express.json());

// Health check endpoint - used to verify server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Register route modules
app.use('/api/buildings', buildingRoutes); 
app.use('/api/scan', scanRoutes); 

const PORT = process.env.PORT || 3001; 

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});