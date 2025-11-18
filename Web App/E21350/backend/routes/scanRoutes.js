const express = require('express');
const router = express.Router(); // Create a new router instance
const scanController = require('../controllers/scanController');

// POST /api/scan
router.post('/', scanController.processScan);

// GET /api/scan/logs
router.get('/logs', scanController.getLogs);

module.exports = router; 