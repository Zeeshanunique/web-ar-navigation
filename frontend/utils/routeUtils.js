import apiClient from './apiClient';

/**
 * Fetch route between two locations
 * @param {string} source - Source location ID
 * @param {string} destination - Destination location ID
 * @returns {Promise<Object>} - Route data with path and distance
 */
export const fetchRoute = async (source, destination) => {
  try {
    const response = await apiClient.post('/route', {
      source,
      destination,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching route:', error);
    throw error;
  }
};

/**
 * Get all available locations
 * @returns {Promise<Array>} - Array of locations
 */
export const getAllLocations = async () => {
  try {
    const response = await apiClient.get('/locations');
    return response.data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};

/**
 * Get location by QR code ID
 * @param {string} qrId - QR code ID
 * @returns {Promise<Object>} - Location data
 */
export const getLocationByQRId = async (qrId) => {
  try {
    const response = await apiClient.get(`/locations/qr/${qrId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching location by QR ID:', error);
    throw error;
  }
};

/**
 * Calculate distance between two points
 * @param {Object} point1 - { x, y, z }
 * @param {Object} point2 - { x, y, z }
 * @returns {number} - Distance
 */
export const calculateDistance = (point1, point2) => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const dz = (point2.z || 0) - (point1.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

/**
 * Calculate bearing (direction) between two points
 * @param {Object} point1 - { x, y }
 * @param {Object} point2 - { x, y }
 * @returns {number} - Bearing in degrees (0-360)
 */
export const calculateBearing = (point1, point2) => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (angle + 360) % 360;
};

