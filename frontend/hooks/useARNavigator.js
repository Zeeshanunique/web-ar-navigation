import { useState, useEffect, useRef } from 'react';
import { calculateBearing, calculateDistance } from '../utils/routeUtils';

/**
 * Custom hook for AR navigation logic
 */
export const useARNavigator = (route, currentPosition) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(null);
  const [distanceToNext, setDistanceToNext] = useState(null);
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [arrowAngle, setArrowAngle] = useState(0);

  useEffect(() => {
    if (!route || !route.path || route.path.length === 0 || !currentPosition) {
      return;
    }

    // Find closest point in path
    let closestIndex = 0;
    let minDistance = Infinity;

    route.path.forEach((point, index) => {
      const dist = calculateDistance(currentPosition, point.coordinates);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = index;
      }
    });

    setCurrentStep(closestIndex);

    // Calculate direction to next point
    if (closestIndex < route.path.length - 1) {
      const nextPoint = route.path[closestIndex + 1];
      const bearing = calculateBearing(currentPosition, nextPoint.coordinates);
      const dist = calculateDistance(currentPosition, nextPoint.coordinates);

      setDirection(bearing);
      setDistanceToNext(dist);
    } else {
      // Reached destination
      setDirection(null);
      setDistanceToNext(0);
    }
  }, [route, currentPosition]);

  // Device orientation listener
  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) {
      console.warn('DeviceOrientationEvent not supported');
      return;
    }

    const handleOrientation = (event) => {
      setDeviceOrientation({
        alpha: event.alpha || 0, // Compass direction (0-360)
        beta: event.beta || 0,   // Front-back tilt (-180 to 180)
        gamma: event.gamma || 0, // Left-right tilt (-90 to 90)
      });
    };

    window.addEventListener('deviceorientation', handleOrientation);

    // Request permission for iOS 13+
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((response) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(console.error);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Calculate arrow angle based on device orientation and target direction
  useEffect(() => {
    if (direction === null || deviceOrientation.alpha === null) {
      return;
    }

    // Calculate relative angle: target direction - device heading
    const relativeAngle = (direction - deviceOrientation.alpha + 360) % 360;
    setArrowAngle(relativeAngle);
  }, [direction, deviceOrientation]);

  return {
    currentStep,
    direction,
    distanceToNext,
    arrowAngle,
    deviceOrientation,
    isDestinationReached: currentStep >= route?.path?.length - 1,
  };
};

