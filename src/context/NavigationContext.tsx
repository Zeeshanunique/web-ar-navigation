import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import LocationService from '../services/LocationService';
import { MAP_CONFIG } from '../config/mapConfig';
import type { Location, Destination, Waypoint, Position } from '../types';

// Navigation actions
const NAVIGATION_ACTIONS = {
  SET_CURRENT_LOCATION: 'SET_CURRENT_LOCATION',
  SET_DESTINATION: 'SET_DESTINATION',
  SET_PATH: 'SET_PATH',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  START_NAVIGATION: 'START_NAVIGATION',
  STOP_NAVIGATION: 'STOP_NAVIGATION',
  UPDATE_POSITION: 'UPDATE_POSITION',
  SET_CALIBRATION: 'SET_CALIBRATION',
  SET_NAVIGATION_MODE: 'SET_NAVIGATION_MODE',
  SET_AR_MODE: 'SET_AR_MODE',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
} as const;

type NavigationActionType = keyof typeof NAVIGATION_ACTIONS;

// Types
type NavigationMode = 'indoor' | 'outdoor' | 'hybrid';
type ARMode = 'path' | 'arrow' | 'both';
type CalibrationAccuracy = 'low' | 'medium' | 'high';
type CalibrationType = 'magnetometer' | 'gps';

interface CalibrationState {
  accuracy: CalibrationAccuracy;
  lastCalibrated: number;
}

interface NavigationSettings {
  autoAdvance: boolean;
  waypointDistance: number;
  useGPS: boolean;
  highAccuracyGPS: boolean;
}

interface NavigationState {
  currentLocation: Location | null;
  destination: Destination | null;
  path: Waypoint[];
  currentStep: number;
  currentPosition: Position | null;
  isNavigating: boolean;
  navigationMode: NavigationMode;
  arMode: ARMode;
  calibration: {
    magnetometer: CalibrationState;
    gps: CalibrationState;
  };
  isCalibrated: boolean;
  error: string | null;
  settings: NavigationSettings;
}

// Action types
interface SetCurrentLocationAction {
  type: typeof NAVIGATION_ACTIONS.SET_CURRENT_LOCATION;
  payload: Location | null;
}

interface SetDestinationAction {
  type: typeof NAVIGATION_ACTIONS.SET_DESTINATION;
  payload: Destination | null;
}

interface SetPathAction {
  type: typeof NAVIGATION_ACTIONS.SET_PATH;
  payload: { path: Waypoint[] };
}

interface SetCurrentStepAction {
  type: typeof NAVIGATION_ACTIONS.SET_CURRENT_STEP;
  payload: number;
}

interface StartNavigationAction {
  type: typeof NAVIGATION_ACTIONS.START_NAVIGATION;
}

interface StopNavigationAction {
  type: typeof NAVIGATION_ACTIONS.STOP_NAVIGATION;
}

interface UpdatePositionAction {
  type: typeof NAVIGATION_ACTIONS.UPDATE_POSITION;
  payload: Position;
}

interface SetCalibrationAction {
  type: typeof NAVIGATION_ACTIONS.SET_CALIBRATION;
  payload: { type: CalibrationType; accuracy: CalibrationAccuracy };
}

interface SetNavigationModeAction {
  type: typeof NAVIGATION_ACTIONS.SET_NAVIGATION_MODE;
  payload: NavigationMode;
}

interface SetARModeAction {
  type: typeof NAVIGATION_ACTIONS.SET_AR_MODE;
  payload: ARMode;
}

interface SetErrorAction {
  type: typeof NAVIGATION_ACTIONS.SET_ERROR;
  payload: string;
}

interface ClearErrorAction {
  type: typeof NAVIGATION_ACTIONS.CLEAR_ERROR;
}

type NavigationAction =
  | SetCurrentLocationAction
  | SetDestinationAction
  | SetPathAction
  | SetCurrentStepAction
  | StartNavigationAction
  | StopNavigationAction
  | UpdatePositionAction
  | SetCalibrationAction
  | SetNavigationModeAction
  | SetARModeAction
  | SetErrorAction
  | ClearErrorAction;

