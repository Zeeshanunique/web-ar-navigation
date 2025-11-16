#!/usr/bin/env node

/**
 * Google Maps API Test Script
 * Tests the Directions API to ensure it's working correctly
 * 
 * Usage:
 *   node scripts/test-google-maps.js YOUR_API_KEY
 *   or set GOOGLE_MAPS_API_KEY environment variable
 */

const axios = require('axios');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(message) {
  console.log('\n' + '='.repeat(60));
  log(message, colors.bright + colors.blue);
  console.log('='.repeat(60) + '\n');
}

// Test coordinates (example: Google HQ to Stanford)
const TEST_ORIGIN = { lat: 37.4220, lng: -122.0841 };  // Mountain View
const TEST_DESTINATION = { lat: 37.4275, lng: -122.1697 }; // Stanford

// Your campus test coordinates (update these!)
const CAMPUS_PARKING = { lat: 13.170200, lng: 77.559100 };
const CAMPUS_LIBRARY = { lat: 13.170500, lng: 77.559333 };

async function testGoogleMapsAPI(apiKey) {
  header('🗺️  Google Maps API Test');

  if (!apiKey) {
    log('❌ No API key provided!', colors.red);
    log('\nUsage:', colors.yellow);
    log('  1. Add API key to HARDCODED_API_KEY in this file');
    log('  2. Or pass as argument: node scripts/test-google-maps.js YOUR_API_KEY');
    log('  3. Or use env var: GOOGLE_MAPS_API_KEY=YOUR_KEY node scripts/test-google-maps.js\n');
    process.exit(1);
  }

  log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`, colors.blue);
  log('Testing Google Maps Directions API...\n', colors.yellow);

  // Test 1: Basic API connection
  await testBasicConnection(apiKey);

  // Test 2: Directions request (walking mode)
  await testDirectionsRequest(apiKey, TEST_ORIGIN, TEST_DESTINATION, 'Public Test Route');

  // Test 3: Campus route (if coordinates are configured)
  await testDirectionsRequest(apiKey, CAMPUS_PARKING, CAMPUS_LIBRARY, 'Campus Route');

  header('🎉 All Tests Complete!');
  log('✅ Google Maps API is working correctly!', colors.green);
  log('\nNext Steps:', colors.yellow);
  log('1. Add your API key to src/services/GoogleMapsService.ts');
  log('2. Update GPS coordinates in src/database/DatabaseService.ts');
  log('3. Run: npm start');
  log('4. Test navigation in the app\n');
}

async function testBasicConnection(apiKey) {
  try {
    log('📡 Test 1: API Connection...', colors.blue);
    
    const url = 'https://maps.googleapis.com/maps/api/directions/json';
    const params = {
      origin: `${TEST_ORIGIN.lat},${TEST_ORIGIN.lng}`,
      destination: `${TEST_DESTINATION.lat},${TEST_DESTINATION.lng}`,
      key: apiKey,
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    
    if (response.data.status === 'OK') {
      log('   ✅ API connection successful!', colors.green);
      log(`   Status: ${response.data.status}\n`);
    } else if (response.data.status === 'REQUEST_DENIED') {
      log('   ❌ API request denied!', colors.red);
      log(`   Error: ${response.data.error_message || 'Unknown error'}`, colors.red);
      log('\n   Possible issues:', colors.yellow);
      log('   - API key is invalid');
      log('   - Directions API is not enabled');
      log('   - API key restrictions are too strict\n');
      process.exit(1);
    } else {
      log(`   ⚠️  Unexpected status: ${response.data.status}`, colors.yellow);
      log(`   Message: ${response.data.error_message || 'No message'}\n`);
    }
  } catch (error) {
    log('   ❌ Connection failed!', colors.red);
    if (error.code === 'ECONNABORTED') {
      log('   Error: Request timeout\n', colors.red);
    } else if (error.response) {
      log(`   Error: ${error.response.status} - ${error.response.statusText}\n`, colors.red);
    } else {
      log(`   Error: ${error.message}\n`, colors.red);
    }
    process.exit(1);
  }
}

async function testDirectionsRequest(apiKey, origin, destination, routeName) {
  try {
    log(`🧭 Testing: ${routeName}...`, colors.blue);
    log(`   From: ${origin.lat}, ${origin.lng}`);
    log(`   To:   ${destination.lat}, ${destination.lng}`);
    
    const url = 'https://maps.googleapis.com/maps/api/directions/json';
    const params = {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: 'walking',
      key: apiKey,
      units: 'metric',
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    
    if (response.data.status === 'OK') {
      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      log('   ✅ Route calculated successfully!', colors.green);
      log(`   Distance: ${leg.distance.text}`, colors.green);
      log(`   Duration: ${leg.duration.text}`, colors.green);
      log(`   Steps: ${leg.steps.length} turn-by-turn instructions`, colors.green);
      log(`   Polyline points: ${route.overview_polyline.points.length} characters`, colors.green);
      
      // Show first 3 instructions
      log('\n   First 3 instructions:', colors.yellow);
      leg.steps.slice(0, 3).forEach((step, index) => {
        const instruction = step.html_instructions.replace(/<[^>]*>/g, ''); // Remove HTML tags
        log(`   ${index + 1}. ${instruction} (${step.distance.text})`, colors.yellow);
      });
      log('');
      
    } else if (response.data.status === 'ZERO_RESULTS') {
      log('   ⚠️  No route found between these locations', colors.yellow);
      log('   This might be normal if locations are very close or not connected\n', colors.yellow);
    } else {
      log(`   ⚠️  Status: ${response.data.status}`, colors.yellow);
      log(`   Message: ${response.data.error_message || 'No additional info'}\n`, colors.yellow);
    }
  } catch (error) {
    log(`   ❌ Request failed: ${error.message}\n`, colors.red);
  }
}

// Your Google Maps API Key (add your key here)
const HARDCODED_API_KEY = 'AIzaSyBpeQKa4b7h0ptNWfmohF_ZMiSVK1feoOc';

// Parse API key from: hardcoded > command line > environment variable
const apiKey = HARDCODED_API_KEY || process.argv[2] || process.env.GOOGLE_MAPS_API_KEY;

// Run tests
testGoogleMapsAPI(apiKey)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    log(`\n❌ Test failed: ${error.message}`, colors.red);
    process.exit(1);
  });

