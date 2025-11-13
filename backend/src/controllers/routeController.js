const Location = require('../models/Location');
const AStar = require('../utils/aStarAlgorithm');

/**
 * Calculate route between two locations
 */
const calculateRoute = async (req, res, next) => {
  try {
    const { source, destination } = req.body;

    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Source and destination are required',
      });
    }

    // Fetch all locations
    const locations = await Location.find({});

    if (locations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No locations found in database',
      });
    }

    // Initialize A* algorithm
    const aStar = new AStar(locations, []);

    // Find path
    const { path, distance } = aStar.findPath(source, destination);

    if (path.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No path found between locations',
      });
    }

    // Format path with directions
    const formattedPath = path.map((location, index) => {
      const nextLocation = path[index + 1];
      let direction = null;

      if (nextLocation) {
        const dx = nextLocation.coordinates.x - location.coordinates.x;
        const dy = nextLocation.coordinates.y - location.coordinates.y;
        
        // Calculate angle in degrees
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Convert to cardinal/ordinal directions
        if (angle >= -22.5 && angle < 22.5) direction = 'east';
        else if (angle >= 22.5 && angle < 67.5) direction = 'northeast';
        else if (angle >= 67.5 && angle < 112.5) direction = 'north';
        else if (angle >= 112.5 && angle < 157.5) direction = 'northwest';
        else if (angle >= 157.5 || angle < -157.5) direction = 'west';
        else if (angle >= -157.5 && angle < -112.5) direction = 'southwest';
        else if (angle >= -112.5 && angle < -67.5) direction = 'south';
        else if (angle >= -67.5 && angle < -22.5) direction = 'southeast';
      }

      return {
        locationId: location.locationId,
        name: location.name,
        coordinates: location.coordinates,
        direction,
        isDestination: index === path.length - 1,
      };
    });

    res.json({
      success: true,
      data: {
        path: formattedPath,
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        steps: formattedPath.length - 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculateRoute,
};

