import axios from 'axios';

// Update this to match your backend URL
// For physical devices, use your computer's IP address instead of localhost
// Find your IP: ifconfig (Mac/Linux) or ipconfig (Windows)
const API_BASE_URL = __DEV__
  ? 'http://192.168.168.182:3000/api'  // Replace with your computer's IP if different
  : 'https://your-backend-url.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fallback data for offline mode
const fallbackLocations = {
  parking_01: { id: 'parking_01', name: 'Parking Lot', x: 10, y: 5 },
  library: { id: 'library', name: 'Library', x: 16, y: 14 },
  cafeteria: { id: 'cafeteria', name: 'Cafeteria', x: 12, y: 10 },
  classroom_a: { id: 'classroom_a', name: 'Classroom Block A', x: 8, y: 12 },
  lab: { id: 'lab', name: 'Laboratory', x: 14, y: 8 },
  auditorium: { id: 'auditorium', name: 'Auditorium', x: 18, y: 6 },
};

const fallbackDestinations = [
  { id: 'library', name: 'Library', icon: '📚', category: 'Academic' },
  { id: 'cafeteria', name: 'Cafeteria', icon: '🍽️', category: 'Food' },
  { id: 'classroom_a', name: 'Classroom Block A', icon: '🏫', category: 'Academic' },
  { id: 'lab', name: 'Laboratory', icon: '🔬', category: 'Academic' },
  { id: 'auditorium', name: 'Auditorium', icon: '🎭', category: 'Events' },
  { id: 'parking_01', name: 'Parking Lot', icon: '🅿️', category: 'Parking' },
];

export const getLocationById = async (locationId) => {
  try {
    const response = await apiClient.get(`/location/${locationId}`);
    // Handle both response formats
    const data = response.data?.data || response.data;
    return data;
  } catch (error) {
    console.warn('API error, using fallback data:', error.message);
    // Return fallback data for offline mode
    return fallbackLocations[locationId] || null;
  }
};

export const getDestinations = async () => {
  try {
    const response = await apiClient.get('/location/destinations');
    // Handle both response formats
    const data = response.data?.data || response.data || [];
    return data;
  } catch (error) {
    console.warn('API error, using fallback data:', error.message);
    // Return fallback data for offline mode
    return fallbackDestinations;
  }
};

export const calculateRoute = async (sourceId, destinationId) => {
  try {
    const response = await apiClient.post('/route', {
      source: sourceId,
      destination: destinationId,
    });
    // Handle both response formats
    const data = response.data?.data || response.data;
    return data;
  } catch (error) {
    console.error('Route calculation error:', error.message);
    // Fallback: simple straight-line path
    const source = fallbackLocations[sourceId];
    const destination = fallbackLocations[destinationId];
    
    if (source && destination) {
      return {
        path: [
          { x: source.x, y: source.y },
          { x: destination.x, y: destination.y },
        ],
        distance: Math.sqrt(
          Math.pow(destination.x - source.x, 2) +
          Math.pow(destination.y - source.y, 2)
        ),
      };
    }
    
    throw new Error('Failed to calculate route');
  }
};

export default {
  getLocationById,
  getDestinations,
  calculateRoute,
};

