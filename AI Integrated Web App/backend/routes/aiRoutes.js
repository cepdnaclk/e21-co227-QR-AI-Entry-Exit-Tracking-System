// backend/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Video upload
router.post('/upload-video', aiController.uploadVideo);

// Calibration
router.post('/save-calibration', aiController.saveCalibration);
router.get('/calibration/:building_id', aiController.getCalibration);

// Control
router.post('/control', aiController.setControl);
router.get('/control/:building_id', aiController.getControl);
router.get('/control', aiController.getControl);

// Count updates from Python
router.post('/update', aiController.updateCount);

module.exports = router;