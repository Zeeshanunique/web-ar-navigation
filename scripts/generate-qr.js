const path = require('path');
const fs = require('fs');

// Try to require QRCode from project root node_modules
let QRCode;
try {
  QRCode = require('qrcode');
} catch (error) {
  console.error('❌ QRCode package not found. Installing...');
  console.log('\n💡 To generate QR codes, run:');
  console.log('   npm install qrcode');
  console.log('   Then run: node scripts/generate-qr.js');
  process.exit(1);
}

// All location data matching DatabaseService.ts
const locations = [
  { id: 'two_wheeler_parking', name: 'Two Wheeler Parking' },
  { id: 'main_entrance', name: 'Main Entrance' },
  { id: 'staff_washroom', name: 'Staff Washroom' },
  { id: 'girls_hostel', name: 'Girls Hostel' },
  { id: 'college_canteen', name: 'College Canteen' },
  { id: 'mba_block', name: 'MBA Block' },
  { id: 'basketball_court', name: 'Basketball Court' },
  { id: 'cafe', name: 'Cafe' },
  { id: 'boys_hostel', name: 'Boys Hostel' },
  { id: 'room_241', name: 'Room 241' },
  { id: 'room_242', name: 'Room 242' },
  { id: 'room_239', name: 'Room 239' },
  { id: 'room_238', name: 'Room 238' },
  { id: 'room_237', name: 'Room 237' },
  { id: 'room_236', name: 'Room 236' },
  { id: 'aiml_staff_room', name: 'AIML Staff Room' },
  { id: 'seminar_hall', name: 'Seminar Hall' },
  { id: 'room_221', name: 'Room 221' },
  { id: 'hod_cabin', name: 'HOD Cabin' },
  { id: 'room_223', name: 'Room 223' },
  { id: 'room_224', name: 'Room 224' },
  { id: 'room_201', name: 'Room 201' },
  { id: 'room_203', name: 'Room 203' },
  { id: 'room_204', name: 'Room 204' },
  { id: 'room_205', name: 'Room 205' },
  { id: 'home', name: 'Home' },
  { id: 'office', name: 'Office' },
];

// Create output directory
const outputDir = path.join(__dirname, '../qr-codes');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateQRCode(location) {
  try {
    // QR code data format: Simple location ID only
    // Database will map this ID to GPS coordinates
    const qrData = JSON.stringify({ locationId: location.id });
    
    // Generate QR code
    const qrPath = path.join(outputDir, `${location.id}.png`);
    await QRCode.toFile(qrPath, qrData, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    console.log(`✅ Generated QR code for ${location.name}`);
    console.log(`   ID: ${location.id}`);
    console.log(`   QR Data: ${qrData}`);
    console.log(`   File: ${qrPath}\n`);
    
    // Also generate a text file with the data
    const txtPath = path.join(outputDir, `${location.id}.txt`);
    const readableData = `Location: ${location.name}
ID: ${location.id}
QR Data: ${qrData}

Note: GPS coordinates are stored in the app database (DatabaseService.ts)`;
    fs.writeFileSync(txtPath, readableData);
    
    return qrPath;
  } catch (error) {
    console.error(`❌ Error generating QR for ${location.name}:`, error);
    return null;
  }
}

async function generateAllQRCodes() {
  console.log('🚀 Generating QR codes...\n');
  
  for (const location of locations) {
    await generateQRCode(location);
  }
  
  console.log(`🎉 Generated ${locations.length} QR codes in ${outputDir}`);
  console.log('\n📝 QR Code Format:');
  console.log('   Simple: { "locationId": "location_id" }');
  console.log('\n💡 How It Works:');
  console.log('   1. QR code contains only location ID (simple!)');
  console.log('   2. App scans QR → gets location ID');
  console.log('   3. Database maps ID → GPS coordinates');
  console.log('   4. Google Maps calculates route');
  console.log('   5. AR navigation displays on screen');
  console.log('\n✅ Benefits:');
  console.log('   - QR codes never need to change');
  console.log('   - Update GPS coordinates in database only');
  console.log('   - Simpler QR code data');
  console.log('\n⚠️  Update GPS coordinates in src/database/DatabaseService.ts');
}

// Generate QR codes
generateAllQRCodes();

