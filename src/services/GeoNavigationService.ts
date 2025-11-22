import * as Location from 'expo-location';
import { calculateGPSDistance, calculateGPSBearing } from '../utils/navigationUtils';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeoWaypoint {
  latitude: number;
  longitude: number;
  id?: string;
}

export interface NavigationState {
  currentLocation: GeoPosition;
  heading: number; // True north heading (0-360)
  nextWaypoint: GeoWaypoint | null;
  distanceToNext: number; // meters
  bearingToNext: number; // degrees
  relativeBearing: number; // degrees (bearing - heading)
  currentStepIndex: number;
  totalSteps: number;
  isArrived: boolean;
}

class GeoNavigationService {
  private path: GeoWaypoint[] = [];
  private currentStepIndex: number = 0;
  private locationSubscription: Location.LocationSubscription | null = null;
  private headingSubscription: Location.LocationSubscription | null = null;
  private updateCallback: ((state: NavigationState) => void) | null = null;
  
  private currentState: NavigationState = {
    currentLocation: { latitude: 0, longitude: 0 },
    heading: 0,
    nextWaypoint: null,
    distanceToNext: 0,
    bearingToNext: 0,
    relativeBearing: 0,
    currentStepIndex: 0,
    totalSteps: 0,
    isArrived: false,
  };

  /**
   * Initialize navigation with a path of GPS waypoints
   */
  startNavigation(path: GeoWaypoint[]) {
    this.path = path;
    this.currentStepIndex = 0; // Start at 0? Usually 0 is current location, 1 is next.
    // If path includes Start Location as index 0, we target index 1.
    // If path is just checkpoints to go to, we target index 0.
    // Usually A* returns [Start, Node1, Node2, ..., End].
    // So we target index 1.
    this.currentStepIndex = 1; 
    
    if (this.path.length < 2) {
        // Path too short (start -> end is same?)
        this.currentStepIndex = 0;
    }
    
    console.log(`🚀 GeoNavigation started. Path length: ${path.length}. Target: ${this.currentStepIndex}`);
  }

  /**
   * Start tracking GPS and Heading
   */
  async startTracking(callback: (state: NavigationState) => void) {
    this.updateCallback = callback;

    // Check permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    // Watch Position (GPS)
    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000, // Update every second
        distanceInterval: 1, // Update every meter
      },
      (location) => {
        this.handleLocationUpdate(location);
      }
    );

    // Watch Heading (Compass)
    this.headingSubscription = await Location.watchHeadingAsync((headingData) => {
      this.handleHeadingUpdate(headingData);
    });
  }

  stopTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    if (this.headingSubscription) {
      this.headingSubscription.remove();
      this.headingSubscription = null;
    }
  }

  private handleLocationUpdate(location: Location.LocationObject) {
    const { latitude, longitude, accuracy } = location.coords;
    
    this.currentState.currentLocation = { latitude, longitude, accuracy: accuracy || 0 };
    
    this.updateNavigationLogic();
  }

  private handleHeadingUpdate(headingData: any) {
    // Use trueHeading if available (needs location), else magHeading
    this.currentState.heading = headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
    
    this.updateNavigationLogic();
  }

  private updateNavigationLogic() {
    if (!this.path || this.path.length === 0) return;
    
    // Ensure valid index
    if (this.currentStepIndex >= this.path.length) {
        this.currentState.isArrived = true;
        this.notifyUpdate();
        return;
    }

    const current = this.currentState.currentLocation;
    const target = this.path[this.currentStepIndex];

    // Calculate Distance
    const distance = calculateGPSDistance(
        current.latitude, 
        current.longitude, 
        target.latitude, 
        target.longitude
    );
    
    // Calculate Bearing
    const bearing = calculateGPSBearing(
        current.latitude, 
        current.longitude, 
        target.latitude, 
        target.longitude
    );

    // Update State
    this.currentState.nextWaypoint = target;
    this.currentState.distanceToNext = distance;
    this.currentState.bearingToNext = bearing;
    this.currentState.totalSteps = this.path.length;
    this.currentState.currentStepIndex = this.currentStepIndex;

    // Calculate Relative Bearing for AR arrow
    // Arrow should point to (Bearing - Heading)
    let rel = bearing - this.currentState.heading;
    while (rel > 180) rel -= 360;
    while (rel < -180) rel += 360;
    this.currentState.relativeBearing = rel;

    // Auto-advance Waypoint logic
    // Use dynamic threshold based on GPS accuracy to avoid "dead zones"
    // If accuracy is 10m, we need threshold > 10m to reliably trigger
    const gpsAccuracy = current.accuracy || 5;
    const baseThreshold = 10; // Minimum meters
    
    // Threshold is max(base, accuracy + buffer)
    // e.g. Accuracy 20m -> Threshold 25m. 
    // Accuracy 3m -> Threshold 10m.
    const dynamicThreshold = Math.max(baseThreshold, gpsAccuracy + 5);
    
    // For final destination, be stricter to avoid premature arrival
    const isFinal = this.currentStepIndex === this.path.length - 1;
    const threshold = isFinal ? 5 : dynamicThreshold;

    console.log(`📍 Dist: ${distance.toFixed(1)}m | Thresh: ${threshold.toFixed(1)}m | Acc: ${gpsAccuracy.toFixed(0)}m`);

    if (distance < threshold) {
        if (isFinal) {
            // Only finish if REALLY close
            if (distance < 8) {
                this.currentState.isArrived = true;
                console.log("🎉 Arrived at destination!");
            }
        } else {
            this.currentStepIndex++;
            console.log(`✅ Reached waypoint ${this.currentStepIndex - 1}. advancing to ${this.currentStepIndex}`);
            
            // Immediately update logic for the NEW target to snap the arrow
            // This makes the arrow change direction "instantly" upon arrival
            this.updateNavigationLogic();
            return; 
        }
    }

    this.notifyUpdate();
  }

  /**
   * Manually advance to the next waypoint
   * Useful if GPS is stuck or user takes a shortcut
   */
  skipToNextWaypoint() {
    if (!this.path || this.path.length === 0) return;

    if (this.currentStepIndex < this.path.length - 1) {
      this.currentStepIndex++;
      console.log(`⏩ Manually advanced to waypoint ${this.currentStepIndex}`);
      // Immediately update logic for the NEW target
      this.updateNavigationLogic();
    } else {
      // If at the last waypoint, finish navigation
      this.currentState.isArrived = true;
      this.notifyUpdate();
    }
  }

  private notifyUpdate() {
    if (this.updateCallback) {
      this.updateCallback({ ...this.currentState });
    }
  }
}

export const geoNavigationService = new GeoNavigationService();
export default geoNavigationService;

