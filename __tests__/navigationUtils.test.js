import { 
  calculateBearing, 
  calculateDistance, 
  normalizeAngle,
  formatDistance,
  formatTime,
  generateTurnInstruction,
  generatePathInstructions,
  estimateWalkingTime,
  detectMovement,
  smoothSensorValue
} from '../src/utils/navigationUtils';

describe('Navigation Utils Tests', () => {
  describe('calculateDistance', () => {
    test('should calculate distance between two points', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 3, y: 4 };
      expect(calculateDistance(point1, point2)).toBe(5);
    });

    test('should handle null inputs', () => {
      expect(calculateDistance(null, { x: 1, y: 1 })).toBe(0);
      expect(calculateDistance({ x: 1, y: 1 }, null)).toBe(0);
    });

    test('should handle invalid inputs', () => {
      expect(calculateDistance({ x: 'invalid', y: 1 }, { x: 1, y: 1 })).toBe(0);
    });
  });

  describe('calculateBearing', () => {
    test('should calculate bearing for north direction', () => {
      const from = { x: 0, y: 0 };
      const to = { x: 0, y: 1 };
      expect(calculateBearing(from, to)).toBe(90);
    });

    test('should calculate bearing for east direction', () => {
      const from = { x: 0, y: 0 };
      const to = { x: 1, y: 0 };
      expect(calculateBearing(from, to)).toBe(0);
    });

    test('should handle null inputs', () => {
      expect(calculateBearing(null, { x: 1, y: 1 })).toBe(0);
    });
  });

  describe('normalizeAngle', () => {
    test('should normalize angles to -180 to 180 range', () => {
      expect(normalizeAngle(270)).toBe(-90);
      expect(normalizeAngle(-270)).toBe(90);
      expect(normalizeAngle(180)).toBe(180);
      expect(normalizeAngle(-180)).toBe(-180);
    });
  });

  describe('formatDistance', () => {
    test('should format distance in centimeters for small values', () => {
      expect(formatDistance(0.5)).toBe('50cm');
    });

    test('should format distance in meters', () => {
      expect(formatDistance(5.67)).toBe('5.7m');
    });

    test('should format distance in kilometers for large values', () => {
      expect(formatDistance(1500)).toBe('1.5km');
    });
  });

  describe('formatTime', () => {
    test('should format time in seconds', () => {
      expect(formatTime(30)).toBe('30s');
    });

    test('should format time in minutes', () => {
      expect(formatTime(120)).toBe('2min');
    });

    test('should format time in hours and minutes', () => {
      expect(formatTime(3900)).toBe('1h 5min');
    });
  });

  describe('generateTurnInstruction', () => {
    test('should generate correct turn instructions', () => {
      expect(generateTurnInstruction(0, 20)).toBe('Slight right');
      expect(generateTurnInstruction(0, -20)).toBe('Slight left');
      expect(generateTurnInstruction(0, 90)).toBe('Turn right');
      expect(generateTurnInstruction(0, -90)).toBe('Turn left');
      expect(generateTurnInstruction(0, 180)).toBe('Turn around');
      expect(generateTurnInstruction(0, 5)).toBe('Continue straight');
    });
  });

  describe('estimateWalkingTime', () => {
    test('should estimate walking time correctly', () => {
      expect(estimateWalkingTime(140, 1.4)).toBe(100); // 140m at 1.4 m/s = 100s
    });
  });

  describe('detectMovement', () => {
    test('should detect movement based on accelerometer changes', () => {
      const current = { x: 1, y: 1, z: 1 };
      const last = { x: 0.8, y: 0.8, z: 0.8 };
      expect(detectMovement(current, last, 0.5)).toBe(true);
    });

    test('should not detect movement for small changes', () => {
      const current = { x: 1, y: 1, z: 1 };
      const last = { x: 1.01, y: 1.01, z: 1.01 };
      expect(detectMovement(current, last, 0.1)).toBe(false);
    });
  });

  describe('smoothSensorValue', () => {
    test('should smooth sensor values using exponential moving average', () => {
      const result = smoothSensorValue(10, 5, 0.1);
      expect(result).toBe(5.5); // 0.1 * 10 + 0.9 * 5 = 5.5
    });
  });

  describe('generatePathInstructions', () => {
    test('should generate path instructions for a simple path', () => {
      const path = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ];
      
      const instructions = generatePathInstructions(path);
      expect(instructions).toHaveLength(3); // 2 steps + arrival
      expect(instructions[0].instruction).toBe('Continue straight');
      expect(instructions[instructions.length - 1].instruction).toBe('You have arrived at your destination');
    });

    test('should handle empty path', () => {
      const instructions = generatePathInstructions([]);
      expect(instructions).toHaveLength(1);
      expect(instructions[0].instruction).toBe('You have arrived');
    });
  });
});

// Mock setup for React Native testing
jest.mock('lodash', () => ({
  throttle: jest.fn((fn) => fn),
  memoize: jest.fn((fn) => fn),
}));