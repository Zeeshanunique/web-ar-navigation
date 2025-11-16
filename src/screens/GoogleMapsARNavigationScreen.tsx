/**
 * Google Maps AR Navigation Screen
 * 
 * This screen combines:
 * 1. QR code scan to detect starting position (GPS coordinates)
 * 2. Google Maps API to calculate route
 * 3. AR overlay to display navigation arrows on camera
 * 4. Real-time GPS tracking along the route
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Magnetometer } from 'expo-sensors';
import googleMapsService, { type NavigationRoute, type LatLng } from '../services/GoogleMapsService';
import LocationService from '../services/LocationService';
import EnhancedARPathOverlay from '../components/EnhancedARPathOverlay';
import { smoothSensorValue } from '../utils/navigationUtils';
import { useNavigation as useNavigationContext } from '../context/NavigationContext';
import type { ARNavigationScreenProps, Position } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sensor configuration
const HEADING_SMOOTHING_ALPHA = 0.15;
const SENSOR_UPDATE_INTERVAL = 100;
const GPS_UPDATE_INTERVAL = 2000;
const ARRIVAL_THRESHOLD = 10; // meters

interface GPSWaypoint extends Position {
  isNextWaypoint?: boolean;
}

const GoogleMapsARNavigationScreen: React.FC<ARNavigationScreenProps> = ({ navigation, route: navRoute }) => {
  const { currentLocation, destination } = navRoute.params || {};
  const { state, actions } = useNavigationContext();
  
  // Camera and permissions
  const [permission, requestPermission] = useCameraPermissions();
  
  // Navigation state
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [googleRoute, setGoogleRoute] = useState<NavigationRoute | null>(null);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [heading, setHeading] = useState(0);
  
  // Route info
  const [distanceRemaining, setDistanceRemaining] = useState<number>(0);
  const [currentInstruction, setCurrentInstruction] = useState<string>('');
  const [hasArrived, setHasArrived] = useState(false);
  
  // Sensor refs
  const smoothedHeading = useRef(0);
  const isCalibrated = useRef(false);
  const magnetometerSubscription = useRef<any>(null);
  const gpsWatchId = useRef<any>(null);

  // Initialize: Get route from Google Maps
  useEffect(() => {
    initializeNavigation();
    return () => {
      cleanup();
    };
  }, []);

  const initializeNavigation = async () => {
    try {
      if (!currentLocation?.latitude || !currentLocation?.longitude) {
        throw new Error('Starting location GPS coordinates not available');
      }

      if (!destination?.id) {
        throw new Error('Destination not specified');
      }

      // Check if Google Maps is configured
      if (!googleMapsService.isConfigured()) {
        Alert.alert(
          'Configuration Required',
          'Google Maps API key not configured. Please add your API key in GoogleMapsService.ts',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      console.log('📍 Starting position:', currentLocation);
      console.log('🎯 Destination:', destination);

      // Get destination GPS coordinates from database
      const destLocation = await actions.setDestination(destination);
      
      if (!destLocation?.latitude || !destLocation?.longitude) {
        throw new Error('Destination GPS coordinates not available');
      }

      // Call Google Maps Directions API (always uses walking mode)
      setIsLoadingRoute(true);
      const route = await googleMapsService.getDirections(
        { lat: currentLocation.latitude, lng: currentLocation.longitude },
        { lat: destLocation.latitude, lng: destLocation.longitude }
      );

      console.log(`✅ Route loaded: ${route.totalDistance}m, ${route.waypoints.length} waypoints`);

      setGoogleRoute(route);
      setCurrentPosition({
        x: currentLocation.longitude,
        y: currentLocation.latitude,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });

      // Set up GPS tracking
      await startGPSTracking();

      // Set up magnetometer
      setupMagnetometer();

      // Start navigation
      actions.startNavigation();
      setIsLoadingRoute(false);

      // Set initial instruction
      if (route.steps.length > 0) {
        setCurrentInstruction(route.steps[0].instruction);
      }
    } catch (error) {
      console.error('❌ Navigation initialization error:', error);
      setIsLoadingRoute(false);
      Alert.alert(
        'Navigation Error',
        error instanceof Error ? error.message : 'Failed to initialize navigation',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const startGPSTracking = async () => {
    try {
      await LocationService.startWatching(
        (location) => {
          const newPosition: Position = {
            x: location.longitude,
            y: location.latitude,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: location.timestamp,
          };

          setCurrentPosition(newPosition);

          // Update waypoint progress
          if (googleRoute) {
            updateNavigationProgress(newPosition);
          }

          // Check if arrived
          if (destination?.latitude && destination?.longitude) {
            const arrived = googleMapsService.hasArrived(
              { lat: location.latitude, lng: location.longitude },
              { lat: destination.latitude, lng: destination.longitude },
              ARRIVAL_THRESHOLD
            );

            if (arrived && !hasArrived) {
              handleArrival();
            }
          }
        },
        {
          timeInterval: GPS_UPDATE_INTERVAL,
          distanceInterval: 2,
        }
      );
    } catch (error) {
      console.error('❌ GPS tracking error:', error);
    }
  };

  const setupMagnetometer = () => {
    Magnetometer.setUpdateInterval(SENSOR_UPDATE_INTERVAL);
    magnetometerSubscription.current = Magnetometer.addListener(({ x, y }) => {
      // Calculate heading from magnetometer
      let rawHeading = Math.atan2(y, x) * (180 / Math.PI);
      rawHeading = (rawHeading + 360) % 360;

      // Smooth the heading
      if (!isCalibrated.current) {
        smoothedHeading.current = rawHeading;
        isCalibrated.current = true;
      } else {
        let angleDiff = rawHeading - smoothedHeading.current;
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;

        smoothedHeading.current += angleDiff * HEADING_SMOOTHING_ALPHA;
        smoothedHeading.current = (smoothedHeading.current + 360) % 360;
      }

      setHeading(smoothedHeading.current);
    });
  };

  const updateNavigationProgress = (position: Position) => {
    if (!googleRoute) return;

    // Find closest waypoint on route
    const closestIndex = googleMapsService.findClosestWaypoint(
      { lat: position.latitude!, lng: position.longitude! },
      googleRoute.waypoints
    );

    if (closestIndex > currentWaypointIndex) {
      setCurrentWaypointIndex(closestIndex);

      // Update instruction
      const stepIndex = Math.floor(closestIndex / (googleRoute.waypoints.length / googleRoute.steps.length));
      if (stepIndex < googleRoute.steps.length) {
        setCurrentInstruction(googleRoute.steps[stepIndex].instruction);
      }
    }

    // Calculate remaining distance
    let remaining = 0;
    for (let i = closestIndex; i < googleRoute.waypoints.length - 1; i++) {
      const wp1 = googleRoute.waypoints[i];
      const wp2 = googleRoute.waypoints[i + 1];
      remaining += googleMapsService.calculateDistance(
        { lat: wp1.latitude!, lng: wp1.longitude! },
        { lat: wp2.latitude!, lng: wp2.longitude! }
      );
    }
    setDistanceRemaining(Math.round(remaining));
  };

  const handleArrival = () => {
    setHasArrived(true);
    Alert.alert(
      '🎉 Destination Reached!',
      `You have arrived at ${destination?.name}`,
      [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]
    );
  };

  const cleanup = () => {
    if (magnetometerSubscription.current) {
      magnetometerSubscription.current.remove();
    }
    LocationService.stopWatching();
    actions.stopNavigation();
  };

  const handleRecenter = () => {
    if (currentPosition && googleRoute) {
      const closestIndex = googleMapsService.findClosestWaypoint(
        { lat: currentPosition.latitude!, lng: currentPosition.longitude! },
        googleRoute.waypoints
      );
      setCurrentWaypointIndex(closestIndex);
      Alert.alert('Position Updated', 'Your position has been recentered on the route.');
    }
  };

  // Convert Google route waypoints to AR waypoints
  const arWaypoints = googleRoute?.waypoints
    .slice(currentWaypointIndex, currentWaypointIndex + 10) // Show next 10 waypoints
    .map((wp, index) => ({
      x: wp.longitude!,
      y: wp.latitude!,
      isNextWaypoint: index === 0,
    })) || [];

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
        <Text style={styles.message}>Camera permission required for AR navigation</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoadingRoute) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Calculating route with Google Maps...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView style={styles.camera} />

      {/* AR Overlay with Google Maps route */}
      {currentPosition && arWaypoints.length > 0 && (
        <View style={styles.arOverlay}>
          <EnhancedARPathOverlay
            path={arWaypoints}
            currentPosition={currentPosition}
            heading={heading}
            deviceOrientation={{ x: 0, y: 0, z: 0 }}
            screenWidth={SCREEN_WIDTH}
            screenHeight={SCREEN_HEIGHT}
            currentStep={0}
            showDistanceIndicators={true}
            showTurnInstructions={true}
            maxVisibleWaypoints={5}
          />
        </View>
      )}

      {/* Top Info Panel */}
      <View style={styles.topPanel}>
        <View style={styles.infoRow}>
          <Text style={styles.destinationText}>📍 {destination?.name}</Text>
          <Text style={styles.distanceText}>{distanceRemaining}m</Text>
        </View>
        {currentInstruction && (
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>{currentInstruction}</Text>
          </View>
        )}
      </View>

      {/* Bottom Control Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlButton} onPress={handleRecenter}>
            <Text style={styles.controlButtonText}>📍 Recenter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>✕ Exit</Text>
          </TouchableOpacity>
        </View>

        {currentPosition?.accuracy && (
          <View style={styles.gpsInfo}>
            <Text style={styles.gpsText}>
              GPS Accuracy: ±{Math.round(currentPosition.accuracy)}m
            </Text>
          </View>
        )}
      </View>

      {/* Powered by Google Maps badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Powered by Google Maps</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  arOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  message: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    minWidth: 200,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
  },
  topPanel: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 15,
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  destinationText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  distanceText: {
    color: '#00FF88',
    fontSize: 24,
    fontWeight: 'bold',
  },
  instructionContainer: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00FF88',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
  },
  backButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    flex: 1,
    marginLeft: 10,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  gpsInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  gpsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default GoogleMapsARNavigationScreen;

