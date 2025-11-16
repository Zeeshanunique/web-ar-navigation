/**
 * Map Configuration
 * Defines the GPS bounds and coordinate system for the campus
 */

export interface MapBounds {
  /** Northern boundary (latitude) */
  north: number;
  /** Southern boundary (latitude) */
  south: number;
  /** Eastern boundary (longitude) */
  east: number;
  /** Western boundary (longitude) */
  west: number;
  /** Map width in meters */
  mapWidth: number;
  /** Map height in meters */
  mapHeight: number;
}

/**
 * Default campus map bounds
 * TODO: Update these values with your actual campus GPS coordinates
 * 
 * To find your campus bounds:
 * 1. Go to the northwest corner of your campus
 * 2. Note the GPS coordinates (north, west)
 * 3. Go to the southeast corner
 * 4. Note the GPS coordinates (south, east)
 * 5. Measure or estimate the width and height in meters
 */
export const DEFAULT_MAP_BOUNDS: MapBounds = {
  // Example coordinates - Replace with your actual campus coordinates
  north: 37.4225,    // Northernmost point latitude
  south: 37.4200,    // Southernmost point latitude
  east: -122.0830,   // Easternmost point longitude
  west: -122.0860,   // Westernmost point longitude
  mapWidth: 200,     // Campus width in meters (adjust based on your coordinate system)
  mapHeight: 200,    // Campus height in meters (adjust based on your coordinate system)
};

/**
 * Calculate map bounds from location data
 * Useful if you want to auto-calculate bounds from your locations
 */
export const calculateMapBoundsFromLocations = (
  locations: Array<{ latitude?: number; longitude?: number; x: number; y: number }>
): MapBounds | null => {
  const locationsWithGPS = locations.filter(
    loc => loc.latitude !== undefined && loc.longitude !== undefined
  );

  if (locationsWithGPS.length < 2) {
    return null;
  }

  const latitudes = locationsWithGPS.map(loc => loc.latitude!);
  const longitudes = locationsWithGPS.map(loc => loc.longitude!);
  const xCoords = locations.map(loc => loc.x);
  const yCoords = locations.map(loc => loc.y);

  return {
    north: Math.max(...latitudes),
    south: Math.min(...latitudes),
    east: Math.max(...longitudes),
    west: Math.min(...longitudes),
    mapWidth: Math.max(...xCoords) - Math.min(...xCoords),
    mapHeight: Math.max(...yCoords) - Math.min(...yCoords),
  };
};

/**
 * Map coordinate system configuration
 */
export const MAP_CONFIG = {
  /** Default map bounds */
  bounds: DEFAULT_MAP_BOUNDS,
  
  /** Minimum GPS accuracy required for reliable positioning (in meters) */
  minGPSAccuracy: 15,
  
  /** GPS update interval in milliseconds */
  gpsUpdateInterval: 2000,
  
  /** Distance threshold to trigger position update (in meters) */
  gpsDistanceThreshold: 2,
  
  /** Enable GPS tracking by default */
  enableGPSByDefault: false,
  
  /** Use high accuracy GPS mode */
  useHighAccuracyGPS: true,
} as const;

export default MAP_CONFIG;

