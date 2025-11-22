import React, { useState, useEffect, useMemo } from 'react';
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
import { DeviceMotion } from 'expo-sensors';
import FloorAROverlay from '../components/FloorAROverlay';
import geoNavigationService, { NavigationState, GeoWaypoint } from '../services/GeoNavigationService';
import type { ARNavigationScreenProps } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ARNavigationScreen: React.FC<ARNavigationScreenProps> = ({ navigation, route }) => {
  const { path, currentLocation, destination } = route.params || {};
  
  const [permission, requestPermission] = useCameraPermissions();
  const [devicePitch, setDevicePitch] = useState<number>(0);
  const [navState, setNavState] = useState<NavigationState | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // 1. Initialize Navigation Service
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
    
    // Request motion permissions for iOS
    const requestMotionPermission = async () => {
      try {
        const { status } = await DeviceMotion.getPermissionsAsync();
        if (status !== 'granted') {
          await DeviceMotion.requestPermissionsAsync();
        }
      } catch (e) {
        // Ignore if not required
      }
    };
    requestMotionPermission();

    if (permission?.granted && path) {
      startNavigation();
    }

    return () => {
      geoNavigationService.stopTracking();
    };
  }, [permission]);

  // 2. Track Device Pitch (Local UI only)
  useEffect(() => {
    DeviceMotion.setUpdateInterval(50);
    const subscription = DeviceMotion.addListener((data) => {
      if (data.rotation) {
        // Beta is front-to-back tilt in radians
        const pitchDegrees = (data.rotation.beta * 180) / Math.PI;
        setDevicePitch(pitchDegrees);
      }
    });
    return () => subscription.remove();
  }, []);

  const startNavigation = async () => {
    try {
      setIsInitializing(true);
      
      // Convert path to GeoWaypoints
      const geoPath: GeoWaypoint[] = path.map(p => ({
        latitude: p.latitude || 0, // Fallback 0 if missing (should verify)
        longitude: p.longitude || 0,
      })).filter(p => p.latitude !== 0 && p.longitude !== 0);

      if (geoPath.length < 2) {
        Alert.alert('Error', 'Route missing GPS coordinates');
        navigation.goBack();
        return;
      }

      geoNavigationService.startNavigation(geoPath);
      
      await geoNavigationService.startTracking((state) => {
        setNavState(state);
        
        if (state.isArrived) {
           handleArrival();
        }
      });

      setIsInitializing(false);
    } catch (error) {
      console.error("Failed to start navigation:", error);
      Alert.alert('Error', 'Could not start GPS navigation');
      setIsInitializing(false);
    }
  };

  const handleArrival = () => {
    geoNavigationService.stopTracking();
    Alert.alert(
      '🎉 Destination Reached!',
      `You have arrived at ${destination?.name || 'your destination'}.`,
      [
        {
          text: 'Go Home',
          onPress: () => navigation.navigate('Home'),
        },
      ]
    );
  };

  if (!permission || !permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView style={styles.camera} />
      
      {/* AR Overlay */}
      {navState && !isInitializing && (
        <View style={styles.arOverlay}>
          <FloorAROverlay
            distanceToNext={navState.distanceToNext}
            relativeBearing={navState.relativeBearing}
            targetBearing={navState.bearingToNext}
            screenWidth={SCREEN_WIDTH}
            screenHeight={SCREEN_HEIGHT}
            devicePitch={devicePitch}
          />
        </View>
      )}

      {/* Top Info Panel */}
      <View style={styles.topPanel}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Step: {navState ? navState.currentStepIndex : 0} / {navState ? navState.totalSteps : 0}
          </Text>
          <Text style={styles.infoText}>
            GPS Accuracy: {navState?.currentLocation.accuracy?.toFixed(0)}m
          </Text>
          <Text style={styles.infoText}>
            Compass: {Math.round(navState?.heading || 0)}°
          </Text>
        </View>
      </View>

      {/* Close/Stop Button (Top Left) */}
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeButtonText}>✕ Stop</Text>
      </TouchableOpacity>

      {/* Manual Next Step Button (Top Right) */}
      <TouchableOpacity 
        style={styles.nextButton}
        onPress={() => geoNavigationService.skipToNextWaypoint()}
      >
        <Text style={styles.nextButtonText}>Next ➔</Text>
      </TouchableOpacity>
      
      {isInitializing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00FF88" />
          <Text style={styles.loadingText}>Acquiring GPS...</Text>
        </View>
      )}
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
    pointerEvents: 'none',
  },
  message: {
    color: 'white',
    textAlign: 'center',
    marginTop: 100,
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
  },
  topPanel: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10, // Ensure it's above other elements
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nextButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(52, 199, 89, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00FF88',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ARNavigationScreen;
