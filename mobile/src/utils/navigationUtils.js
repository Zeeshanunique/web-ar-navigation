/**
 * Calculate bearing (direction) from point A to point B
 * @param {Object} from - Starting point {x, y}
 * @param {Object} to - Destination point {x, y}
 * @returns {number} Bearing in degrees (0-360)
 */
export const calculateBearing = (from, to) => {
  if (!from || !to) return 0;
  
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // Calculate angle in radians
  let angle = Math.atan2(dy, dx);
  
  // Convert to degrees and normalize to 0-360
  let bearing = (angle * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  
  return bearing;
};

/**
 * Calculate distance between two points
 * @param {Object} point1 - First point {x, y}
 * @param {Object} point2 - Second point {x, y}
 * @returns {number} Distance
 */
export const calculateDistance = (point1, point2) => {
  if (!point1 || !point2) return 0;
  
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Normalize angle to -180 to 180 range
 * @param {number} angle - Angle in degrees
 * @returns {number} Normalized angle
 */
export const normalizeAngle = (angle) => {
  let normalized = angle % 360;
  if (normalized > 180) {
    normalized -= 360;
  } else if (normalized < -180) {
    normalized += 360;
  }
  return normalized;
};

/**
 * Check if user is close to a waypoint
 * @param {Object} currentPosition - Current position {x, y}
 * @param {Object} waypoint - Target waypoint {x, y}
 * @param {number} threshold - Distance threshold (default: 2)
 * @returns {boolean} True if within threshold
 */
export const isNearWaypoint = (currentPosition, waypoint, threshold = 2) => {
  const distance = calculateDistance(currentPosition, waypoint);
  return distance <= threshold;
};

