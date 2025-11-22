import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Defs, LinearGradient, Stop } from 'react-native-svg';
import { formatDistance } from '../utils/navigationUtils';

interface FloorAROverlayProps {
  distanceToNext: number; // meters
  relativeBearing: number; // degrees (-180 to 180)
  targetBearing: number; // absolute bearing (for display)
  screenWidth: number;
  screenHeight: number;
  devicePitch?: number;
}

const FloorAROverlay: React.FC<FloorAROverlayProps> = memo(({
  distanceToNext,
  relativeBearing,
  targetBearing,
  screenWidth,
  screenHeight,
  devicePitch = 0,
}) => {
  const floorArrows = useMemo(() => {
    const MAX_ARROW_DISTANCE = 20; // Show arrows up to 20m ahead
    const ARROW_SPACING = 2; // Space between arrows (meters)
    
    if (distanceToNext <= 1) return []; // Too close

    // Generate floor arrows
    const numArrows = Math.min(Math.floor(distanceToNext / ARROW_SPACING), 10);
    const arrows = [];

    for (let i = 0; i < numArrows; i++) {
      const distanceFromUser = i * ARROW_SPACING + 1; // Start 1m ahead
      
      if (distanceFromUser > MAX_ARROW_DISTANCE) break;

      // Project arrow onto screen with perspective
      const screenPos = projectFloorArrowToScreen(
        distanceFromUser,
        relativeBearing,
        screenWidth,
        screenHeight,
        devicePitch
      );

      if (screenPos) {
        arrows.push({
          ...screenPos,
          id: i,
          distance: distanceFromUser,
        });
      }
    }

    return arrows;
  }, [distanceToNext, relativeBearing, screenWidth, screenHeight, devicePitch]);

  if (floorArrows.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={screenWidth} height={screenHeight} style={styles.svg}>
        <Defs>
          <LinearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#00FF88" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#00CC66" stopOpacity="0.7" />
          </LinearGradient>
        </Defs>
        
        {floorArrows.map((arrow) => (
          <React.Fragment key={arrow.id}>
            {/* Shadow for depth */}
            <Polygon
              points={createChevronPoints(arrow.x, arrow.y + 3, arrow.width, arrow.height)}
              fill="rgba(0, 0, 0, 0.3)"
              opacity={arrow.opacity * 0.5}
            />
            
            {/* Main chevron arrow */}
            <Polygon
              points={createChevronPoints(arrow.x, arrow.y, arrow.width, arrow.height)}
              fill="url(#arrowGradient)"
              opacity={arrow.opacity}
              stroke="#FFFFFF"
              strokeWidth={arrow.strokeWidth}
            />
          </React.Fragment>
        ))}
      </Svg>
      
      {/* Info panel at bottom */}
      <View style={styles.infoPanel}>
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceLabel}>DISTANCE</Text>
          <Text style={styles.distanceValue}>{formatDistance(distanceToNext)}</Text>
        </View>
        <View style={styles.bearingContainer}>
          <Text style={styles.bearingLabel}>
            {getTurnDirection(relativeBearing)}
          </Text>
          <Text style={styles.bearingValue}>{Math.round(targetBearing)}°</Text>
        </View>
      </View>
      
      {/* Horizon line for reference */}
      <View style={[styles.horizonLine, { top: screenHeight * 0.4 }]} />
    </View>
  );
});

/**
 * Project a floor arrow onto the screen with perspective
 */
const projectFloorArrowToScreen = (
  distanceFromUser: number,
  relativeBearing: number,
  screenWidth: number,
  screenHeight: number,
  devicePitch: number
) => {
  // Only show arrows within FOV
  const FOV = 45; // Field of view
  if (Math.abs(relativeBearing) > FOV) {
    return null;
  }

  // Calculate vanishing point based on device pitch
  const verticalFOV = 60;
  const pixelsPerDegree = screenHeight / verticalFOV;
  
  // Calculate where the horizon (level with ground) is on screen
  const vanishingPointY = (screenHeight / 2) + ((devicePitch - 90) * pixelsPerDegree);

  const CAMERA_HEIGHT = 1.5; // meters
  const angleDownToPoint = (Math.atan(CAMERA_HEIGHT / distanceFromUser) * 180) / Math.PI;
  
  const y = vanishingPointY + (angleDownToPoint * pixelsPerDegree);
  
  // Don't show if off screen
  if (y < -100 || y > screenHeight + 100) return null;

  const scale = Math.min(1.2, Math.max(0.2, 2 / distanceFromUser));

  // Calculate X position based on relative bearing
  const lateralOffset = (relativeBearing / FOV) * (screenWidth * 0.8);
  const x = screenWidth / 2 + lateralOffset;
  
  const baseWidth = 80;
  const baseHeight = 50;
  const width = baseWidth * scale;
  const height = baseHeight * scale;
  
  const opacity = Math.min(1, Math.max(0, 1 - (distanceFromUser / 20)));
  const strokeWidth = 1 + (scale * 2);
  
  return {
    x,
    y,
    width,
    height,
    scale,
    opacity,
    strokeWidth,
  };
};

const createChevronPoints = (x: number, y: number, width: number, height: number): string => {
  const halfWidth = width / 2;
  const thickness = width * 0.25;
  
  const points = [
    [x, y - height / 2],
    [x + halfWidth, y + height / 2],
    [x + halfWidth - thickness, y + height / 2],
    [x, y - height / 2 + thickness * 1.5],
    [x - halfWidth + thickness, y + height / 2],
    [x - halfWidth, y + height / 2],
  ];
  
  return points.map(p => `${p[0]},${p[1]}`).join(' ');
};

const getTurnDirection = (relativeBearing: number): string => {
  const abs = Math.abs(relativeBearing);
  
  if (abs < 10) return 'GO STRAIGHT';
  else if (abs < 45) return relativeBearing > 0 ? 'SLIGHT RIGHT' : 'SLIGHT LEFT';
  else if (abs < 90) return relativeBearing > 0 ? 'TURN RIGHT' : 'TURN LEFT';
  else return relativeBearing > 0 ? 'SHARP RIGHT' : 'SHARP LEFT';
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  horizonLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#00FF88',
  },
  distanceContainer: {
    flex: 1,
    alignItems: 'center',
  },
  distanceLabel: {
    fontSize: 11,
    color: '#AAAAAA',
    fontWeight: '600',
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 28,
    color: '#00FF88',
    fontWeight: 'bold',
  },
  bearingContainer: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#444444',
  },
  bearingLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  bearingValue: {
    fontSize: 20,
    color: '#00FF88',
    fontWeight: 'bold',
  },
});

export default FloorAROverlay;
