const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');

router.post('/', scanController.processScan);
router.get('/logs', scanController.getLogs);

module.exports = router;