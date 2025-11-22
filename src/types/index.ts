// Type definitions for the AR Navigation app
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

export interface Location {
  id: string;
  name: string;
  x: number;
  y: number;
  latitude?: number;
  longitude?: number;
  floor?: number;
  building?: string;
  category?: string;
  icon?: string;
}

export interface Destination {
  id: string;
  name: string;
  icon: string;
  category: string;
  description?: string;
}

export interface Waypoint {
  x: number;
  y: number;
  latitude?: number;
  longitude?: number;
  instruction?: string;
  distance?: number;
}

export interface NavigationPath {
  path: Waypoint[];
  distance: number;
  steps: number;
  source: Location;
  destination: Location;
  totalDistance?: number;
  estimatedTime?: number;
  instructions?: string[];
}

export interface DeviceOrientation {
  x: number;
  y: number;
  z: number;
}

export interface Position {
  x: number;
  y: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  timestamp?: number;
}

// Navigation Stack Parameter Types
export type RootStackParamList = {
  Home: undefined;
  QRScanner: {
    isRecalibration?: boolean;
    returnTo?: keyof RootStackParamList;
    returnParams?: any;
  } | undefined;
  Destination: {
    currentLocation?: Location;
    locationId?: string;
  };
  ARNavigation: {
    path: Waypoint[];
    currentLocation: Location;
    destination: Destination;
    updatedLocation?: Location;
  };
  Calibration: {
    type?: 'magnetometer' | 'gps';
  };
};

// Screen Navigation Props
export type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
export type QRScannerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'QRScanner'>;
export type DestinationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Destination'>;
export type ARNavigationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ARNavigation'>;
export type CalibrationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Calibration'>;

// Screen Route Props
export type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;
export type QRScannerScreenRouteProp = RouteProp<RootStackParamList, 'QRScanner'>;
export type DestinationScreenRouteProp = RouteProp<RootStackParamList, 'Destination'>;
export type ARNavigationScreenRouteProp = RouteProp<RootStackParamList, 'ARNavigation'>;
export type CalibrationScreenRouteProp = RouteProp<RootStackParamList, 'Calibration'>;

// Screen Component Props
export interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
  route: HomeScreenRouteProp;
}

export interface QRScannerScreenProps {
  navigation: QRScannerScreenNavigationProp;
  route: QRScannerScreenRouteProp;
}

export interface DestinationScreenProps {
  navigation: DestinationScreenNavigationProp;
  route: DestinationScreenRouteProp;
}

export interface ARNavigationScreenProps {
  navigation: ARNavigationScreenNavigationProp;
  route: ARNavigationScreenRouteProp;
}

export interface CalibrationScreenProps {
  navigation: CalibrationScreenNavigationProp;
  route: CalibrationScreenRouteProp;
}

export interface SensorData {
  heading: number;
  magnetometer: DeviceOrientation;
  accelerometer: DeviceOrientation;
  timestamp: number;
}

export interface NavigationState {
  currentLocation: Location | null;
  destination: Location | null;
  path: Waypoint[];
  currentStep: number;
  isNavigating: boolean;
  isCalibrated: boolean;
}

export interface CalibrationType {
  type: 'magnetometer' | 'gps' | 'manual';
  accuracy: 'low' | 'medium' | 'high';
  lastCalibrated: number;
}

// Navigation utility types
export type NavigationMode = 'indoor' | 'outdoor' | 'hybrid';
export type ARMode = 'path' | 'arrow' | 'both';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: number;
}

export interface RouteRequest {
  from: string;
  to: string;
  mode?: NavigationMode;
}

export interface RouteResponse {
  path: Waypoint[];
  distance: number;
  duration: number;
  instructions: string[];
}