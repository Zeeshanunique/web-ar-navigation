# AR-Based Indoor Navigation System

A React Native mobile application that provides indoor navigation for college campuses using Augmented Reality (AR) and QR code-based positioning.

## 🎯 Features

- **QR Code Scanning**: Scan QR codes at starting locations to determine exact indoor position
- **A* Pathfinding**: Calculates shortest route using A* algorithm
- **AR Navigation**: Real-time AR directional arrows overlaid on camera feed
- **Destination Selection**: Easy-to-use interface for selecting campus locations
- **Offline Support**: Works offline after initial data sync

## 📱 Technology Stack

### Mobile App (React Native)
- React Native CLI
- `react-native-vision-camera` - Camera access
- `vision-camera-code-scanner` - QR code scanning
- `react-native-sensors` - Device orientation/compass
- `react-native-reanimated` - Smooth AR overlays
- React Navigation - App routing

### Backend
- Node.js + Express
- MongoDB - Location graph storage
- RESTful API for route calculation

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- MongoDB (local or cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd web-ar-navigation
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**

   Create `backend/.env`:
   ```env
   PORT=3000
   MONGODB_URI=
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Seed the database**
   ```bash
   npm run seed:db
   ```

6. **Start the backend server**
   ```bash
   npm run start:backend
   ```

7. **Start the mobile app**
   ```bash
   cd mobile
   npm start
   ```

   Then press `a` for Android or `i` for iOS.

## 📁 Project Structure

```
web-ar-navigation/
├── mobile/                 # React Native app
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── screens/        # App screens
│   │   ├── navigation/     # Navigation setup
│   │   ├── services/       # API services
│   │   ├── utils/          # Utilities (A* algorithm, etc.)
│   │   └── hooks/          # Custom React hooks
│   ├── App.js
│   └── package.json
├── backend/                # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utilities (A* algorithm)
│   │   └── index.js        # Server entry point
│   └── package.json
├── scripts/                # Utility scripts
│   ├── generate-qr.js      # QR code generator
│   └── seed-db.js          # Database seeding
└── README.md
```

## 🎮 Usage

1. **Open the app** and grant camera permissions
2. **Scan a QR code** at your starting location (e.g., Parking)
3. **Select your destination** from the list (e.g., Library)
4. **Follow the AR arrows** overlaid on your camera feed
5. **Scan another QR code** if you need to recalibrate your position

## 🧪 Testing

### Unit Tests
```bash
cd mobile && npm test
cd backend && npm test
```

### Integration Testing
- Test QR scanning → navigation flow
- Verify A* pathfinding accuracy
- Test AR overlay responsiveness

## 📊 API Endpoints

### `GET /api/location/:id`
Get location coordinates by QR code ID

### `POST /api/route`
Calculate shortest path between two locations
```json
{
  "source": "parking_01",
  "destination": "library"
}
```

## 🛠️ Development

### Generate QR Codes
```bash
npm run generate:qr
```

### Database Seeding
```bash
npm run seed:db
```

## 📝 License

MIT

## 👥 Contributors

University Project - AR Navigation System

