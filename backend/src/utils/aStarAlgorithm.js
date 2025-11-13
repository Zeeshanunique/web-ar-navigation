/**
 * A* Pathfinding Algorithm Implementation
 * Finds the shortest path between two locations in a graph
 */

class AStar {
  constructor(locations, connections) {
    this.locations = locations;
    this.connections = connections;
  }

  /**
   * Calculate Euclidean distance between two points
   */
  heuristic(loc1, loc2) {
    const dx = loc1.coordinates.x - loc2.coordinates.x;
    const dy = loc1.coordinates.y - loc2.coordinates.y;
    const dz = loc1.coordinates.z - loc2.coordinates.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Get neighbors of a location
   */
  getNeighbors(locationId) {
    const location = this.locations.find(loc => loc.locationId === locationId);
    if (!location || !location.connections) return [];

    return location.connections.map(conn => {
      const neighbor = this.locations.find(loc => loc.locationId === conn.locationId);
      return {
        location: neighbor,
        distance: conn.distance || this.heuristic(location, neighbor),
      };
    }).filter(n => n.location);
  }

  /**
   * Reconstruct path from cameFrom map
   */
  reconstructPath(cameFrom, current) {
    const path = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current);
      path.unshift(current);
    }
    return path;
  }

  /**
   * Find shortest path using A* algorithm
   * @param {string} startId - Starting location ID
   * @param {string} goalId - Destination location ID
   * @returns {Object} - { path: Array, distance: Number }
   */
  findPath(startId, goalId) {
    const start = this.locations.find(loc => loc.locationId === startId);
    const goal = this.locations.find(loc => loc.locationId === goalId);

    if (!start || !goal) {
      throw new Error('Start or goal location not found');
    }

    if (startId === goalId) {
      return { path: [start], distance: 0 };
    }

    // Open set: locations to be evaluated
    const openSet = new Set([startId]);
    // Closed set: locations already evaluated
    const closedSet = new Set();

    // Map of locationId -> best previous location
    const cameFrom = new Map();

    // gScore: cost from start to location
    const gScore = new Map();
    gScore.set(startId, 0);

    // fScore: gScore + heuristic (estimated total cost)
    const fScore = new Map();
    fScore.set(startId, this.heuristic(start, goal));

    while (openSet.size > 0) {
      // Find location in openSet with lowest fScore
      let current = null;
      let lowestFScore = Infinity;
      for (const locationId of openSet) {
        const score = fScore.get(locationId) || Infinity;
        if (score < lowestFScore) {
          lowestFScore = score;
          current = locationId;
        }
      }

      if (current === goalId) {
        // Reconstruct path
        const pathIds = this.reconstructPath(cameFrom, goalId);
        const path = pathIds.map(id => this.locations.find(loc => loc.locationId === id));
        const distance = gScore.get(goalId);
        return { path, distance };
      }

      openSet.delete(current);
      closedSet.add(current);

      const neighbors = this.getNeighbors(current);
      for (const { location: neighbor, distance: edgeDistance } of neighbors) {
        if (closedSet.has(neighbor.locationId)) {
          continue;
        }

        const tentativeGScore = gScore.get(current) + edgeDistance;

        if (!openSet.has(neighbor.locationId)) {
          openSet.add(neighbor.locationId);
        } else if (tentativeGScore >= (gScore.get(neighbor.locationId) || Infinity)) {
          continue;
        }

        // This path is better
        cameFrom.set(neighbor.locationId, current);
        gScore.set(neighbor.locationId, tentativeGScore);
        fScore.set(neighbor.locationId, tentativeGScore + this.heuristic(neighbor, goal));
      }
    }

    // No path found
    return { path: [], distance: Infinity };
  }
}

module.exports = AStar;

