// Simple test script to verify all QR locations exist
const expectedLocations = [
  'parking_01', 'library', 'cafeteria', 'computer_lab', 
  'student_lounge', 'classroom_a', 'lab', 'auditorium'
];

console.log('🧪 Expected locations for QR codes:');
expectedLocations.forEach((loc, index) => {
  console.log(`   ${index + 1}. ${loc}`);
});

console.log('\n💡 If QR scanning fails:');
console.log('   1. Open the app and check console logs');
console.log('   2. Look for database initialization messages');
console.log('   3. Verify that all 8 locations are loaded');
console.log('   4. The database will auto-reseed if version mismatch detected');

console.log('\n📱 QR Code Test Instructions:');
console.log('   1. Start the mobile app');
console.log('   2. Use QR scanner to scan any QR code');
console.log('   3. Check console for database debug messages');
console.log('   4. All 8 locations should be available');