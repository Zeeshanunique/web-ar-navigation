import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Polygon, Defs, LinearGradient, Stop } from 'react-native-svg';
import { 
  calculateBearing, 
  calculateDistance, 
  formatDistance,
} from '../utils/navigationUtils';
import type { Waypoint, Position } from '../types';

interface FloorAROverlayProps {
  path: Waypoint[];
  currentPosition: Position;
  heading: number;
  screenWidth: number;
  screenHeight: number;
  currentStep?: number;
}

const FloorAROverlay: React.FC<FloorAROverlayProps> = memo(({
  path,
  currentPosition,
  heading,
  screenWidth,
  screenHeight,
  currentStep = 0,
}) => {
  const { floorArrows, nextWaypointInfo } = useMemo(() => {
    if (!path || path.length === 0 || !currentPosition) {
      return { floorArrows: [], nextWaypointInfo: null };
    }

    const upcomingPath = path.slice(currentStep);
    const MAX_ARROW_DISTANCE = 20; // Show arrows up to 20m ahead
    const ARROW_SPACING = 2; // Space between arrows (meters)
    
    const nextWaypoint = upcomingPath[0];
    if (!nextWaypoint) {
      return { floorArrows: [], nextWaypointInfo: null };
    }

    const totalDistance = calculateDistance(currentPosition, nextWaypoint);
    const bearing = calculateBearing(currentPosition, nextWaypoint);
    
    // Calculate relative bearing (difference between waypoint direction and current heading)
    let relativeBearing = bearing - (heading * 180 / Math.PI); // Convert heading to degrees
    while (relativeBearing > 180) relativeBearing -= 360;
    while (relativeBearing < -180) relativeBearing += 360;

    // Generate floor arrows
    const numArrows = Math.min(Math.floor(totalDistance / ARROW_SPACING), 10);
    const arrows = [];

    for (let i = 0; i < numArrows; i++) {
      const distanceFromUser = i * ARROW_SPACING + 1; // Start 1m ahead
      
      if (distanceFromUser > MAX_ARROW_DISTANCE) break;

      // Project arrow onto screen with perspective
      const screenPos = projectFloorArrowToScreen(
        distanceFromUser,
        relativeBearing,
        screenWidth,
        screenHeight
      );

      if (screenPos) {
        arrows.push({
          ...screenPos,
          id: i,
          distance: distanceFromUser,
        });
      }
    }

    const nextInfo = {
      distance: formatDistance(totalDistance),
      bearing: Math.round(bearing),
      relativeBearing: Math.round(relativeBearing),
    };

    return { floorArrows: arrows, nextWaypointInfo: nextInfo };
  }, [path, currentPosition, heading, screenWidth, screenHeight, currentStep]);

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
      {nextWaypointInfo && (
        <View style={styles.infoPanel}>
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceLabel}>DISTANCE</Text>
            <Text style={styles.distanceValue}>{nextWaypointInfo.distance}</Text>
          </View>
          <View style={styles.bearingContainer}>
            <Text style={styles.bearingLabel}>
              {getTurnDirection(nextWaypointInfo.relativeBearing)}
            </Text>
            <Text style={styles.bearingValue}>{nextWaypointInfo.bearing}°</Text>
          </View>
        </View>
      )}
      
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
  screenHeight: number
) => {
  // Only show arrows within FOV
  const FOV = 45; // Field of view
  if (Math.abs(relativeBearing) > FOV) {
    return null;
  }

  // Calculate perspective scaling (closer = larger)
  const maxDistance = 20;
  const minScale = 0.2;
  const maxScale = 1.0;
  
  const distanceFactor = 1 - (distanceFromUser / maxDistance);
  const scale = minScale + (distanceFactor * (maxScale - minScale));
  
  // Calculate Y position (closer arrows appear lower on screen)
  // This creates the "floor" perspective effect
  const vanishingPointY = screenHeight * 0.35; // Where arrows converge (horizon)
  const bottomY = screenHeight * 0.85; // Where closest arrow appears
  
  const y = vanishingPointY + (bottomY - vanishingPointY) * distanceFactor;
  
  // Calculate X position based on relative bearing
  const lateralOffset = (relativeBearing / FOV) * (screenWidth * 0.4);
  const x = screenWidth / 2 + lateralOffset * distanceFactor;
  
  // Calculate arrow size based on distance
  const baseWidth = 80;
  const baseHeight = 50;
  const width = baseWidth * scale;
  const height = baseHeight * scale;
  
  // Calculate opacity (fade distant arrows)
  const opacity = 0.4 + (distanceFactor * 0.6); // 0.4 to 1.0
  
  // Stroke width based on scale
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

/**
 * Create chevron (^) arrow points for polygon
 */
const createChevronPoints = (
  x: number,
  y: number,
  width: number,
  height: number
): string => {
  const halfWidth = width / 2;
  const thickness = width * 0.25; // Thickness of the chevron line
  
  // Chevron pointing up (forward direction)
  const points = [
    // Top point
    [x, y - height / 2],
    
    // Right outer edge
    [x + halfWidth, y + height / 2],
    [x + halfWidth - thickness, y + height / 2],
    [x, y - height / 2 + thickness * 1.5],
    
    // Left inner edge
    [x - halfWidth + thickness, y + height / 2],
    [x - halfWidth, y + height / 2],
  ];
  
  return points.map(p => `${p[0]},${p[1]}`).join(' ');
};

/**
 * Get turn direction text from relative bearing
 */
const getTurnDirection = (relativeBearing: number): string => {
  const abs = Math.abs(relativeBearing);
  
  if (abs < 10) {
    return 'GO STRAIGHT';
  } else if (abs < 45) {
    return relativeBearing > 0 ? 'SLIGHT RIGHT' : 'SLIGHT LEFT';
  } else if (abs < 90) {
    return relativeBearing > 0 ? 'TURN RIGHT' : 'TURN LEFT';
  } else {
    return relativeBearing > 0 ? 'SHARP RIGHT' : 'SHARP LEFT';
  }
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

