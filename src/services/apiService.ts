import databaseService from '../database/DatabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Location, Destination, NavigationPath } from '../types';

// Initialize database service
let isInitialized = false;

const initializeDatabase = async (): Promise<void> => {
  if (!isInitialized) {
    // Clear cache on first initialization to ensure fresh data
    await AsyncStorage.removeItem('destinations');
    const locationKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = locationKeys.filter(key => key.startsWith('location_'));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
    
    await databaseService.initialize();
    isInitialized = true;
  }
};

interface CachedData<T> {
  data: T;
  timestamp: number;
}

// Cache utilities
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const setCachedData = async <T>(key: string, data: T): Promise<void> => {
  try {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cachedData));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
};

const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const { data, timestamp }: CachedData<T> = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION;
      if (!isExpired) {
        return data;
      }
    }
  } catch (error) {
    console.warn('Failed to retrieve cached data:', error);
  }
  return null;
};

// API functions using database service
export const getLocationById = async (locationId: string): Promise<Location | null> => {
  try {
    await initializeDatabase();
    
    // Try cache first
    const cacheKey = `location_${locationId}`;
    const cached = await getCachedData<Location>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get from database
    const location = await databaseService.getLocationById(locationId);
    
    if (location) {
      await setCachedData(cacheKey, location);
    }
    
    return location;
  } catch (error) {
    console.error('Error getting location by ID:', error);
    
    // Fallback data
    const fallbackLocations: Record<string, Location> = {
      parking_01: { id: 'parking_01', name: 'Parking Lot', x: 10, y: 5, floor: 1, category: 'Parking', icon: '🅿️' },
      library: { id: 'library', name: 'Library', x: 20, y: 15, floor: 1, category: 'Study', icon: '📚' },
      cafeteria: { id: 'cafeteria', name: 'Cafeteria', x: 30, y: 25, floor: 1, category: 'Food', icon: '🍽️' },
      classroom_a: { id: 'classroom_a', name: 'Classroom Block A', x: 5, y: 20, floor: 1, category: 'Academic', icon: '🏫' },
      lab: { id: 'lab', name: 'Laboratory', x: 35, y: 15, floor: 2, category: 'Technology', icon: '🔬' },
      auditorium: { id: 'auditorium', name: 'Auditorium', x: 25, y: 40, floor: 1, category: 'Events', icon: '🎭' },
      computer_lab: { id: 'computer_lab', name: 'Computer Lab', x: 40, y: 10, floor: 2, category: 'Technology', icon: '💻' },
      student_lounge: { id: 'student_lounge', name: 'Student Lounge', x: 15, y: 35, floor: 1, category: 'Social', icon: '🛋️' },
    };
    
    return fallbackLocations[locationId] || null;
  }
};

export const getDestinations = async (): Promise<Destination[]> => {
  try {
    await initializeDatabase();
    
    // Try cache first
    const cacheKey = 'destinations';
    const cached = await getCachedData<Destination[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get from database
    const destinations = await databaseService.getDestinations();
    
    if (destinations.length > 0) {
      await setCachedData(cacheKey, destinations);
    }
    
    return destinations;
  } catch (error) {
    console.error('Error getting destinations:', error);
    
    // Fallback data
    const fallbackDestinations: Destination[] = [
      { id: 'library', name: 'Library', icon: '📚', category: 'Study' },
      { id: 'cafeteria', name: 'Cafeteria', icon: '🍽️', category: 'Food' },
      { id: 'classroom_a', name: 'Classroom Block A', icon: '🏫', category: 'Academic' },
      { id: 'lab', name: 'Laboratory', icon: '🔬', category: 'Technology' },
      { id: 'auditorium', name: 'Auditorium', icon: '🎭', category: 'Events' },
      { id: 'computer_lab', name: 'Computer Lab', icon: '💻', category: 'Technology' },
      { id: 'student_lounge', name: 'Student Lounge', icon: '🛋️', category: 'Social' },
    ];
    
    return fallbackDestinations;
  }
};

export const calculateRoute = async (sourceId: string, destinationId: string): Promise<NavigationPath> => {
  try {
    await initializeDatabase();
    
    // Try cache first
    const cacheKey = `route_${sourceId}_${destinationId}`;
    const cached = await getCachedData<NavigationPath>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate route using database
    const route = await databaseService.calculateRoute(sourceId, destinationId);
    
    if (route) {
      await setCachedData(cacheKey, route);
    }
    
    return route;
  } catch (error) {
    console.error('Error calculating route:', error);
    
    // Fallback: simple straight-line path
    const source = await getLocationById(sourceId);
    const destination = await getLocationById(destinationId);
    
    if (source && destination) {
      const distance = Math.sqrt(
        Math.pow(destination.x - source.x, 2) +
        Math.pow(destination.y - source.y, 2)
      );
      
      return {
        path: [
          { x: source.x, y: source.y },
          { x: destination.x, y: destination.y },
        ],
        distance,
        steps: 2,
        source,
        destination,
        totalDistance: distance,
        estimatedTime: Math.ceil(distance / 1.4), // Assume 1.4 m/s walking speed
        instructions: ['Head towards destination', 'You have arrived'],
      };
    }
    
    throw new Error('Failed to calculate route');
  }
};

// Additional database operations
export const addLocation = async (location: Location & { connections?: string[]; isDestination?: boolean }): Promise<void> => {
  try {
    await initializeDatabase();
    await databaseService.addLocation(location);
    
    // Clear relevant caches
    await AsyncStorage.removeItem('destinations');
  } catch (error) {
    console.error('Error adding location:', error);
    throw error;
  }
};

export const getAllLocations = async (): Promise<Location[]> => {
  try {
    await initializeDatabase();
    return await databaseService.getAllLocations();
  } catch (error) {
    console.error('Error getting all locations:', error);
    return [];
  }
};

// Cleanup function
export const cleanup = async (): Promise<void> => {
  try {
    // Clear all cached data
    await AsyncStorage.clear();
    isInitialized = false;
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

export default {
  getLocationById,
  getDestinations,
  calculateRoute,
  addLocation,
  getAllLocations,
  cleanup,
};