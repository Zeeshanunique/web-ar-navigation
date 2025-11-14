/**
 * A* Pathfinding Algorithm Implementation
 * Finds the shortest path between two nodes in a graph
 */

/**
 * Node class for A* algorithm
 */
class Node {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.g = 0; // Cost from start to this node
    this.h = 0; // Heuristic cost from this node to goal
    this.f = 0; // Total cost (g + h)
    this.parent = null;
  }

  getF() {
    return this.g + this.h;
  }
}

/**
 * Calculate heuristic (Euclidean distance)
 * @param {Node} nodeA - First node
 * @param {Node} nodeB - Second node
 * @returns {number} Heuristic value
 */
const heuristic = (nodeA, nodeB) => {
  const dx = nodeB.x - nodeA.x;
  const dy = nodeB.y - nodeA.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Reconstruct path from start to goal
 * @param {Node} node - Goal node
 * @returns {Array} Path array of {x, y} coordinates
 */
const reconstructPath = (node) => {
  const path = [];
  let current = node;
  
  while (current) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }
  
  return path;
};

/**
 * A* pathfinding algorithm
 * @param {Object} graph - Graph object with nodes and edges
 * @param {string} startId - Starting node ID
 * @param {string} goalId - Goal node ID
 * @returns {Array|null} Path array or null if no path found
 */
export const aStar = (graph, startId, goalId) => {
  if (!graph || !graph.nodes || !graph.edges) {
    throw new Error('Invalid graph structure');
  }

  const nodes = graph.nodes;
  const edges = graph.edges;

  // Check if start and goal exist
  if (!nodes[startId] || !nodes[goalId]) {
    return null;
  }

  // Initialize start and goal nodes
  const start = new Node(startId, nodes[startId].x, nodes[startId].y);
  const goal = new Node(goalId, nodes[goalId].x, nodes[goalId].y);

  // Open set: nodes to be evaluated
  const openSet = [start];
  
  // Closed set: nodes already evaluated
  const closedSet = new Set();

  while (openSet.length > 0) {
    // Find node with lowest f score
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].getF() < openSet[currentIndex].getF()) {
        currentIndex = i;
      }
    }

    const current = openSet[currentIndex];

    // Check if we reached the goal
    if (current.id === goalId) {
      return reconstructPath(current);
    }

    // Move current from open to closed set
    openSet.splice(currentIndex, 1);
    closedSet.add(current.id);

    // Get neighbors of current node
    const neighbors = edges.filter(
      (edge) => edge.from === current.id || edge.to === current.id
    );

    for (const edge of neighbors) {
      const neighborId = edge.from === current.id ? edge.to : edge.from;
      
      // Skip if already evaluated
      if (closedSet.has(neighborId)) {
        continue;
      }

      // Get neighbor node data
      const neighborData = nodes[neighborId];
      if (!neighborData) {
        continue;
      }

      // Create neighbor node
      const neighbor = new Node(neighborId, neighborData.x, neighborData.y);
      neighbor.parent = current;

      // Calculate g score (cost from start to neighbor)
      const distance = heuristic(current, neighbor);
      neighbor.g = current.g + distance;

      // Calculate h score (heuristic from neighbor to goal)
      neighbor.h = heuristic(neighbor, goal);
      neighbor.f = neighbor.getF();

      // Check if neighbor is already in open set with better path
      const existingOpen = openSet.find((n) => n.id === neighborId);
      if (existingOpen && existingOpen.g <= neighbor.g) {
        continue;
      }

      // Add neighbor to open set
      openSet.push(neighbor);
    }
  }

  // No path found
  return null;
};

/**
 * Create a simple graph from location data
 * @param {Array} locations - Array of location objects
 * @param {Array} connections - Array of connection objects
 * @returns {Object} Graph object with nodes and edges
 */
export const createGraph = (locations, connections) => {
  const nodes = {};
  const edges = [];

  // Create nodes
  locations.forEach((location) => {
    nodes[location.id] = {
      x: location.x,
      y: location.y,
    };
  });

  // Create edges
  connections.forEach((connection) => {
    const from = locations.find((l) => l.id === connection.from);
    const to = locations.find((l) => l.id === connection.to);
    
    if (from && to) {
      const distance = Math.sqrt(
        Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
      );
      
      edges.push({
        from: connection.from,
        to: connection.to,
        distance: distance,
      });
    }
  });

  return { nodes, edges };
};

export default {
  aStar,
  createGraph,
};

