import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { throttle } from 'lodash';
import EnhancedARPathOverlay from '../components/EnhancedARPathOverlay';
import FloorAROverlay from '../components/FloorAROverlay';
import { calculateBearing, calculateDistance, isNearWaypoint } from '../utils/navigationUtils';
import { useNavigation as useNavigationContext } from '../context/NavigationContext';
import hybridNavigationService, { type TrackingMode } from '../services/HybridNavigationService';
import type { ARNavigationScreenProps, DeviceOrientation, Position, Waypoint } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Tracking configuration
const RENDER_THROTTLE_INTERVAL = 50; // ms

interface TrackingInfo {
  mode: TrackingMode;
  accuracy: number;
}

const ARNavigationScreen: React.FC<ARNavigationScreenProps> = ({ navigation, route: navRoute }) => {
  const { path, currentLocation, destination } = navRoute.params || {};
  const { state, actions } = useNavigationContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [deviceOrientation, setDeviceOrientation] = useState<DeviceOrientation>({ x: 0, y: 0, z: 0 });
  const [heading, setHeading] = useState<number>(0);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(
    currentLocation ? { x: currentLocation.x, y: currentLocation.y } : null
  );
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo>({
    mode: 'arcore',
    accuracy: 0.5,
  });
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
    if (permission?.granted) {
      initializeHybridTracking();
    }
    return () => {
      // Cleanup hybrid tracking
      hybridNavigationService.stopTracking();
      actions.stopNavigation();
    };
  }, [permission]);

  const initializeHybridTracking = async () => {
    try {
      setIsInitializing(true);

      console.log('🔧 Initializing tracking with currentLocation:', currentLocation);

      // Initialize hybrid navigation (auto-detects best mode)
      const status = await hybridNavigationService.initialize();
      
      setTrackingInfo({
        mode: status.mode,
        accuracy: status.accuracy,
      });

      console.log(`✅ Tracking initialized: ${status.mode} (±${status.accuracy}m)`);

      // Calibrate with QR code GPS and map coordinates
      if (currentLocation?.latitude && currentLocation?.longitude) {
        console.log('📍 Calibrating with:', {
          lat: currentLocation.latitude,
          lon: currentLocation.longitude,
          x: currentLocation.x,
          y: currentLocation.y,
        });
        
        hybridNavigationService.calibratePosition(
          currentLocation.latitude,
          currentLocation.longitude,
          currentLocation.x,
          currentLocation.y
        );
        
        // Force set initial position
        setCurrentPosition({
          x: currentLocation.x,
          y: currentLocation.y,
        });
        console.log('✅ Initial position set:', { x: currentLocation.x, y: currentLocation.y });
      }

      // Start tracking
      await hybridNavigationService.startTracking((position: Position) => {
        console.log('📍 Position update received:', position);
        setCurrentPosition(position);
        
        // Also update navigation context
        actions.updatePosition(position);
        
        // Update heading (ARCore provides heading, otherwise use magnetometer)
        const newHeading = hybridNavigationService.getCurrentHeading();
        setHeading(newHeading);
        console.log('🧭 Heading updated:', newHeading);
      });

      // Initialize navigation context
      actions.setCurrentLocation(currentLocation || null);
      actions.setDestination(destination || null);
      actions.setPath(path || []);
      actions.startNavigation();

      // Debug: Show path info
      if (path && path.length > 0) {
        console.log('🗺️  Navigation Path:');
        path.forEach((waypoint, index) => {
          console.log(`  ${index}. Waypoint at (${waypoint.x}, ${waypoint.y})`);
        });
      }

      setIsInitializing(false);
      console.log('✅ Tracking fully initialized and started');
    } catch (error) {
      console.error('❌ Navigation initialization failed:', error);
      setIsInitializing(false);
      Alert.alert('Initialization Error', 'Failed to start navigation tracking');
    }
  };

  // Position updates are now handled by HybridNavigationService
  // No need for separate GPS initialization

  // Initialize current position from path
  useEffect(() => {
    if (path && path.length > 0 && !currentPosition) {
      setCurrentPosition({ x: path[0].x, y: path[0].y });
    }
  }, [path]);

  // Auto-advance waypoints when user gets close + Arrival detection
  useEffect(() => {
    if (!currentPosition || !path || path.length === 0) return;

    const nextWaypointIndex = currentStep + 1;
    if (nextWaypointIndex < path.length) {
      const nextWaypoint = path[nextWaypointIndex];
      const distance = calculateDistance(currentPosition, nextWaypoint);
      
      // Auto-advance if within 3 meters (intelligent threshold)
      if (distance <= 3) {
        setCurrentStep(nextWaypointIndex);
        setCurrentPosition({ x: nextWaypoint.x, y: nextWaypoint.y });
        console.log(`✅ Auto-advanced to waypoint ${nextWaypointIndex}, ${distance.toFixed(1)}m away`);
      }
    } else if (nextWaypointIndex === path.length) {
      // Check if reached final destination (within 5 meters)
      const finalDestination = path[path.length - 1];
      const distance = calculateDistance(currentPosition, finalDestination);
      
      console.log(`🎯 Distance to destination: ${distance.toFixed(1)}m`);
      
      if (distance <= 5) {
        Alert.alert(
          '🎉 Destination Reached!',
          `You have arrived at ${destination?.name || 'your destination'}.\n\nDistance: ${distance.toFixed(1)}m`,
          [
            {
              text: 'Navigate Again',
              onPress: () => navigation.navigate('Destination'),
            },
            {
              text: 'Go Home',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      }
    }
  }, [currentPosition, currentStep, path, destination, navigation]);

  // All sensor tracking is now handled by HybridNavigationService
  // No need for manual sensor setup

  const getNextWaypoint = (): Waypoint | null => {
    if (!path || path.length === 0) return null;
    if (currentStep >= path.length - 1) return null;
    return path[currentStep + 1];
  };

  const getCurrentWaypoint = (): Position | null => {
    // Use tracked current position instead of fixed waypoint
    if (currentPosition) return currentPosition;
    if (!path || path.length === 0) return null;
    return path[currentStep];
  };

  const handleNextStep = (): void => {
    // Manual step advance (still available but auto-advance is primary)
    if (path && currentStep < path.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (path[nextStep]) {
        setCurrentPosition({ x: path[nextStep].x, y: path[nextStep].y });
      }
    } else {
      Alert.alert(
        'Destination Reached!',
        `You have arrived at ${destination?.name || 'your destination'}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    }
  };

  const handleSwitchMode = async (): Promise<void> => {
    Alert.alert(
      'ARCore Only',
      'This app uses only ARCore for tracking. No fallback modes available for maximum accuracy.',
      [{ text: 'OK' }]
    );
  };

  const handleRecalibrate = (): void => {
    Alert.alert(
      'Recalibrate Position',
      'Scan a QR code to recalibrate your position',
      [
        {
          text: 'Scan QR Code',
          onPress: () => {
            navigation.navigate('QRScanner', {
              isRecalibration: true,
              returnTo: 'ARNavigation',
              returnParams: { path, currentLocation, destination },
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const nextWaypoint = getNextWaypoint();
  const pathProgress = path ? `${currentStep + 1}/${path.length}` : '0/0';

  // Memoized calculations for performance
  const memoizedPath = useMemo(() => path || [], [path]);
  const memoizedCurrentPosition = useMemo(() => currentPosition, [currentPosition]);

  // Display tracking mode (ARCore only)
  const trackingModeDisplay = '🎯 ARCore Tracking';

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to use the camera for AR navigation</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView style={styles.camera} />
      
      {/* AR Overlay - Absolutely positioned */}
      {memoizedCurrentPosition && (
        <View style={styles.arOverlay}>
          <FloorAROverlay
            path={memoizedPath}
            currentPosition={memoizedCurrentPosition}
            heading={heading}
            screenWidth={SCREEN_WIDTH}
            screenHeight={SCREEN_HEIGHT}
            currentStep={currentStep}
          />
        </View>
      )}

      {/* Top Info Panel */}
      <View style={styles.topPanel}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Progress: {pathProgress}</Text>
          <Text style={styles.infoText}>
            Heading: {Math.round(heading)}°
          </Text>
          <Text style={styles.infoText}>
            {trackingModeDisplay}
          </Text>
        </View>
      </View>

      {/* Bottom Control Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.calibrateButton]}
            onPress={handleRecalibrate}
          >
            <Text style={styles.controlButtonText}>Recalibrate</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, styles.nextButton]}
            onPress={handleNextStep}
          >
            <Text style={styles.controlButtonText}>Next Step</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, styles.infoButton]}
            onPress={handleSwitchMode}
          >
            <Text style={styles.controlButtonText}>
              Info
            </Text>
          </TouchableOpacity>
        </View>

        {nextWaypoint && (
          <View style={styles.waypointInfo}>
            <Text style={styles.waypointText}>
              Next: {Math.round(calculateDistance(
                memoizedCurrentPosition || { x: 0, y: 0 }, 
                nextWaypoint
              ))}m away
            </Text>
          </View>
        )}
      </View>

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  arOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none', // Allow touches to pass through to UI elements
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
    fontSize: 18,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    margin: 20,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
  topPanel: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 80,
    alignItems: 'center',
  },
  calibrateButton: {
    backgroundColor: 'rgba(255, 149, 0, 0.9)',
  },
  nextButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.9)',
  },
  infoButton: {
    backgroundColor: 'rgba(90, 200, 250, 0.9)',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  waypointInfo: {
    backgroundColor: 'rgba(44, 62, 80, 0.9)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  waypointText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ARNavigationScreen;