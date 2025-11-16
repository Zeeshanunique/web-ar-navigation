/**
 * Google Maps Service
 * Integrates Google Maps Directions API for route calculation
 * Routes are then displayed as AR overlays in the app
 */

import axios from 'axios';
import type { Position } from '../types';

// Google Maps API Configuration
const GOOGLE_MAPS_CONFIG = {
  // TODO: Add your Google Maps API key
  // Get it from: https://console.cloud.google.com/google/maps-apis
  apiKey: process.env.GOOGLE_MAPS_API_KEY,
  baseUrl: 'https://maps.googleapis.com/maps/api',
};

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteStep {
  distance: {
    text: string;      // "0.2 km"
    value: number;     // meters (200)
  };
  duration: {
    text: string;      // "3 mins"
    value: number;     // seconds (180)
  };
  startLocation: LatLng;
  endLocation: LatLng;
  instruction: string; // "Turn left onto Main Street"
  maneuver?: string;   // "turn-left", "turn-right", etc.
  polyline: {
    points: string;    // Encoded polyline
  };
}

export interface GoogleMapsRoute {
  legs: Array<{
    distance: {
      text: string;
      value: number;
    };
    duration: {
      text: string;
      value: number;
    };
    startLocation: LatLng;
    endLocation: LatLng;
    startAddress: string;
    endAddress: string;
    steps: RouteStep[];
  }>;
  overviewPolyline: {
    points: string;
  };
  summary: string;
  warnings: string[];
  waypointOrder: number[];
}

export interface NavigationRoute {
  waypoints: Position[];      // Array of GPS positions along route
  steps: RouteStep[];          // Turn-by-turn instructions
  totalDistance: number;       // Total distance in meters
  totalDuration: number;       // Total time in seconds
  bounds: {
    northeast: LatLng;
    southwest: LatLng;
  };
}

class GoogleMapsService {
  private apiKey: string;
  private lastRoute: NavigationRoute | null = null;

  constructor() {
    this.apiKey = GOOGLE_MAPS_CONFIG.apiKey;
  }

  /**
   * Get directions from origin to destination
   * Mode is always set to WALKING for campus navigation
   * @param origin - Starting GPS coordinates
   * @param destination - Ending GPS coordinates
   * @returns Navigation route with waypoints and instructions
   */
  async getDirections(
    origin: LatLng,
    destination: LatLng
  ): Promise<NavigationRoute> {
    const mode = 'walking'; // Always use walking mode for campus navigation
    try {
      // Validate API key
      if (!this.apiKey || this.apiKey === 'GOOGLE_MAPS_CONFIG.apiKey') {
        throw new Error('Google Maps API key not configured. Please add your API key in GoogleMapsService.ts');
      }

      // Build request URL
      const url = `${GOOGLE_MAPS_CONFIG.baseUrl}/directions/json`;
      const params = {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: mode,
        key: this.apiKey,
        alternatives: false,  // Get single best route
        units: 'metric',
      };

      console.log('🗺️  Requesting Google Maps directions...');
      const response = await axios.get(url, { params, timeout: 10000 });

      // Check for API errors
      if (response.data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
      }

      const route: GoogleMapsRoute = response.data.routes[0];
      
      if (!route) {
        throw new Error('No route found between origin and destination');
      }

      // Extract route information
      const leg = route.legs[0];
      const navigationRoute: NavigationRoute = {
        waypoints: this.decodePolyline(route.overviewPolyline.points),
        steps: leg.steps,
        totalDistance: leg.distance.value,
        totalDuration: leg.duration.value,
        bounds: {
          northeast: response.data.routes[0].bounds.northeast,
          southwest: response.data.routes[0].bounds.southwest,
        },
      };

      // Cache the route
      this.lastRoute = navigationRoute;

      console.log(`✅ Route calculated: ${leg.distance.text}, ${leg.duration.text}`);
      console.log(`📍 ${navigationRoute.waypoints.length} waypoints generated`);

      return navigationRoute;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout - please check your internet connection');
        }
        if (error.response) {
          throw new Error(`API error: ${error.response.status} - ${error.response.data?.error_message || 'Unknown error'}`);
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to get directions';
      console.error('❌ Google Maps error:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Decode Google Maps polyline format to array of coordinates
   * @param encoded - Encoded polyline string
   * @returns Array of GPS positions
   */
  private decodePolyline(encoded: string): Position[] {
    const points: Position[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b: number;
      let shift = 0;
      let result = 0;

      // Decode latitude
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      // Decode longitude
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        x: lng / 1e5,        // Will be used as longitude
        y: lat / 1e5,        // Will be used as latitude
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  }

  /**
   * Calculate distance between two GPS points (Haversine formula)
   * @param from - Starting GPS coordinates
   * @param to - Ending GPS coordinates
   * @returns Distance in meters
   */
  calculateDistance(from: LatLng, to: LatLng): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (from.lat * Math.PI) / 180;
    const φ2 = (to.lat * Math.PI) / 180;
    const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
    const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate bearing from one GPS point to another
   * @param from - Starting GPS coordinates
   * @param to - Ending GPS coordinates
   * @returns Bearing in degrees (0-360)
   */
  calculateBearing(from: LatLng, to: LatLng): number {
    const φ1 = (from.lat * Math.PI) / 180;
    const φ2 = (to.lat * Math.PI) / 180;
    const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
      Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);

    return ((θ * 180) / Math.PI + 360) % 360;
  }

  /**
   * Find the closest waypoint to current position
   * @param currentPosition - Current GPS position
   * @param waypoints - Array of route waypoints
   * @returns Index of closest waypoint
   */
  findClosestWaypoint(currentPosition: LatLng, waypoints: Position[]): number {
    let closestIndex = 0;
    let minDistance = Infinity;

    waypoints.forEach((waypoint, index) => {
      const distance = this.calculateDistance(currentPosition, {
        lat: waypoint.latitude || waypoint.y,
        lng: waypoint.longitude || waypoint.x,
      });

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  /**
   * Check if user has arrived at destination
   * @param currentPosition - Current GPS position
   * @param destination - Destination GPS coordinates
   * @param threshold - Distance threshold in meters (default: 10m)
   * @returns True if within threshold
   */
  hasArrived(
    currentPosition: LatLng,
    destination: LatLng,
    threshold: number = 10
  ): boolean {
    const distance = this.calculateDistance(currentPosition, destination);
    return distance <= threshold;
  }

  /**
   * Get the last calculated route
   * @returns Last navigation route or null
   */
  getLastRoute(): NavigationRoute | null {
    return this.lastRoute;
  }

  /**
   * Clear cached route
   */
  clearRoute(): void {
    this.lastRoute = null;
  }

  /**
   * Validate API key is configured
   * @returns True if API key is set
   */
  isConfigured(): boolean {
    return this.apiKey !== 'YOUR_API_KEY_HERE' && this.apiKey.length > 0;
  }
}

// Export singleton instance
const googleMapsService = new GoogleMapsService();
export default googleMapsService;

