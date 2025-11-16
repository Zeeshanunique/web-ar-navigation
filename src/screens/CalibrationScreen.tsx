import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Magnetometer } from 'expo-sensors';
import Svg, { Circle, Path } from 'react-native-svg';
import { useNavigation } from '../context/NavigationContext';
import LocationService from '../services/LocationService';
import type { CalibrationScreenProps, DeviceOrientation, Position } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPASS_SIZE = 200;

type CalibrationAccuracy = 'low' | 'medium' | 'high';
type CalibrationStepType = 0 | 1 | 2 | 3;

interface SensorSubscription {
  remove: () => void;
}

interface MagnetometerMeasurement {
  x: number;
  y: number;
  z: number;
}

const CalibrationScreen: React.FC<CalibrationScreenProps> = ({ navigation, route }) => {
  const { actions } = useNavigation();
  const [calibrationType] = useState<'magnetometer' | 'gps'>(route.params?.type || 'magnetometer');
  const [calibrationStep, setCalibrationStep] = useState<CalibrationStepType>(0);
  const [magnetometerData, setMagnetometerData] = useState<MagnetometerMeasurement>({ x: 0, y: 0, z: 0 });
  const [readings, setReadings] = useState<MagnetometerMeasurement[]>([]);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [gpsLocation, setGpsLocation] = useState<Position | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(0);
  
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const magnetometerSubscription = useRef<SensorSubscription | null>(null);

  useEffect(() => {
    if (calibrationType === 'magnetometer') {
      startMagnetometerCalibration();
    } else if (calibrationType === 'gps') {
      startGPSCalibration();
    }

    return () => {
      if (magnetometerSubscription.current) {
        magnetometerSubscription.current.remove();
      }
    };
  }, [calibrationType]);

  const startMagnetometerCalibration = async (): Promise<void> => {
    try {
      await Magnetometer.setUpdateInterval(100);
      magnetometerSubscription.current = Magnetometer.addListener((data: MagnetometerMeasurement) => {
        setMagnetometerData(data);
        
        if (isCalibrating) {
          setReadings(prev => [...prev, data]);
        }
      });

      // Start rotation animation
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

    } catch (error) {
      Alert.alert('Error', 'Failed to initialize magnetometer');
    }
  };

  const startGPSCalibration = async (): Promise<void> => {
    try {
      setIsCalibrating(true);
      
      // Start pulse animation for GPS
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      const location = await LocationService.getCurrentLocation(true);
      if (location) {
        const position: Position = {
          x: location.latitude,
          y: location.longitude,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
        };
        setGpsLocation(position);
        setGpsAccuracy(location.accuracy);
      }
      
      // Wait a bit for better accuracy
      setTimeout(() => {
        setIsCalibrating(false);
        if (location && location.accuracy < 5) {
          actions.setCalibration('gps', 'high');
          Alert.alert(
            'GPS Calibrated',
            `High accuracy achieved (${location.accuracy.toFixed(1)}m)`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          actions.setCalibration('gps', 'medium');
          Alert.alert(
            'GPS Calibrated',
            `Medium accuracy (${(location?.accuracy || 0).toFixed(1)}m)`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      }, 5000);
      
    } catch (error) {
      setIsCalibrating(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', 'Failed to calibrate GPS: ' + errorMessage);
    }
  };

  const performMagnetometerCalibration = (): void => {
    if (calibrationStep === 0) {
      // Start calibration
      setIsCalibrating(true);
      setReadings([]);
      setCalibrationStep(1);
      
      Alert.alert(
        'Calibration Started',
        'Slowly rotate your device in a figure-8 pattern for 10 seconds',
        [{ text: 'OK' }]
      );

      setTimeout(() => {
        setCalibrationStep(2);
        setTimeout(() => {
          finalizeMagnetometerCalibration();
        }, 3000);
      }, 10000);
    }
  };

  const finalizeMagnetometerCalibration = (): void => {
    setIsCalibrating(false);
    setCalibrationStep(3);

    // Analyze readings for quality
    if (readings.length > 50) {
      const accuracy = analyzeCalibrationQuality(readings);
      actions.setCalibration('magnetometer', accuracy);
      
      Alert.alert(
        'Calibration Complete',
        `Magnetometer calibrated with ${accuracy} accuracy`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert(
        'Calibration Failed',
        'Not enough data collected. Please try again.',
        [
          { text: 'Retry', onPress: () => setCalibrationStep(0) },
          { text: 'Cancel', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const analyzeCalibrationQuality = (readings: MagnetometerMeasurement[]): CalibrationAccuracy => {
    // Simple analysis - check for variation in readings
    const xValues = readings.map(r => r.x);
    const yValues = readings.map(r => r.y);
    const zValues = readings.map(r => r.z);
    
    const xRange = Math.max(...xValues) - Math.min(...xValues);
    const yRange = Math.max(...yValues) - Math.min(...yValues);
    const zRange = Math.max(...zValues) - Math.min(...zValues);
    
    const totalVariation = xRange + yRange + zRange;
    
    if (totalVariation > 100) return 'high';
    if (totalVariation > 50) return 'medium';
    return 'low';
  };

  const renderMagnetometerCalibration = (): React.JSX.Element => {
    const rotation = rotationAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.calibrationContainer}>
        <Text style={styles.title}>Magnetometer Calibration</Text>
        <Text style={styles.subtitle}>
          Calibrate your compass for accurate AR navigation
        </Text>

        <View style={styles.compassContainer}>
          <Svg width={COMPASS_SIZE} height={COMPASS_SIZE}>
            {/* Compass background */}
            <Circle
              cx={COMPASS_SIZE / 2}
              cy={COMPASS_SIZE / 2}
              r={COMPASS_SIZE / 2 - 10}
              fill="none"
              stroke="#E0E0E0"
              strokeWidth="2"
            />
            
            {/* North indicator */}
            <Animated.View
              style={[
                styles.compassNeedle,
                {
                  transform: [{ rotate: rotation }],
                },
              ]}
            >
              <Svg width={COMPASS_SIZE} height={COMPASS_SIZE}>
                <Path
                  d={`M${COMPASS_SIZE / 2} 20 L${COMPASS_SIZE / 2 - 8} 40 L${COMPASS_SIZE / 2 + 8} 40 Z`}
                  fill={isCalibrating ? '#FF6B6B' : '#4ECDC4'}
                />
              </Svg>
            </Animated.View>
          </Svg>
        </View>

        <View style={styles.readingContainer}>
          <Text style={styles.readingText}>
            X: {magnetometerData.x.toFixed(2)}
          </Text>
          <Text style={styles.readingText}>
            Y: {magnetometerData.y.toFixed(2)}
          </Text>
          <Text style={styles.readingText}>
            Z: {magnetometerData.z.toFixed(2)}
          </Text>
        </View>

        {calibrationStep === 0 && (
          <TouchableOpacity
            style={styles.calibrateButton}
            onPress={performMagnetometerCalibration}
          >
            <Text style={styles.buttonText}>Start Calibration</Text>
          </TouchableOpacity>
        )}

        {calibrationStep === 1 && (
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>
              📱 Rotate your device slowly in a figure-8 pattern
            </Text>
            <Text style={styles.readingCount}>
              Readings: {readings.length}
            </Text>
          </View>
        )}

        {calibrationStep === 2 && (
          <Text style={styles.instructionText}>
            ✅ Analyzing calibration data...
          </Text>
        )}
      </View>
    );
  };

  const renderGPSCalibration = (): React.JSX.Element => {
    return (
      <View style={styles.calibrationContainer}>
        <Text style={styles.title}>GPS Calibration</Text>
        <Text style={styles.subtitle}>
          Getting high-accuracy GPS location
        </Text>

        <Animated.View
          style={[
            styles.gpsContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.gpsCircle}>
            <Text style={styles.gpsIcon}>📍</Text>
          </View>
        </Animated.View>

        {gpsLocation && (
          <View style={styles.gpsInfoContainer}>
            <Text style={styles.gpsInfoText}>
              Latitude: {gpsLocation.latitude?.toFixed(6)}
            </Text>
            <Text style={styles.gpsInfoText}>
              Longitude: {gpsLocation.longitude?.toFixed(6)}
            </Text>
            <Text style={styles.gpsInfoText}>
              Accuracy: ±{gpsAccuracy.toFixed(1)}m
            </Text>
          </View>
        )}

        <Text style={styles.instructionText}>
          {isCalibrating 
            ? 'Acquiring GPS signal...' 
            : 'GPS calibration complete!'
          }
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {calibrationType === 'magnetometer' 
        ? renderMagnetometerCalibration() 
        : renderGPSCalibration()
      }
      
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  calibrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 40,
  },
  compassContainer: {
    marginBottom: 30,
  },
  compassNeedle: {
    position: 'absolute',
  },
  readingContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  readingText: {
    fontSize: 16,
    color: '#2C3E50',
    fontFamily: 'monospace',
  },
  calibrateButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  instructionContainer: {
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 18,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 10,
  },
  readingCount: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  gpsContainer: {
    marginBottom: 30,
  },
  gpsCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  gpsIcon: {
    fontSize: 50,
  },
  gpsInfoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gpsInfoText: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'monospace',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 10,
  },
  skipButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
  },
});

export default CalibrationScreen;