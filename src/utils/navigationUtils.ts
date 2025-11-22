import { throttle, memoize } from 'lodash';

// Type definitions
interface Point {
  x: number;
  y: number;
}

interface Waypoint extends Point {
  id?: string;
}

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
}

interface PathInstruction {
  instruction: string;
  distance: number;
  waypoint?: Waypoint;
  stepIndex?: number;
}

// Memoized calculation functions for performance
const memoizedDistance = memoize(
  (x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },
  (x1: number, y1: number, x2: number, y2: number): string => `${x1},${y1},${x2},${y2}`
);

const memoizedBearing = memoize(
  (x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    let angle = Math.atan2(dy, dx);
    let bearing = (angle * 180) / Math.PI;
    return (bearing + 360) % 360;
  },
  (x1: number, y1: number, x2: number, y2: number): string => `${x1},${y1},${x2},${y2}`
);

/**
 * Calculate GPS distance between two coordinates (Haversine formula)
 * @returns Distance in meters
 */
export const calculateGPSDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calculate GPS bearing between two coordinates
 * @returns Bearing in degrees (0-360)
 */
export const calculateGPSBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  
  const θ = Math.atan2(y, x);
  const bearing = (θ * 180 / Math.PI + 360) % 360;
  
  return bearing;
};

/**
 * Calculate bearing (direction) from point A to point B
 * @param from - Starting point {x, y}
 * @param to - Destination point {x, y}
 * @returns Bearing in degrees (0-360)
 */
export const calculateBearing = (from: Point, to: Point): number => {
  if (!from || !to || typeof from.x !== 'number' || typeof to.x !== 'number') {
    return 0;
  }
  return memoizedBearing(from.x, from.y, to.x, to.y);
};

/**
 * Calculate distance between two points
 * @param point1 - First point {x, y}
 * @param point2 - Second point {x, y}
 * @returns Distance
 */
export const calculateDistance = (point1: Point, point2: Point): number => {
  if (!point1 || !point2 || 
      typeof point1.x !== 'number' || typeof point2.x !== 'number') {
    return 0;
  }
  return memoizedDistance(point1.x, point1.y, point2.x, point2.y);
};

/**
 * Normalize angle to -180 to 180 range
 * @param angle - Angle in degrees
 * @returns Normalized angle
 */
export const normalizeAngle = (angle: number): number => {
  let normalized = angle % 360;
  if (normalized > 180) {
    normalized -= 360;
  } else if (normalized < -180) {
    normalized += 360;
  }
  return normalized;
};

/**
 * Check if user is near a waypoint
 * @param currentPosition - Current position {x, y}
 * @param waypoint - Target waypoint {x, y}
 * @param threshold - Distance threshold (default: 3)
 * @returns True if within threshold
 */
export const isNearWaypoint = (currentPosition: Point, waypoint: Point, threshold: number = 3): boolean => {
  if (!currentPosition || !waypoint) return false;
  return calculateDistance(currentPosition, waypoint) <= threshold;
};

/**
 * Format distance for display
 * @param distance - Distance in map units
 * @returns Formatted distance string
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 100)}cm`;
  } else if (distance < 1000) {
    return `${Math.round(distance * 10) / 10}m`;
  } else {
    return `${Math.round(distance / 100) / 10}km`;
  }
};

/**
 * Generate turn instruction based on bearing change
 * @param currentBearing - Current direction
 * @param nextBearing - Next direction
 * @returns Turn instruction
 */
export const generateTurnInstruction = (currentBearing: number, nextBearing: number): string => {
  const angleDiff = normalizeAngle(nextBearing - currentBearing);
  const absAngle = Math.abs(angleDiff);
  
  if (absAngle < 15) {
    return 'Continue straight';
  } else if (absAngle < 45) {
    return angleDiff > 0 ? 'Slight right' : 'Slight left';
  } else if (absAngle < 135) {
    return angleDiff > 0 ? 'Turn right' : 'Turn left';
  } else {
    return 'Turn around';
  }
};

/**
 * Calculate path instructions for entire route
 * @param path - Array of waypoints
 * @returns Array of instruction objects
 */
export const generatePathInstructions = (path: Waypoint[]): PathInstruction[] => {
  if (!path || path.length < 2) {
    return [{ instruction: 'You have arrived', distance: 0 }];
  }
  
  const instructions: PathInstruction[] = [];
  
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];
    const distance = calculateDistance(current, next);
    
    let instruction = 'Continue straight';
    
    if (i > 0) {
      const previous = path[i - 1];
      const currentBearing = calculateBearing(previous, current);
      const nextBearing = calculateBearing(current, next);
      instruction = generateTurnInstruction(currentBearing, nextBearing);
    }
    
    instructions.push({
      instruction,
      distance,
      waypoint: next,
      stepIndex: i + 1,
    });
  }
  
  instructions.push({
    instruction: 'You have arrived at your destination',
    distance: 0,
    waypoint: path[path.length - 1],
    stepIndex: path.length,
  });
  
  return instructions;
};

/**
 * Throttled position update function
 * @param updateFunction - Function to call with new position
 * @param delay - Throttle delay in ms (default: 500)
 */
export const createThrottledPositionUpdate = (updateFunction: Function, delay: number = 500) => {
  return throttle(updateFunction, delay, { leading: true, trailing: true });
};

/**
 * Calculate estimated time to destination
 * @param distance - Total distance
 * @param walkingSpeed - Walking speed in units per second (default: 1.4 m/s)
 * @returns Estimated time in seconds
 */
export const estimateWalkingTime = (distance: number, walkingSpeed: number = 1.4): number => {
  return Math.ceil(distance / walkingSpeed);
};

/**
 * Format time for display
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  }
};

/**
 * Check if device is moving based on accelerometer data
 * @param currentAccel - Current accelerometer reading
 * @param lastAccel - Previous accelerometer reading
 * @param threshold - Movement threshold (default: 0.1)
 * @returns True if device is moving
 */
export const detectMovement = (
  currentAccel: AccelerometerData, 
  lastAccel: AccelerometerData, 
  threshold: number = 0.1
): boolean => {
  if (!currentAccel || !lastAccel) return false;
  
  const deltaX = Math.abs(currentAccel.x - lastAccel.x);
  const deltaY = Math.abs(currentAccel.y - lastAccel.y);
  const deltaZ = Math.abs(currentAccel.z - lastAccel.z);
  
  return (deltaX + deltaY + deltaZ) > threshold;
};

/**
 * Smooth sensor readings using exponential moving average
 * @param newValue - New sensor value
 * @param oldValue - Previous smoothed value
 * @param alpha - Smoothing factor (0-1, default: 0.1)
 * @returns Smoothed value
 */
export const smoothSensorValue = (newValue: number, oldValue: number, alpha: number = 0.1): number => {
  return alpha * newValue + (1 - alpha) * oldValue;
};

// Export types for use in other files
export type {
  Point,
  Waypoint,
  AccelerometerData,
  PathInstruction,
};