import React, { useState, useEffect, useRef } from 'react';
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
import { Accelerometer } from 'expo-sensors';
import ARArrow from '../components/ARArrow';
import { calculateBearing } from '../utils/navigationUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ARNavigationScreen({ navigation, route: navRoute }) {
  const { path, currentLocation, destination } = navRoute.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [currentStep, setCurrentStep] = useState(0);
  const [deviceOrientation, setDeviceOrientation] = useState({ x: 0, y: 0, z: 0 });
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
    setupSensors();
    return () => {
      // Cleanup sensors if needed
    };
  }, [permission]);

  const setupSensors = () => {
    Accelerometer.setUpdateInterval(100);
    
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      setDeviceOrientation({ x, y, z });
      // Calculate heading from accelerometer (simplified)
      const newHeading = Math.atan2(y, x) * (180 / Math.PI);
      setHeading(newHeading);
    });

    return () => {
      subscription.remove();
    };
  };

  const getNextWaypoint = () => {
    if (!path || path.length === 0) return null;
    if (currentStep >= path.length - 1) return null;
    return path[currentStep + 1];
  };

  const getCurrentWaypoint = () => {
    if (!path || path.length === 0) return null;
    return path[currentStep];
  };

  const handleNextStep = () => {
    if (currentStep < path.length - 1) {
      setCurrentStep(currentStep + 1);
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

  const handleRecalibrate = () => {
    Alert.alert(
      'Recalibrate Position',
      'Scan a QR code to update your current position.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Scan QR',
          onPress: () => navigation.navigate('QRScanner'),
        },
      ]
    );
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.messageText}>Checking camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            Camera permission is required for AR navigation.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const nextWaypoint = getNextWaypoint();
  const currentWaypoint = getCurrentWaypoint();
  const bearing = nextWaypoint
    ? calculateBearing(currentWaypoint, nextWaypoint)
    : null;

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
      />

      {/* AR Overlay */}
      <View style={styles.overlay}>
        {nextWaypoint && bearing !== null && (
          <ARArrow
            bearing={bearing}
            heading={heading}
            screenWidth={SCREEN_WIDTH}
            screenHeight={SCREEN_HEIGHT}
          />
        )}

        {!nextWaypoint && (
          <View style={styles.destinationReached}>
            <Text style={styles.destinationText}>✓ Destination Reached!</Text>
          </View>
        )}
      </View>

      {/* Info Panel */}
      <SafeAreaView style={styles.infoPanel}>
        <View style={styles.infoCard}>
          <Text style={styles.destinationName}>
            → {destination?.name || 'Destination'}
          </Text>
          <Text style={styles.stepInfo}>
            Step {currentStep + 1} of {path?.length || 0}
          </Text>
          {nextWaypoint && (
            <Text style={styles.distanceInfo}>
              Next: ({nextWaypoint.x}, {nextWaypoint.y})
            </Text>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.nextButton]}
            onPress={handleNextStep}
          >
            <Text style={styles.actionButtonText}>Next Step</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.recalibrateButton]}
            onPress={handleRecalibrate}
          >
            <Text style={styles.actionButtonText}>Recalibrate</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Safety Warning */}
      <View style={styles.warningBanner}>
        <Text style={styles.warningText}>
          ⚠️ Be careful while walking with your phone
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationReached: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    padding: 20,
    borderRadius: 12,
  },
  destinationText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  destinationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  stepInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  distanceInfo: {
    fontSize: 12,
    color: '#999',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#4A90E2',
  },
  recalibrateButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  warningBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    padding: 10,
    alignItems: 'center',
  },
  warningText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

