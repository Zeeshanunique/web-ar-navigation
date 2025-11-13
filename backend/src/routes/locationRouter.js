const express = require('express');
const router = express.Router();
const {
  getAllLocations,
  getLocationByQRId,
  getLocationById,
  createLocation,
} = require('../controllers/locationController');

router.get('/', getAllLocations);
router.get('/qr/:qrId', getLocationByQRId);
router.get('/:locationId', getLocationById);
router.post('/', createLocation);

module.exports = router;

