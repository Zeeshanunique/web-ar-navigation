const fs = require('fs');
const path = require('path');

// Database locations (from DatabaseService.ts)
const databaseLocations = [
  { id: 'parking_01', name: 'Parking Lot' },
  { id: 'library', name: 'Library' },
  { id: 'cafeteria', name: 'Cafeteria' },
  { id: 'computer_lab', name: 'Computer Lab' },
  { id: 'student_lounge', name: 'Student Lounge' },
  { id: 'classroom_a', name: 'Classroom Block A' },
  { id: 'lab', name: 'Laboratory' },
  { id: 'auditorium', name: 'Auditorium' },
];

// QR codes directory
const qrCodesDir = path.join(__dirname, '../qr-codes');

function verifyQRCodeMatching() {
  console.log('🔍 Verifying QR Code and Database Matching...\n');
  
  let allMatch = true;
  const qrCodeFiles = [];
  const missingQRCodes = [];
  const extraQRCodes = [];

  // Check each database location has a corresponding QR code
  databaseLocations.forEach(location => {
    const qrTextFile = path.join(qrCodesDir, `${location.id}.txt`);
    const qrImageFile = path.join(qrCodesDir, `${location.id}.png`);
    
    if (fs.existsSync(qrTextFile) && fs.existsSync(qrImageFile)) {
      // Read and verify QR data
      const qrData = fs.readFileSync(qrTextFile, 'utf8');
      const expectedData = JSON.stringify({ locationId: location.id });
      
      if (qrData.trim() === expectedData) {
        console.log(`✅ ${location.id} - QR code matches database`);
        qrCodeFiles.push(location.id);
      } else {
        console.log(`❌ ${location.id} - QR data mismatch!`);
        console.log(`   Expected: ${expectedData}`);
        console.log(`   Found:    ${qrData.trim()}`);
        allMatch = false;
      }
    } else {
      console.log(`❌ ${location.id} - Missing QR code files`);
      missingQRCodes.push(location.id);
      allMatch = false;
    }
  });

  // Check for extra QR codes that don't exist in database
  const qrFiles = fs.readdirSync(qrCodesDir)
    .filter(file => file.endsWith('.txt'))
    .map(file => file.replace('.txt', ''));
  
  qrFiles.forEach(qrId => {
    const dbLocation = databaseLocations.find(loc => loc.id === qrId);
    if (!dbLocation) {
      extraQRCodes.push(qrId);
      console.log(`⚠️  ${qrId} - QR code exists but not in database`);
      allMatch = false;
    }
  });

  // Summary
  console.log('\n📊 VERIFICATION SUMMARY:');
  console.log(`   Database Locations: ${databaseLocations.length}`);
  console.log(`   QR Codes Found: ${qrCodeFiles.length}`);
  console.log(`   Missing QR Codes: ${missingQRCodes.length}`);
  console.log(`   Extra QR Codes: ${extraQRCodes.length}`);
  
  if (allMatch) {
    console.log('\n🎉 SUCCESS! All QR codes match database locations perfectly!');
  } else {
    console.log('\n⚠️  Issues found. Please review the mismatches above.');
  }

  return {
    success: allMatch,
    databaseCount: databaseLocations.length,
    qrCodeCount: qrCodeFiles.length,
    missingQRCodes,
    extraQRCodes
  };
}

// Run verification
const result = verifyQRCodeMatching();
process.exit(result.success ? 0 : 1);