const path = require('path');

// Resolve backend directory path
const backendPath = path.join(__dirname, '../backend');

// Add backend node_modules to module path
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  try {
    return originalRequire.apply(this, arguments);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      try {
        return originalRequire.call(this, path.join(backendPath, 'node_modules', id));
      } catch (e2) {
        throw e;
      }
    }
    throw e;
  }
};

const QRCode = require('qrcode');
const fs = require('fs');

// Sample location data for QR codes
const locations = [
  { id: 'parking_01', name: 'Parking Lot' },
  { id: 'cafeteria', name: 'Cafeteria' },
  { id: 'library', name: 'Library' },
  { id: 'classroom_a', name: 'Classroom Block A' },
  { id: 'lab', name: 'Laboratory' },
  { id: 'auditorium', name: 'Auditorium' },
];

// Create output directory
const outputDir = path.join(__dirname, '../qr-codes');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateQRCode(location) {
  try {
    // QR code data format: JSON string with locationId
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
    
    console.log(`✅ Generated QR code for ${location.name}: ${qrPath}`);
    
    // Also generate a text file with the data
    const txtPath = path.join(outputDir, `${location.id}.txt`);
    fs.writeFileSync(txtPath, qrData);
    
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
  
  console.log(`\n🎉 Generated ${locations.length} QR codes in ${outputDir}`);
  console.log('\n📝 QR Code Data Format:');
  console.log('   { "locationId": "location_id" }');
}

// Check if qrcode package is installed
try {
  require('qrcode');
  generateAllQRCodes();
} catch (error) {
  console.error('❌ QRCode package not found. Installing...');
  console.log('\n💡 To generate QR codes, run:');
  console.log('   npm install qrcode');
  console.log('   Then run: npm run generate:qr');
}

