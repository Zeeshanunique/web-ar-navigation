/**
 * Verify GPS Coordinates in Database
 * Tests that all locations have GPS coordinates
 */

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

// Mock AsyncStorage for Node.js testing
const mockStorage = {};
global.AsyncStorage = {
  getItem: async (key) => mockStorage[key] || null,
  setItem: async (key, value) => { mockStorage[key] = value; },
  removeItem: async (key) => { delete mockStorage[key]; },
  clear: async () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
};

// Import database service
const DatabaseService = require('../src/database/DatabaseService').default;

async function verifyGPSCoordinates() {
  console.log('🔍 Verifying GPS Coordinates in Database\n');

  try {
    // Initialize database
    console.log('📦 Initializing database...');
    await DatabaseService.initializeData();
    
    // Get all destinations
    const destinations = await DatabaseService.getDestinations();
    console.log(`✅ Found ${destinations.length} destinations\n`);

    // Check each location for GPS coordinates
    let allValid = true;
    
    for (const dest of destinations) {
      const location = await DatabaseService.getLocationById(dest.id);
      
      if (!location) {
        console.log(`❌ ${dest.name}: Location not found`);
        allValid = false;
        continue;
      }

      const hasGPS = location.latitude && location.longitude;
      const icon = hasGPS ? '✅' : '❌';
      
      console.log(`${icon} ${location.name}`);
      console.log(`   Map: (${location.x}, ${location.y})`);
      
      if (hasGPS) {
        console.log(`   GPS: (${location.latitude}, ${location.longitude})`);
      } else {
        console.log(`   GPS: MISSING`);
        allValid = false;
      }
      console.log('');
    }

    if (allValid) {
      console.log('✅ All locations have GPS coordinates!');
      process.exit(0);
    } else {
      console.log('❌ Some locations are missing GPS coordinates');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyGPSCoordinates();

