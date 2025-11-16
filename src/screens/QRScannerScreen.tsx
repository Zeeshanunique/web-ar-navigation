import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { getLocationById } from '../services/apiService';
import type { QRScannerScreenProps, Location } from '../types';

interface ParsedQRData {
  locationId?: string;
  id?: string;
}

const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ navigation, route }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const MAX_RETRY_COUNT = 3;
  const SCAN_COOLDOWN = 2000; // 2 seconds cooldown between scans

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const resumeScanning = (): void => {
    setIsScanning(true);
    setLoading(false);
  };

  const handleManualRetry = (): void => {
    if (retryCount < MAX_RETRY_COUNT) {
      setLastError(null);
      resumeScanning();
    }
  };

  const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult): Promise<void> => {
    if (isScanning && !loading) {
      setIsScanning(false);
      setLoading(true);
      await handleQRScan(data);
    }
  };

  const handleQRScan = async (qrData: string): Promise<void> => {
    try {
      setLastError(null);
      
      // Parse QR data (expected format: JSON with locationId)
      let locationId: string;
      
      try {
        const parsed: ParsedQRData = JSON.parse(qrData);
        locationId = parsed.locationId || parsed.id || qrData;
      } catch {
        locationId = qrData;
      }

      // Validate locationId
      if (!locationId || typeof locationId !== 'string' || locationId.trim() === '') {
        throw new Error('Invalid QR code format');
      }

      // Fetch location data from database (includes GPS coordinates)
      const location: Location = await Promise.race([
        getLocationById(locationId.trim()),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 8000)
        )
      ]);
      
      if (!location) {
        throw new Error(`Location '${locationId}' not found`);
      }

      // Validate location data
      if (typeof location.x !== 'number' || typeof location.y !== 'number') {
        throw new Error('Invalid location data received');
      }
      
      // Check if location has GPS coordinates (required for Google Maps navigation)
      if (!location.latitude || !location.longitude) {
        console.warn('⚠️  Location missing GPS coordinates - only indoor AR navigation will work');
      } else {
        console.log(`✅ Location loaded: ${location.name} at ${location.latitude}, ${location.longitude}`);
      }
      
      setLoading(false);
      setRetryCount(0); // Reset retry count on success
      
      // Check if this is a recalibration
      const isRecalibration = route.params?.isRecalibration;
      if (isRecalibration) {
        // Return to ARNavigation with updated location
        const returnTo = route.params?.returnTo || 'ARNavigation';
        const returnParams = route.params?.returnParams || {};
        
        if (returnTo === 'ARNavigation') {
          navigation.navigate('ARNavigation', {
            ...returnParams,
            updatedLocation: location,
          } as any);
        } else {
          navigation.navigate(returnTo, returnParams);
        }
      } else {
        // Normal flow: navigate to Destination selection
        navigation.navigate('Destination', {
          currentLocation: location,
          locationId: locationId.trim(),
        });
      }
    } catch (error) {
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastError(errorMessage);
      
      // Increment retry count
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      // Determine if we should allow retry
      const canRetry = newRetryCount < MAX_RETRY_COUNT;
      
      Alert.alert(
        'QR Code Error',
        `Failed to process QR code: ${errorMessage}${canRetry ? '\n\nPlease try scanning again.' : '\n\nToo many failed attempts. Please check your QR code or try again later.'}`,
        canRetry ? [
          { text: 'Retry', onPress: () => resumeScanning() },
          { text: 'Cancel', onPress: () => navigation.goBack() }
        ] : [
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]
      );
      
      if (canRetry) {
        // Add cooldown before allowing next scan
        scanTimeoutRef.current = setTimeout(() => {
          resumeScanning();
        }, SCAN_COOLDOWN);
      }
    }
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
            Camera permission is required to scan QR codes.
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

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={isScanning && !loading ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Processing QR code...</Text>
        </View>
      )}

      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.instructionText}>
          Position QR code within the frame
        </Text>
      </View>

      <SafeAreaView style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none', // Allow touches to pass through to camera
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4A90E2',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 30,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
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

export default QRScannerScreen;