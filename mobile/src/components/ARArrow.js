import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function ARArrow({ bearing, heading, screenWidth, screenHeight }) {
  // Calculate the angle difference between device heading and target bearing
  const angleDiff = bearing - heading;
  
  // Normalize angle to -180 to 180
  const normalizedAngle = ((angleDiff + 180) % 360) - 180;
  
  // Convert angle to screen coordinates
  // Arrow position: center of screen, pointing in the direction of the bearing
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2 - 100; // Slightly above center
  
  // Arrow size
  const arrowSize = 80;
  const arrowLength = arrowSize * 1.5;
  
  // Calculate arrow points based on rotation
  const rotation = (normalizedAngle * Math.PI) / 180;
  
  // Arrow shape: pointing upward by default, then rotated
  const arrowPoints = [
    { x: 0, y: -arrowLength / 2 }, // Tip
    { x: -arrowSize / 2, y: arrowLength / 2 }, // Bottom left
    { x: -arrowSize / 4, y: arrowLength / 2 - arrowSize / 2 }, // Left middle
    { x: arrowSize / 4, y: arrowLength / 2 - arrowSize / 2 }, // Right middle
    { x: arrowSize / 2, y: arrowLength / 2 }, // Bottom right
  ];
  
  // Rotate and translate points
  const rotatedPoints = arrowPoints.map((point) => {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    return {
      x: centerX + point.x * cos - point.y * sin,
      y: centerY + point.x * sin + point.y * cos,
    };
  });
  
  // Create path string
  const pathData = `M ${rotatedPoints[0].x} ${rotatedPoints[0].y} 
    L ${rotatedPoints[1].x} ${rotatedPoints[1].y} 
    L ${rotatedPoints[2].x} ${rotatedPoints[2].y} 
    L ${rotatedPoints[3].x} ${rotatedPoints[3].y} 
    L ${rotatedPoints[4].x} ${rotatedPoints[4].y} Z`;
  
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={screenWidth} height={screenHeight} style={styles.svg}>
        <Path
          d={pathData}
          fill="#4A90E2"
          stroke="#fff"
          strokeWidth="3"
          opacity={0.9}
        />
      </Svg>
      
      {/* Distance indicator circle */}
      <View
        style={[
          styles.circle,
          {
            left: centerX - 30,
            top: centerY - 30,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    ...StyleSheet.absoluteFillObject,
  },
  circle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#4A90E2',
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
  },
});

