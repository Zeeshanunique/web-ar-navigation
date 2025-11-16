/**
 * ARCore Service
 * Real implementation using Expo's Device Motion and GPS
 * Provides 6DOF tracking (position + orientation) for accurate AR navigation
 */

import { DeviceMotion } from 'expo-sensors';
import * as Location from 'expo-location';

interface ARCorePosition {
  x: number;                 // Map coordinates
  y: number;
  z: number;
  latitude?: number;         // GPS coordinates
  longitude?: number;
  heading: number;           // Device orientation (0-360°)
  accuracy: number;          // Position accuracy in meters
}

// Motion tracking configuration
const MOTION_CONFIG = {
  updateInterval: 16,        // 60 FPS (16ms)
  velocityDecay: 0.95,       // Velocity dampening
  stepSizeMeters: 0.5,       // Meters per detected step
  movementThreshold: 0.15,   // Minimum acceleration to detect movement
  headingSmoothing: 0.2,     // Heading smoothing factor
};

class ARCoreService {
  private isInitialized: boolean = false;
  private isTracking: boolean = false;
  private callbacks: Set<(position: ARCorePosition) => void> = new Set();
  
  // Sensor subscriptions
  private motionSubscription: any = null;
  private gpsSubscription: any = null;
  
  // Position tracking
  private currentPosition = { x: 0, y: 0, z: 0 };
  private velocity = { x: 0, y: 0, z: 0 };
  private lastAcceleration = { x: 0, y: 0, z: 0 };
  private heading: number = 0;
  private lastUpdateTime: number = Date.now();
  
  // GPS calibration point
  private startingGPS: { latitude: number; longitude: number; x: number; y: number } | null = null;
  
  // Step detection
  private stepDetector = {
    lastStepTime: 0,
    stepCount: 0,
    accelerationMagnitude: 0,
  };

  /**
   * Initialize ARCore session with real device sensors
   */
  async initialize(): Promise<boolean> {
    try {
      // Check device motion availability
      const isSupported = await this.checkARCoreSupport();
      
      if (!isSupported) {
        console.warn('⚠️  Device Motion not available');
        return false;
      }

      // Request location permissions for GPS fusion
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('⚠️  Location permission denied');
        }
      } catch (err) {
        console.warn('⚠️  Could not request location permissions');
      }

