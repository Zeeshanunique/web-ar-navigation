const Location = require('../models/Location');
const { aStar, createGraph } = require('../utils/aStarAlgorithm');

/**
 * Calculate route between two locations using A* algorithm
 */
exports.calculateRoute = async (req, res, next) => {
  try {
    const { source, destination } = req.body;
    
    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination are required',
      });
    }
    
    // Get all locations
    const locations = await Location.find();
    
    if (locations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No locations found in database',
      });
    }
    
    // Verify source and destination exist
    const sourceLocation = locations.find((l) => l.id === source);
    const destLocation = locations.find((l) => l.id === destination);
    
    if (!sourceLocation) {
      return res.status(404).json({
        success: false,
        message: `Source location '${source}' not found`,
      });
    }
    
    if (!destLocation) {
      return res.status(404).json({
        success: false,
        message: `Destination location '${destination}' not found`,
      });
    }
    
    // Build graph from locations
    const connections = [];
    locations.forEach((location) => {
      if (location.connections && location.connections.length > 0) {
        location.connections.forEach((connectedId) => {
          // Avoid duplicate edges
          if (
            !connections.some(
              (c) =>
                (c.from === location.id && c.to === connectedId) ||
                (c.from === connectedId && c.to === location.id)
            )
          ) {
            connections.push({
              from: location.id,
              to: connectedId,
            });
          }
        });
      }
    });
    
    // If no explicit connections, create connections based on proximity
    if (connections.length === 0) {
      locations.forEach((loc1) => {
        locations.forEach((loc2) => {
          if (loc1.id !== loc2.id) {
            const distance = Math.sqrt(
              Math.pow(loc2.x - loc1.x, 2) + Math.pow(loc2.y - loc1.y, 2)
            );
            // Connect if within reasonable distance (adjust threshold as needed)
            if (distance <= 10) {
              connections.push({
                from: loc1.id,
                to: loc2.id,
              });
            }
          }
        });
      });
    }
    
    const graph = createGraph(locations, connections);
    
    // Calculate path using A*
    const path = aStar(graph, source, destination);
    
    if (!path || path.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No path found between source and destination',
      });
    }
    
    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const dx = path[i + 1].x - path[i].x;
      const dy = path[i + 1].y - path[i].y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
    
    res.json({
      success: true,
      data: {
        path,
        distance: totalDistance,
        steps: path.length,
        source: sourceLocation,
        destination: destLocation,
      },
    });
  } catch (error) {
    next(error);
  }
};

