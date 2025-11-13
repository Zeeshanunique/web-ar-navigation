const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const Location = require('../backend/src/models/Location');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/web-ar-navigation',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Generate QR codes for all locations
const generateQRCodes = async () => {
  try {
    await connectDB();

    const locations = await Location.find({});
    console.log(`Found ${locations.length} locations`);

    // Ensure output directory exists
    const outputDir = path.join(__dirname, '../frontend/public/qr_codes');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate QR code for each location
    for (const location of locations) {
      const qrData = JSON.stringify({
        locationId: location.locationId,
        timestamp: Date.now(),
      });

      const outputPath = path.join(outputDir, `${location.locationId}.png`);

      await QRCode.toFile(outputPath, qrData, {
        errorCorrectionLevel: 'M',
        type: 'png',
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      console.log(`✓ Generated QR code for ${location.name} (${location.locationId})`);
    }

    console.log(`\n✅ Generated ${locations.length} QR codes in ${outputDir}`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error generating QR codes:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

generateQRCodes();

