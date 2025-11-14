const Location = require('../models/Location');

/**
 * Get location by ID
 */
exports.getLocationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const location = await Location.findOne({ id });
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
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
 * Get all destinations
 */
exports.getDestinations = async (req, res, next) => {
  try {
    const destinations = await Location.find({ isDestination: true })
      .select('id name category icon')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: destinations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all locations
 */
exports.getAllLocations = async (req, res, next) => {
  try {
    const locations = await Location.find().sort({ name: 1 });
    
    res.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new location
 */
exports.createLocation = async (req, res, next) => {
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
        message: 'Location ID already exists',
      });
    }
    next(error);
  }
};

