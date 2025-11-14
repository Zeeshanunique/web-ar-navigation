const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// GET /api/destinations - Get all destinations (must be before /:id)
router.get('/destinations', locationController.getDestinations);

// GET /api/location/:id - Get location by ID
router.get('/:id', locationController.getLocationById);

// GET /api/location - Get all locations
router.get('/', locationController.getAllLocations);

// POST /api/location - Create new location
router.post('/', locationController.createLocation);

module.exports = router;

