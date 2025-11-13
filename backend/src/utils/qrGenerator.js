const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * Generate QR code for a location
 * @param {string} locationId - Location identifier
 * @param {string} outputPath - Path to save QR code image
 * @returns {Promise<string>} - Path to generated QR code
 */
async function generateQRCode(locationId, outputPath) {
  try {
    const qrData = JSON.stringify({ locationId, timestamp: Date.now() });
    
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

    console.log(`QR code generated: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate QR code and return as data URL
 * @param {string} locationId - Location identifier
 * @returns {Promise<string>} - Data URL of QR code
 */
async function generateQRCodeDataURL(locationId) {
  try {
    const qrData = JSON.stringify({ locationId, timestamp: Date.now() });
    const dataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      width: 256,
      margin: 2,
    });
    return dataURL;
  } catch (error) {
    console.error('Error generating QR code data URL:', error);
    throw error;
  }
}

module.exports = {
  generateQRCode,
  generateQRCodeDataURL,
};