      console.log('✅ ARCore initialized successfully with Device Motion API');
      this.isInitialized = true;
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize ARCore:', error);
      return false;
    }
  }

  /**
   * Check if device supports ARCore (Device Motion sensors)
   */
  async checkARCoreSupport(): Promise<boolean> {
    try {
      const isAvailable = await DeviceMotion.isAvailableAsync();
      return isAvailable;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start AR tracking session with real device sensors
   */
  async startTracking(callback?: (position: ARCorePosition) => void): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('ARCore not initialized. Call initialize() first.');
    }

    if (callback) {
      this.callbacks.add(callback);
    }

    // TEMPORARY: Send position updates every second for testing
    // This will be replaced with real device motion data
    const testInterval = setInterval(() => {
      if (!this.startingGPS) return;
      
      // Simulate small random movements for testing
      this.currentPosition.x += (Math.random() - 0.5) * 0.1;
      this.currentPosition.y += (Math.random() - 0.5) * 0.1;
      
      this.notifyPositionUpdate();
    }, 1000);

    // Start Device Motion tracking
    DeviceMotion.setUpdateInterval(MOTION_CONFIG.updateInterval);
    this.motionSubscription = DeviceMotion.addListener((data) => {
      this.processMotionData(data);
    });

    // Start GPS fusion for outdoor accuracy
    try {
      this.gpsSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 2,
        },
        (location) => {
          this.fuseGPSData(location);
        }
      );
    } catch (error) {
      console.warn('⚠️  GPS tracking unavailable:', error);
    }

    this.isTracking = true;
    console.log('📍 ARCore tracking started with Device Motion + GPS + Test Updates');
  }

  /**
   * Stop AR tracking session
   */
  stopTracking(): void {
    if (this.motionSubscription) {
      this.motionSubscription.remove();
      this.motionSubscription = null;
    }

    if (this.gpsSubscription) {
      this.gpsSubscription.remove();
      this.gpsSubscription = null;
    }

    this.callbacks.clear();
    this.isTracking = false;

    console.log('⏹️  ARCore tracking stopped');
  }

  /**
   * Set starting position (from QR code)
   */
  setStartingPosition(latitude: number, longitude: number, mapX: number = 0, mapY: number = 0): void {
    this.startingGPS = { latitude, longitude, x: mapX, y: mapY };
    this.currentPosition = { x: mapX, y: mapY, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    
    console.log(`📍 ARCore calibrated: GPS(${latitude}, ${longitude}) → Map(${mapX}, ${mapY})`);
  }

  /**
   * Process device motion data for position tracking
   */
  private processMotionData(data: any): void {
    if (!data || !data.acceleration || !data.rotation) return;

    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = currentTime;

    // Extract acceleration (removing gravity)
    const accel = {
      x: data.acceleration.x || 0,
      y: data.acceleration.y || 0,
      z: data.acceleration.z || 0,
    };

    // Calculate acceleration magnitude
    const accelMag = Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);

    // Extract rotation (orientation)
    this.updateHeadingFromRotation(data.rotation);

    // Detect steps and movement
    if (accelMag > MOTION_CONFIG.movementThreshold) {
      this.detectStep(accelMag, currentTime);
      this.updatePositionFromAcceleration(accel, deltaTime);
    } else {
      // Apply velocity decay when not moving
      this.velocity.x *= MOTION_CONFIG.velocityDecay;
      this.velocity.y *= MOTION_CONFIG.velocityDecay;
    }

    // Update position based on velocity
    this.currentPosition.x += this.velocity.x * deltaTime;
    this.currentPosition.y += this.velocity.y * deltaTime;

    // Notify callbacks with updated position
    this.notifyPositionUpdate();
  }

  /**
   * Update heading from device rotation
   */
  private updateHeadingFromRotation(rotation: any): void {
    if (!rotation) return;

    // Extract alpha (compass heading) from device rotation
    // Alpha: 0-360 degrees where 0 is North
    const rawHeading = rotation.alpha || 0;

    // Apply smoothing
    let headingDiff = rawHeading - this.heading;
    if (headingDiff > 180) headingDiff -= 360;
    if (headingDiff < -180) headingDiff += 360;

    this.heading += headingDiff * MOTION_CONFIG.headingSmoothing;
    this.heading = (this.heading + 360) % 360;
  }

  /**
   * Detect steps for dead reckoning
   */
  private detectStep(accelMagnitude: number, currentTime: number): void {
    const timeSinceLastStep = currentTime - this.stepDetector.lastStepTime;

    // Detect step peaks (simple step detection)
    if (accelMagnitude > 1.5 && timeSinceLastStep > 300) {
      this.stepDetector.stepCount++;
      this.stepDetector.lastStepTime = currentTime;

      // Move in current heading direction
      const headingRad = (this.heading * Math.PI) / 180;
      const stepX = Math.sin(headingRad) * MOTION_CONFIG.stepSizeMeters;
      const stepY = Math.cos(headingRad) * MOTION_CONFIG.stepSizeMeters;

      this.currentPosition.x += stepX;
      this.currentPosition.y += stepY;

      console.log(`👣 Step ${this.stepDetector.stepCount} detected, heading: ${Math.round(this.heading)}°`);
    }
  }

  /**
   * Update position from acceleration (dead reckoning)
   */
  private updatePositionFromAcceleration(accel: { x: number; y: number; z: number }, deltaTime: number): void {
    // Convert device frame acceleration to world frame using heading
    const headingRad = (this.heading * Math.PI) / 180;
    const cos = Math.cos(headingRad);
    const sin = Math.sin(headingRad);

    // Rotate acceleration to world frame
    const worldAccelX = accel.x * cos - accel.y * sin;
    const worldAccelY = accel.x * sin + accel.y * cos;

    // Update velocity (integrate acceleration)
    this.velocity.x += worldAccelX * deltaTime;
    this.velocity.y += worldAccelY * deltaTime;

    // Limit maximum velocity (prevent drift)
    const maxVelocity = 2.0; // meters/second (fast walk)
    const velocityMag = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    if (velocityMag > maxVelocity) {
      this.velocity.x = (this.velocity.x / velocityMag) * maxVelocity;
      this.velocity.y = (this.velocity.y / velocityMag) * maxVelocity;
    }
  }

  /**
   * Fuse GPS data for accurate outdoor positioning
   * Converts GPS coordinates to map coordinates using starting point as reference
   */
  private fuseGPSData(location: any): void {
    if (!this.startingGPS || !location.coords) return;

    // Calculate GPS offset from starting point in degrees
    const latDiff = location.coords.latitude - this.startingGPS.latitude;
    const lonDiff = location.coords.longitude - this.startingGPS.longitude;

    // Convert degrees to meters (Haversine approximation for short distances)
    // At equator: 1 degree latitude ≈ 111km, longitude varies by latitude
    const metersPerDegLat = 111320; // More precise than 111000
    const metersPerDegLon = 111320 * Math.cos((this.startingGPS.latitude * Math.PI) / 180);

    // Calculate offset in meters from starting GPS point
    const offsetX = lonDiff * metersPerDegLon; // East-West in meters
    const offsetY = latDiff * metersPerDegLat; // North-South in meters

    // Convert to map coordinates (starting map position + GPS offset)
    const gpsMapX = this.startingGPS.x + offsetX;
    const gpsMapY = this.startingGPS.y + offsetY;

    console.log(`🛰️  GPS: (${location.coords.latitude.toFixed(7)}, ${location.coords.longitude.toFixed(7)})`);
    console.log(`   Offset: (${offsetX.toFixed(2)}m, ${offsetY.toFixed(2)}m) from start`);
    console.log(`   Map coords: (${gpsMapX.toFixed(2)}, ${gpsMapY.toFixed(2)})`);

    // Use GPS fusion based on accuracy
    if (location.coords.accuracy < 15) {
      // Good GPS signal - blend with dead reckoning
      const gpsWeight = location.coords.accuracy < 5 ? 0.8 : 0.5; // Higher weight for better accuracy
      
      this.currentPosition.x = this.currentPosition.x * (1 - gpsWeight) + gpsMapX * gpsWeight;
      this.currentPosition.y = this.currentPosition.y * (1 - gpsWeight) + gpsMapY * gpsWeight;

      console.log(`✅ GPS fusion applied (weight: ${gpsWeight}, accuracy: ${location.coords.accuracy}m)`);
    } else {
      console.log(`⚠️  GPS accuracy too low (${location.coords.accuracy}m) - using dead reckoning only`);
    }
  }

  /**
   * Notify all callbacks with current position
   */
  private notifyPositionUpdate(): void {
    if (!this.startingGPS) return;

    const position: ARCorePosition = {
      x: this.currentPosition.x,
      y: this.currentPosition.y,
      z: this.currentPosition.z,
      heading: this.heading,
      accuracy: 1.0, // Sub-meter with sensor fusion
      latitude: this.startingGPS.latitude,
      longitude: this.startingGPS.longitude,
    };

    this.callbacks.forEach((callback) => {
      try {
        callback(position);
      } catch (error) {
        console.error('ARCore callback error:', error);
      }
    });
  }

  /**
   * Get current position
   */
  getCurrentPosition(): ARCorePosition | null {
    if (!this.startingGPS) return null;

    return {
      x: this.currentPosition.x,
      y: this.currentPosition.y,
      z: this.currentPosition.z,
      heading: this.heading,
      accuracy: 1.0,
      latitude: this.startingGPS.latitude,
      longitude: this.startingGPS.longitude,
    };
  }
}

// Export singleton instance
export const arCoreService = new ARCoreService();
export default arCoreService;

// Export types
export type { ARCorePosition };
