import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { throttle } from 'lodash';
import type { Position } from '../types';

interface LocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface WatchOptions {
  accuracy?: Location.Accuracy;
  timeInterval?: number;
  distanceInterval?: number;
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  mapWidth: number;
  mapHeight: number;
}

type LocationCallback = (location: LocationPosition) => void;

interface LocationSubscription {
  remove: () => void;
}

class LocationService {
  private currentLocation: Location.LocationObject | null = null;
  private watchId: LocationSubscription | null = null;
  private callbacks: Set<LocationCallback> = new Set();
  private isWatching: boolean = false;
  private lastKnownPosition: LocationPosition | null = null;
  private throttledUpdate: () => void;

  constructor() {
    // Throttle location updates to prevent excessive calls
    this.throttledUpdate = throttle(this.notifyCallbacks.bind(this), 1000);
  }

  // Request location permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown permission error';
      console.warn('Location permission error:', errorMessage);
      return false;
    }
  }

  // Get current location once
  async getCurrentLocation(highAccuracy: boolean = false): Promise<LocationPosition | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission required');
      }

      const options: Location.LocationOptions = {
        accuracy: highAccuracy 
          ? Location.Accuracy.BestForNavigation 
          : Location.Accuracy.Balanced,
        timeInterval: 15000, // 15 seconds
      };

      const location = await Location.getCurrentPositionAsync(options);
      this.currentLocation = location;
      this.lastKnownPosition = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp,
      };

      // Cache the location
      await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(this.lastKnownPosition));
      
      return this.lastKnownPosition;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown location error';
      console.warn('Get current location error:', errorMessage);
      // Try to get cached location
      return this.getCachedLocation();
    }
  }

  // Start watching location changes
  async startWatching(callback?: LocationCallback, options: WatchOptions = {}): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission required');
      }

      if (callback && typeof callback === 'function') {
        this.callbacks.add(callback);
      }

      if (this.isWatching) {
        return; // Already watching
      }

      const watchOptions: Location.LocationOptions = {
        accuracy: options.accuracy || Location.Accuracy.Balanced,
        timeInterval: options.timeInterval || 2000, // 2 seconds
        distanceInterval: options.distanceInterval || 2, // 2 meters
        ...options,
      };

      this.watchId = await Location.watchPositionAsync(
        watchOptions,
        (location: Location.LocationObject) => {
          this.currentLocation = location;
          this.lastKnownPosition = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            timestamp: location.timestamp,
          };
          
          this.throttledUpdate();
        }
      );

      this.isWatching = true;
      console.log('Started location watching');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown watch error';
      console.warn('Start watching location error:', errorMessage);
      throw error;
    }
  }

  // Stop watching location changes
  stopWatching(callback?: LocationCallback | null): void {
    if (callback) {
      this.callbacks.delete(callback);
    }

    if (this.callbacks.size === 0 && this.watchId) {
      this.watchId.remove();
      this.watchId = null;
      this.isWatching = false;
      console.log('Stopped location watching');
    }
  }

  // Notify all callbacks of location update
  private notifyCallbacks(): void {
    if (this.lastKnownPosition) {
      this.callbacks.forEach(callback => {
        try {
          callback(this.lastKnownPosition!);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown callback error';
          console.warn('Location callback error:', errorMessage);
        }
      });
    }
  }

  // Get cached location
  async getCachedLocation(): Promise<LocationPosition | null> {
    try {
      const cached = await AsyncStorage.getItem('lastKnownLocation');
      if (cached) {
        const location: LocationPosition = JSON.parse(cached);
        // Check if cached location is not too old (30 minutes)
        if (Date.now() - location.timestamp < 1800000) {
          return location;
        }
      }
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown cache error';
      console.warn('Get cached location error:', errorMessage);
      return null;
    }
  }

  // Convert GPS coordinates to local map coordinates
  gpsToMapCoordinates(
    latitude: number, 
    longitude: number, 
    mapBounds: MapBounds
  ): Position {
    // This is a simplified conversion - replace with your actual coordinate system
    const { north, south, east, west, mapWidth, mapHeight } = mapBounds;
    
    const x = ((longitude - west) / (east - west)) * mapWidth;
    const y = ((north - latitude) / (north - south)) * mapHeight;
    
    return { x, y };
  }

  // Calculate distance between two GPS points (Haversine formula)
  calculateGPSDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // Calculate bearing from one GPS point to another
  calculateGPSBearing(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    
    return (θ * 180/Math.PI + 360) % 360; // Bearing in degrees
  }

  // Get last known position
  getLastKnownPosition(): LocationPosition | null {
    return this.lastKnownPosition;
  }

  // Check if location services are available
  async isLocationAvailable(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown services error';
      console.warn('Location services check error:', errorMessage);
      return false;
    }
  }
}

// Export singleton instance
export default new LocationService();