// Initial state
const initialState: NavigationState = {
  currentLocation: null,
  destination: null,
  path: [],
  currentStep: 0,
  currentPosition: null,
  isNavigating: false,
  navigationMode: 'indoor',
  arMode: 'both',
  calibration: {
    magnetometer: { accuracy: 'low', lastCalibrated: 0 },
    gps: { accuracy: 'low', lastCalibrated: 0 },
  },
  isCalibrated: false,
  error: null,
  settings: {
    autoAdvance: true,
    waypointDistance: 3,
    useGPS: true,
    highAccuracyGPS: false,
  },
};

// Reducer function
function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case NAVIGATION_ACTIONS.SET_CURRENT_LOCATION:
      return {
        ...state,
        currentLocation: action.payload,
        currentPosition: action.payload ? 
          { x: action.payload.x, y: action.payload.y } : null,
      };

    case NAVIGATION_ACTIONS.SET_DESTINATION:
      return {
        ...state,
        destination: action.payload,
      };

    case NAVIGATION_ACTIONS.SET_PATH:
      return {
        ...state,
        path: action.payload.path || [],
        currentStep: 0,
        // Reset position to start of path if available
        currentPosition: action.payload.path && action.payload.path.length > 0 
          ? { x: action.payload.path[0].x, y: action.payload.path[0].y }
          : state.currentPosition,
      };

    case NAVIGATION_ACTIONS.SET_CURRENT_STEP:
      return {
        ...state,
        currentStep: action.payload,
        // Update position to current waypoint
        currentPosition: state.path[action.payload] 
          ? { x: state.path[action.payload].x, y: state.path[action.payload].y }
          : state.currentPosition,
      };

    case NAVIGATION_ACTIONS.START_NAVIGATION:
      return {
        ...state,
        isNavigating: true,
        currentStep: 0,
        error: null,
      };

    case NAVIGATION_ACTIONS.STOP_NAVIGATION:
      return {
        ...state,
        isNavigating: false,
        currentStep: 0,
        path: [],
      };

    case NAVIGATION_ACTIONS.UPDATE_POSITION:
      return {
        ...state,
        currentPosition: action.payload,
      };

    case NAVIGATION_ACTIONS.SET_CALIBRATION:
      return {
        ...state,
        calibration: {
          ...state.calibration,
          [action.payload.type]: {
            accuracy: action.payload.accuracy,
            lastCalibrated: Date.now(),
          },
        },
        isCalibrated: action.payload.accuracy === 'high',
      };

    case NAVIGATION_ACTIONS.SET_NAVIGATION_MODE:
      return {
        ...state,
        navigationMode: action.payload,
      };

    case NAVIGATION_ACTIONS.SET_AR_MODE:
      return {
        ...state,
        arMode: action.payload,
      };

    case NAVIGATION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case NAVIGATION_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Navigation actions interface
interface NavigationActions {
  setCurrentLocation: (location: Location | null) => void;
  setDestination: (destination: Destination | null) => void;
  setPath: (path: Waypoint[]) => void;
  setCurrentStep: (step: number) => void;
  startNavigation: () => void;
  stopNavigation: () => void;
  updatePosition: (position: Position) => void;
  setCalibration: (type: CalibrationType, accuracy: CalibrationAccuracy) => void;
  setNavigationMode: (mode: NavigationMode) => void;
  setArMode: (mode: ARMode) => void;
  setError: (error: string) => void;
  clearError: () => void;
  startGPSTracking: () => Promise<void>;
}

// Context type
interface NavigationContextType {
  state: NavigationState;
  actions: NavigationActions;
}

// Create context
const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Provider component props
interface NavigationProviderProps {
  children: ReactNode;
}

