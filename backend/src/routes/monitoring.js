const express = require('express');
const router = express.Router();
const monitoringController = require('../controllers/monitoringController');
// const { authenticate } = require('../middleware/auth'); // Optional: Add auth if needed

// GET /api/monitoring/metrics
router.get('/metrics', monitoringController.getMetrics);

module.exports = router;
