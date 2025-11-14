# Setup Guide

This guide will help you set up the AR Navigation System on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cloud)
- **React Native CLI** - Install with: `npm install -g react-native-cli`
- **Expo CLI** - Install with: `npm install -g expo-cli`
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

## Step 1: Clone and Install Dependencies

```bash
# Navigate to project directory
cd web-ar-navigation

# Install all dependencies (mobile + backend)
npm run install:all
```

Or install separately:

```bash
# Install backend dependencies
cd backend
npm install

# Install mobile dependencies
cd ../mobile
npm install
```

## Step 2: Set Up Backend

### 2.1 Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
```

Create a new file named `.env` with the following content:

```env
PORT=3000
MONGODB_URI=
NODE_ENV=development
```

**Note:** If using MongoDB Atlas (cloud), replace `MONGODB_URI` with your Atlas connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ar-navigation
```

### 2.2 Start MongoDB

**Local MongoDB:**
```bash
# macOS/Linux
mongod

# Windows
mongod.exe
```

**MongoDB Atlas:**
- No local setup needed, just use your connection string in `.env`

### 2.3 Seed the Database

```bash
# From project root
npm run seed:db
```

This will populate the database with sample campus locations.

### 2.4 Start Backend Server

```bash
# From project root
npm run start:backend

# Or from backend directory
cd backend
npm run dev
```

The API should now be running at `http://localhost:3000`

## Step 3: Set Up Mobile App

### 3.1 Configure API URL (Optional)

If your backend is running on a different machine or port, update the API URL in:

`mobile/src/services/apiService.js`

```javascript
const API_BASE_URL = __DEV__
  ? 'http://YOUR_IP_ADDRESS:3000/api'  // Replace with your IP
  : 'https://your-backend-url.com/api';
```

**Finding your IP address:**
- **macOS/Linux:** `ifconfig | grep "inet "`
- **Windows:** `ipconfig`

### 3.2 Start Mobile App

```bash
# From project root
npm run start:mobile

# Or from mobile directory
cd mobile
npm start
```

This will start the Expo development server. You can then:

- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator (macOS only)
- Scan the QR code with Expo Go app on your physical device

## Step 4: Generate QR Codes (Optional)

To generate QR codes for campus locations:

```bash
# First install qrcode package
npm install qrcode

# Generate QR codes
npm run generate:qr
```

QR codes will be saved in the `qr-codes/` directory.

## Step 5: Test the Application

1. **Start the backend server** (if not already running)
2. **Start the mobile app**
3. **Open the app** on your device/emulator
4. **Scan a QR code** at a starting location
5. **Select a destination**
6. **Follow the AR navigation arrows**

## Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
- Ensure MongoDB is running: `mongod`
- Check your `MONGODB_URI` in `.env`
- For Atlas, verify your IP is whitelisted

**Port Already in Use:**
- Change `PORT` in `backend/.env`
- Or kill the process using port 3000

### Mobile App Issues

**Camera Permission Denied:**
- Grant camera permission in device settings
- For iOS: Settings > Privacy > Camera > AR Navigation

**Cannot Connect to Backend:**
- Ensure backend is running
- Check API URL in `apiService.js`
- For physical device, use your computer's IP address (not localhost)
- Ensure device and computer are on the same network

**Expo/React Native Errors:**
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### QR Code Issues

**QR Code Not Scanning:**
- Ensure good lighting
- Hold phone steady
- Check QR code is not damaged
- Verify QR code contains valid JSON: `{"locationId": "location_id"}`

## Development Tips

1. **Hot Reload:** Changes to React Native code will automatically reload
2. **Backend Changes:** Restart the server after modifying backend code
3. **Database Changes:** Re-run `npm run seed:db` to reset sample data
4. **Testing:** Use Android emulator or iOS simulator for faster testing

## Next Steps

- Customize campus locations in `scripts/seed-db.js`
- Adjust AR arrow appearance in `mobile/src/components/ARArrow.js`
- Modify pathfinding algorithm in `backend/src/utils/aStarAlgorithm.js`
- Add more features as per your requirements

## Support

For issues or questions, refer to:
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)

