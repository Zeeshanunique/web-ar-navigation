/**
 * A* Pathfinding Algorithm Implementation
 * Finds the shortest path between two nodes in a graph
 */

// Type definitions
interface NodeData {
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
  distance: number;
}

interface Graph {
  nodes: Record<string, NodeData>;
  edges: GraphEdge[];
}

interface Location {
  id: string;
  x: number;
  y: number;
}

interface Connection {
  from: string;
  to: string;
}

interface PathPoint {
  x: number;
  y: number;
}

/**
 * Node class for A* algorithm
 */
class Node {
  id: string;
  x: number;
  y: number;
  g: number = 0; // Cost from start to this node
  h: number = 0; // Heuristic cost from this node to goal
  f: number = 0; // Total cost (g + h)
  parent: Node | null = null;

  constructor(id: string, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
  }

  getF(): number {
    return this.g + this.h;
  }
}

/**
 * Calculate heuristic (Euclidean distance)
 * @param nodeA - First node
 * @param nodeB - Second node
 * @returns Heuristic value
 */
const heuristic = (nodeA: Node, nodeB: Node): number => {
  const dx = nodeB.x - nodeA.x;
  const dy = nodeB.y - nodeA.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Reconstruct path from start to goal
 * @param node - Goal node
 * @returns Path array of {x, y} coordinates
 */
const reconstructPath = (node: Node): PathPoint[] => {
  const path: PathPoint[] = [];
  let current: Node | null = node;
  
  while (current) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }
  
  return path;
};

/**
 * A* pathfinding algorithm
 * @param graph - Graph object with nodes and edges
 * @param startId - Starting node ID
 * @param goalId - Goal node ID
 * @returns Path array or null if no path found
 */
export const aStar = (graph: Graph, startId: string, goalId: string): PathPoint[] | null => {
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
  const openSet: Node[] = [start];
  
  // Closed set: nodes already evaluated
  const closedSet = new Set<string>();

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
 * @param locations - Array of location objects
 * @param connections - Array of connection objects
 * @returns Graph object with nodes and edges
 */
export const createGraph = (locations: Location[], connections: Connection[]): Graph => {
  const nodes: Record<string, NodeData> = {};
  const edges: GraphEdge[] = [];

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

// Export types for use in other files
export type {
  NodeData,
  GraphEdge,
  Graph,
  Location,
  Connection,
  PathPoint,
};