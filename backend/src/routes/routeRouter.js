const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');

// POST /api/route - Calculate route between two locations
router.post('/route', routeController.calculateRoute);

module.exports = router;

