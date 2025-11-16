import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { 
  calculateBearing, 
  calculateDistance, 
  formatDistance,
  generateTurnInstruction 
} from '../utils/navigationUtils';
import type { Waypoint, Position, DeviceOrientation } from '../types';

interface ScreenPosition {
  x: number;
  y: number;
  isOffScreen: boolean;
}

interface EnhancedWaypoint extends Waypoint {
  distance: number;
  bearing: number;
  screenPosition: ScreenPosition | null;
  instruction: string;
  stepIndex: number;
}

interface NextWaypointInfo {
  distance: string;
  instruction: string;
  bearing: number;
}

interface EnhancedARPathOverlayProps {
  path: Waypoint[];
  currentPosition: Position;
  heading: number;
  deviceOrientation: DeviceOrientation;
  screenWidth: number;
  screenHeight: number;
  currentStep?: number;
  showDistanceIndicators?: boolean;
  showTurnInstructions?: boolean;
  maxVisibleWaypoints?: number;
}

const EnhancedARPathOverlay: React.FC<EnhancedARPathOverlayProps> = memo(({
  path,
  currentPosition,
  heading,
  deviceOrientation,
  screenWidth,
  screenHeight,
  currentStep = 0,
  showDistanceIndicators = true,
  showTurnInstructions = true,
  maxVisibleWaypoints = 5,
}) => {
  const visibleWaypoints = useMemo((): EnhancedWaypoint[] => {
    if (!path || path.length === 0 || !currentPosition) {
      console.log('⚠️  No path or position:', { path: path?.length, currentPosition });
      return [];
    }

    console.log('📊 AR Overlay - Current:', currentPosition, 'Heading:', heading, 'Step:', currentStep);

    const upcomingPath = path.slice(currentStep);
    const MAX_DISTANCE = 50;
    
    return upcomingPath
      .slice(0, maxVisibleWaypoints)
      .map((waypoint, index) => {
        const distance = calculateDistance(currentPosition, waypoint);
        const bearing = calculateBearing(currentPosition, waypoint);
        
        console.log(`  → Waypoint ${index}: (${waypoint.x}, ${waypoint.y}) - ${distance.toFixed(2)}m away, bearing: ${bearing.toFixed(0)}°`);
        
        if (distance > MAX_DISTANCE) return null;
        
        const screenPosition = projectToScreen(
          waypoint, 
          currentPosition, 
          heading, 
          screenWidth, 
          screenHeight
        );
        
        let instruction = 'Continue';
        if (index < upcomingPath.length - 1) {
          const nextWaypoint = upcomingPath[index + 1];
          const currentBearing = bearing;
          const nextBearing = calculateBearing(waypoint, nextWaypoint);
          instruction = generateTurnInstruction(currentBearing, nextBearing);
        } else if (index === upcomingPath.length - 1) {
          instruction = 'Destination';
        }
        
        return {
          ...waypoint,
          distance,
          bearing,
          screenPosition,
          instruction,
          stepIndex: currentStep + index,
        };
      })
      .filter((item): item is EnhancedWaypoint => item !== null);
  }, [path, currentPosition, heading, currentStep, screenWidth, screenHeight, maxVisibleWaypoints]);

  const nextWaypointInfo = useMemo((): NextWaypointInfo | null => {
    if (visibleWaypoints.length === 0) return null;
    
    const nextWaypoint = visibleWaypoints[0];
    return {
      distance: formatDistance(nextWaypoint.distance),
      instruction: nextWaypoint.instruction,
      bearing: nextWaypoint.bearing,
    };
  }, [visibleWaypoints]);

  if (!path || path.length === 0 || !currentPosition) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Svg width={screenWidth} height={screenHeight} style={styles.overlay}>
        {visibleWaypoints.map((waypoint, index) => {
          const { screenPosition, distance, instruction, stepIndex } = waypoint;
          
          if (!screenPosition || screenPosition.isOffScreen) {
            return null;
          }
          
          const isNextWaypoint = index === 0;
          const proximityFactor = Math.max(0.4, Math.min(1, 15 / distance)); // Closer = larger
          const opacity = Math.max(0.7, 1 - (distance / 40)); // More visible
          
          // Dynamic scaling based on distance and importance
          let scale = proximityFactor;
          if (isNextWaypoint) {
            scale *= 1.5; // Next waypoint is 50% larger
          }
          scale = Math.max(0.8, Math.min(2.5, scale)); // Clamp between 0.8x and 2.5x
          
          // Enhanced colors for better visibility
          const arrowColor = isNextWaypoint ? '#00FF88' : '#4ECDC4'; // Brighter green for next
          const strokeColor = isNextWaypoint ? '#FFFFFF' : '#2C3E50';
          const strokeWidth = isNextWaypoint ? 3 : 2;
          
          return (
            <React.Fragment key={`waypoint-${stepIndex}`}>
              {/* Main Arrow */}
              <Path
                d={createArrowPath(screenPosition.x, screenPosition.y, scale)}
                fill={arrowColor}
                opacity={opacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              
              {/* Pulsing effect for next waypoint */}
              {isNextWaypoint && (
                <Path
                  d={createArrowPath(screenPosition.x, screenPosition.y, scale * 1.2)}
                  fill="none"
                  stroke="#00FF88"
                  strokeWidth="2"
                  opacity="0.3"
                />
              )}
              
              {showDistanceIndicators && (
                <React.Fragment>
                  <Circle
                    cx={screenPosition.x}
                    cy={screenPosition.y - 50 * scale}
                    r={18 * Math.min(scale, 1.2)}
                    fill="rgba(0, 0, 0, 0.8)"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <SvgText
                    x={screenPosition.x}
                    y={screenPosition.y - 45 * scale}
                    fontSize={12 * Math.min(scale, 1.2)}
                    fill="#FFFFFF"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {formatDistance(distance)}
                  </SvgText>
                </React.Fragment>
              )}
              
              {showTurnInstructions && isNextWaypoint && instruction !== 'Continue' && (
                <React.Fragment>
                  <Circle
                    cx={screenPosition.x}
                    cy={screenPosition.y + 60 * scale}
                    r={30 * Math.min(scale, 1.2)}
                    fill="rgba(0, 255, 136, 0.9)"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <SvgText
                    x={screenPosition.x}
                    y={screenPosition.y + 66 * scale}
                    fontSize={10 * Math.min(scale, 1.2)}
                    fill="#000000"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {instruction.split(' ')[0]}
                  </SvgText>
                </React.Fragment>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
      
      {nextWaypointInfo && (
        <View style={styles.infoPanel}>
          <Text style={styles.distanceText}>{nextWaypointInfo.distance}</Text>
          <Text style={styles.instructionText}>{nextWaypointInfo.instruction}</Text>
        </View>
      )}
    </View>
  );
});

const projectToScreen = (
  waypoint: Waypoint, 
  currentPosition: Position, 
  heading: number, 
  screenWidth: number, 
  screenHeight: number
): ScreenPosition => {
  const FOV = 60; // Field of view in degrees
  const distance = calculateDistance(currentPosition, waypoint);
  const bearing = calculateBearing(currentPosition, waypoint);
  
  // Calculate relative bearing (difference between waypoint direction and current heading)
  let relativeBearing = bearing - heading;
  while (relativeBearing > 180) relativeBearing -= 360;
  while (relativeBearing < -180) relativeBearing += 360;
  
  // Check if waypoint is outside field of view
  if (Math.abs(relativeBearing) > FOV / 2) {
    // Clamp to edge of screen with larger margin for better visibility
    const clampedBearing = Math.sign(relativeBearing) * (FOV / 2);
    const x = screenWidth / 2 + (clampedBearing / (FOV / 2)) * (screenWidth / 2 * 0.8);
    return {
      x: Math.max(60, Math.min(screenWidth - 60, x)), // Larger margins
      y: screenHeight / 2,
      isOffScreen: true,
    };
  }
  
  // Map relative bearing to screen X coordinate
  const x = screenWidth / 2 + (relativeBearing / (FOV / 2)) * (screenWidth / 2 * 0.8);
  
  // Map distance to screen Y coordinate with improved perspective
  const maxDistance = 40; // Maximum visible distance
  const minDistance = 2;   // Minimum distance before waypoint becomes very large
  
  const normalizedDistance = Math.max(0, Math.min(1, (distance - minDistance) / (maxDistance - minDistance)));
  
  // Create more natural depth perception
  const perspectiveFactor = 1 - (normalizedDistance * 0.7); // 0.3 to 1.0 range
  const y = screenHeight * 0.8 - (normalizedDistance * screenHeight * 0.4);
  
  return {
    x: Math.max(30, Math.min(screenWidth - 30, x)),
    y: Math.max(screenHeight * 0.3, Math.min(screenHeight * 0.9, y)),
    isOffScreen: false,
  };
};

const createArrowPath = (x: number, y: number, scale: number = 1): string => {
  // Significantly larger base size for better visibility
  const baseSize = 35 * scale; // Increased from 20 to 35
  const width = baseSize;
  const height = baseSize * 1.2; // Slightly taller arrow
  
  // Create a more pronounced arrow shape
  const arrowPoints = [
    [x, y - height/2],                          // Top point
    [x - width*0.3, y - height*0.1],          // Left upper
    [x - width*0.15, y - height*0.1],         // Left inner
    [x - width*0.15, y + height*0.3],         // Left shaft
    [x - width*0.4, y + height*0.3],          // Left outer shaft
    [x, y + height/2],                         // Bottom point
    [x + width*0.4, y + height*0.3],          // Right outer shaft
    [x + width*0.15, y + height*0.3],         // Right shaft
    [x + width*0.15, y - height*0.1],         // Right inner
    [x + width*0.3, y - height*0.1],          // Right upper
  ];
  
  const pathString = arrowPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`)
    .join(' ') + ' Z';
  
  return pathString;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  infoPanel: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(44, 62, 80, 0.9)',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  distanceText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  instructionText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '600',
  },
});

EnhancedARPathOverlay.displayName = 'EnhancedARPathOverlay';

export default EnhancedARPathOverlay;