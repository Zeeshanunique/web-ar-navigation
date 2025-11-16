/**
 * ARCore Navigation Service
 * Uses ONLY Google ARCore for real AR tracking
 * No GPS/sensor fallbacks - pure ARCore implementation
 */

import arCoreService, { type ARCorePosition } from './ARCoreService';
import type { Position } from '../types';

type TrackingMode = 'arcore';

interface TrackingConfig {
  smoothingFactor: number;
}

interface TrackingStatus {
  mode: TrackingMode;
  accuracy: number;
  isTracking: boolean;
  arCoreAvailable: boolean;
}

class HybridNavigationService {
  private currentMode: TrackingMode = 'arcore';
  private isTracking: boolean = false;
  private callbacks: Set<(position: Position) => void> = new Set();
  
  // Config
  private config: TrackingConfig = {
    smoothingFactor: 0.15,
  };

  /**
   * Initialize ARCore navigation system
   */
  async initialize(): Promise<TrackingStatus> {
    console.log('🎯 Initializing ARCore Navigation System...');

    // Check ARCore availability
    const arCoreAvailable = await arCoreService.checkARCoreSupport();
    
    if (!arCoreAvailable) {
      throw new Error('❌ ARCore is not available on this device. This app requires ARCore support.');
    }

    console.log('✅ ARCore is available and ready');
    this.currentMode = 'arcore';

    return {
      mode: 'arcore',
      accuracy: 0.5, // Sub-meter accuracy
      isTracking: false,
      arCoreAvailable: true,
    };
  }

  /**
   * Start ARCore tracking
   */
  async startTracking(callback?: (position: Position) => void): Promise<void> {
    if (this.isTracking) {
      console.warn('⚠️  ARCore tracking already active');
      return;
    }

    if (callback) {
      this.callbacks.add(callback);
    }

    this.isTracking = true;
    await this.startARCoreTracking();

    console.log('✅ ARCore tracking started');
  }

  /**
   * Stop ARCore tracking
   */
  stopTracking(): void {
    if (!this.isTracking) return;

    arCoreService.stopTracking();
    this.isTracking = false;
    this.callbacks.clear();

    console.log('⏹️  ARCore tracking stopped');
  }

  /**
   * Calibrate ARCore with QR code GPS position and map coordinates
   */
  calibratePosition(latitude: number, longitude: number, mapX?: number, mapY?: number): void {
    console.log(`📍 Calibrating ARCore position: ${latitude}, ${longitude} → Map: (${mapX || 0}, ${mapY || 0})`);
    arCoreService.setStartingPosition(latitude, longitude, mapX || 0, mapY || 0);
  }

  /**
   * Get current tracking status
   */
  getStatus(): TrackingStatus {
    return {
      mode: 'arcore',
      accuracy: 0.5,
      isTracking: this.isTracking,
      arCoreAvailable: true,
    };
  }

  /**
   * Switch tracking mode - Not applicable (ARCore only)
   */
  async switchMode(mode: TrackingMode): Promise<void> {
    console.log('ℹ️  Only ARCore mode is available (no fallback modes)');
    // Do nothing - we only have ARCore
  }

  // Private methods

  private async startARCoreTracking(): Promise<void> {
    try {
      await arCoreService.initialize();
      await arCoreService.startTracking((arcorePosition: ARCorePosition) => {
        // Convert ARCore position to standard Position format
        const position: Position = {
          x: arcorePosition.x,
          y: arcorePosition.y,
          latitude: arcorePosition.latitude,
          longitude: arcorePosition.longitude,
          accuracy: arcorePosition.accuracy,
          timestamp: Date.now(),
        };

        this.notifyCallbacks(position);
      });
    } catch (error) {
      console.error('❌ ARCore tracking failed:', error);
      throw new Error('ARCore initialization failed. Please ensure ARCore is installed and your device supports it.');
    }
  }

  private notifyCallbacks(position: Position): void {
    this.callbacks.forEach(callback => {
      try {
        callback(position);
      } catch (error) {
        console.error('Callback error:', error);
      }
    });
  }

  /**
   * Get current mode (always ARCore)
   */
  getCurrentMode(): TrackingMode {
    return 'arcore';
  }

  /**
   * Get current heading from ARCore
   */
  getCurrentHeading(): number {
    const position = arCoreService.getCurrentPosition();
    return position?.heading || 0;
  }
}

// Export singleton instance
export const hybridNavigationService = new HybridNavigationService();
export default hybridNavigationService;

// Export types
export type { TrackingMode, TrackingConfig, TrackingStatus };

