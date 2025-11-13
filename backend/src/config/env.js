require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/web-ar-navigation',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  QR_CODE_SIZE: parseInt(process.env.QR_CODE_SIZE) || 256,
};

