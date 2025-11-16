// Utility to clear app cache and force fresh data
const { execSync } = require('child_process');
const path = require('path');

console.log('🧹 Clearing App Cache and Storage...\n');

// For iOS Simulator - clear app data
try {
  console.log('📱 iOS Simulator: Resetting app data...');
  execSync('xcrun simctl privacy booted reset all com.zeeshanunique.arnavigation', { stdio: 'pipe' });
  console.log('✅ iOS app data cleared');
} catch (error) {
  console.log('ℹ️ iOS simulator not running or app not installed');
}

// For Android Emulator - clear app data
try {
  console.log('🤖 Android Emulator: Clearing app data...');
  execSync('adb shell pm clear com.zeeshanunique.arnavigation', { stdio: 'pipe' });
  console.log('✅ Android app data cleared');
} catch (error) {
  console.log('ℹ️ Android emulator not running or app not installed');
}

console.log('\n💡 Manual Cache Clear Instructions:');
console.log('   1. Force close the app completely');
console.log('   2. Clear app data from device settings');
console.log('   3. Restart the app');
console.log('   4. Database will reinitialize with fresh data');

console.log('\n🔧 Debug Steps:');
console.log('   1. Open Metro bundler logs');
console.log('   2. Look for database initialization messages');
console.log('   3. Check that 7 destinations are found');
console.log('   4. Verify all location IDs are loaded correctly');