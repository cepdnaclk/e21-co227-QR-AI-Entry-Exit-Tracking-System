const express = require('express');
const router = express.Router(); // Create a new router instance
const buildingController = require('../controllers/buildingController');

// GET /api/buildings
router.get('/', buildingController.getBuildings); // Fetch all buildings with their current occupancy counts

// POST /api/buildings/count
router.post('/count', buildingController.updateCount); // Manually update occupancy count for a building

module.exports = router; // Export router to be used in server.js