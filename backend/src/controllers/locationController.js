const Location = require('../models/Location');

/**
 * Get all locations
 */
const getAllLocations = async (req, res, next) => {
  try {
    const locations = await Location.find({}).select('-__v');
    res.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get location by QR code ID
 */
const getLocationByQRId = async (req, res, next) => {
  try {
    const { qrId } = req.params;
    const location = await Location.findOne({ qrCodeId: qrId });

    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found',
      });
    }

    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get location by location ID
 */
const getLocationById = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const location = await Location.findOne({ locationId });

    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found',
      });
    }

    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new location
 */
const createLocation = async (req, res, next) => {
  try {
    const location = new Location(req.body);
    await location.save();
    res.status(201).json({
      success: true,
      data: location,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Location with this ID already exists',
      });
    }
    next(error);
  }
};

module.exports = {
  getAllLocations,
  getLocationByQRId,
  getLocationById,
  createLocation,
};

