import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import type { HomeScreenProps } from '../types';
import DatabaseService from '../database/DatabaseService';

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleScanQR = (): void => {
    navigation.navigate('QRScanner');
  };

  const handleUseCurrentLocation = async (): Promise<void> => {
    try {
      setLoading(true);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use your current location.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Get current GPS position
      Alert.alert('Getting Location...', 'Please wait while we determine your position.');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      console.log('📍 Current GPS:', location.coords.latitude, location.coords.longitude);

      // Find nearest location from database
      const allLocations = await DatabaseService.getAllLocations();
      let nearestLocation = null;
      let minDistance = Infinity;

      for (const loc of allLocations) {
        if (!loc.latitude || !loc.longitude) continue;

        // Calculate distance using Haversine formula
        const R = 6371e3; // Earth radius in meters
        const φ1 = (location.coords.latitude * Math.PI) / 180;
        const φ2 = (loc.latitude * Math.PI) / 180;
        const Δφ = ((loc.latitude - location.coords.latitude) * Math.PI) / 180;
        const Δλ = ((loc.longitude - location.coords.longitude) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance < minDistance) {
          minDistance = distance;
          nearestLocation = loc;
        }
      }

      setLoading(false);

      if (!nearestLocation) {
        Alert.alert(
          'No Nearby Location',
          'Could not find any location near you. Please scan a QR code instead.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show nearest location
      Alert.alert(
        'Location Found',
        `Nearest location: ${nearestLocation.name}\nDistance: ${Math.round(minDistance)}m away\n\nUse this as your starting point?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Navigate',
            onPress: () => {
              // Navigate to destination screen with current location
              navigation.navigate('Destination', {
                currentLocation: nearestLocation,
              });
            },
          },
        ]
      );

    } catch (error) {
      setLoading(false);
      console.error('Error getting current location:', error);
      Alert.alert(
        'Error',
        'Could not get your current location. Please try again or scan a QR code.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleChooseDestination = (): void => {
    Alert.alert(
      'Select Destination',
      'Please scan a QR code or use your current location first.',
      [
        { text: 'Scan QR Code', onPress: handleScanQR },
        { text: 'Use Current Location', onPress: handleUseCurrentLocation },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>AR Navigation</Text>
        <Text style={styles.subtitle}>
          Navigate your campus with AR-powered directions
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleScanQR}
            disabled={loading}
          >
            <Text style={styles.buttonText}>📷 Scan QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.gpsButton]}
            onPress={handleUseCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>📍 Use Current Location</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleChooseDestination}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🎯 Choose Destination</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How to Start:</Text>
          <Text style={styles.infoText}>
            1️⃣ Scan QR code at your location (most accurate)
          </Text>
          <Text style={styles.infoText}>
            2️⃣ Or use GPS to find nearest location
          </Text>
          <Text style={styles.infoText}>
            3️⃣ Select your destination and follow AR arrows
          </Text>
          <Text style={[styles.infoText, styles.warningText]}>
            ⚠️ Be careful while walking with your phone
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
  },
  gpsButton: {
    backgroundColor: '#FF6B6B',
  },
  secondaryButton: {
    backgroundColor: '#50C878',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    width: '100%',
    maxWidth: 300,
  },
  infoTitle: {
    color: '#B8860B',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  warningText: {
    marginTop: 10,
    fontWeight: '600',
    color: '#D32F2F',
  },
});

export default HomeScreen;