// Provider component
export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(navigationReducer, initialState);

  // Action creators
  const actions: NavigationActions = {
    setCurrentLocation: useCallback((location: Location | null) => {
      dispatch({ type: NAVIGATION_ACTIONS.SET_CURRENT_LOCATION, payload: location });
    }, []),

    setDestination: useCallback((destination: Destination | null) => {
      dispatch({ type: NAVIGATION_ACTIONS.SET_DESTINATION, payload: destination });
    }, []),

    setPath: useCallback((path: Waypoint[]) => {
      dispatch({ type: NAVIGATION_ACTIONS.SET_PATH, payload: { path } });
    }, []),

    setCurrentStep: useCallback((step: number) => {
      dispatch({ type: NAVIGATION_ACTIONS.SET_CURRENT_STEP, payload: step });
    }, []),

    startNavigation: useCallback(() => {
      dispatch({ type: NAVIGATION_ACTIONS.START_NAVIGATION });
    }, []),

    stopNavigation: useCallback(() => {
      dispatch({ type: NAVIGATION_ACTIONS.STOP_NAVIGATION });
      // Also stop GPS watching if active
      LocationService.stopWatching();
    }, []),

    updatePosition: useCallback((position: Position) => {
      dispatch({ type: NAVIGATION_ACTIONS.UPDATE_POSITION, payload: position });
    }, []),

    setCalibration: useCallback((type: CalibrationType, accuracy: CalibrationAccuracy) => {
      dispatch({ 
        type: NAVIGATION_ACTIONS.SET_CALIBRATION, 
        payload: { type, accuracy } 
      });
    }, []),

    setNavigationMode: useCallback((mode: NavigationMode) => {
      dispatch({ type: NAVIGATION_ACTIONS.SET_NAVIGATION_MODE, payload: mode });
    }, []),

    setArMode: useCallback((mode: ARMode) => {
      dispatch({ type: NAVIGATION_ACTIONS.SET_AR_MODE, payload: mode });
    }, []),

    setError: useCallback((error: string) => {
      dispatch({ type: NAVIGATION_ACTIONS.SET_ERROR, payload: error });
    }, []),

    clearError: useCallback(() => {
      dispatch({ type: NAVIGATION_ACTIONS.CLEAR_ERROR });
    }, []),

    // Combined action for starting GPS tracking
    startGPSTracking: useCallback(async (): Promise<void> => {
      try {
        await LocationService.startWatching((location) => {
          // Check GPS accuracy - only use high-quality GPS data
          if (location.accuracy > MAP_CONFIG.minGPSAccuracy) {
            console.warn(`GPS accuracy too low: ${location.accuracy}m (required: ${MAP_CONFIG.minGPSAccuracy}m)`);
            actions.setCalibration('gps', 'low');
            return;
          }

          // Transform GPS coordinates to map coordinates
          const mapPosition = LocationService.gpsToMapCoordinates(
            location.latitude,
            location.longitude,
            MAP_CONFIG.bounds
          );

          // Validate the transformed coordinates are within map bounds
          const isWithinBounds = 
            mapPosition.x >= 0 && mapPosition.x <= MAP_CONFIG.bounds.mapWidth &&
            mapPosition.y >= 0 && mapPosition.y <= MAP_CONFIG.bounds.mapHeight;

          if (!isWithinBounds) {
            console.warn('GPS position outside map bounds:', mapPosition);
            actions.setError('GPS position outside navigation area');
            return;
          }

          // Update position with transformed coordinates
          actions.updatePosition({
            x: mapPosition.x,
            y: mapPosition.y,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: location.timestamp,
          });

          // Set calibration accuracy based on GPS accuracy
          if (location.accuracy <= 5) {
            actions.setCalibration('gps', 'high');
          } else if (location.accuracy <= 10) {
            actions.setCalibration('gps', 'medium');
          } else {
            actions.setCalibration('gps', 'low');
          }
        }, {
          distanceInterval: MAP_CONFIG.gpsDistanceThreshold,
          timeInterval: MAP_CONFIG.gpsUpdateInterval,
          accuracy: state.settings.highAccuracyGPS 
            ? require('expo-location').Accuracy.BestForNavigation 
            : require('expo-location').Accuracy.Balanced,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown GPS error';
        actions.setError(`GPS tracking failed: ${errorMessage}`);
        actions.setCalibration('gps', 'low');
      }
    }, [state.settings.highAccuracyGPS, actions]),
  };

  return (
    <NavigationContext.Provider value={{ state, actions }}>
      {children}
    </NavigationContext.Provider>
  );
};

// Custom hook to use navigation context
export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

export default NavigationContext;