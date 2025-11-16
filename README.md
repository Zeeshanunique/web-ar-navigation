# AR-Based Indoor Navigation System

A React Native mobile application that provides indoor navigation for college campuses using Augmented Reality (AR) and QR code-based positioning.

## 🎯 Features

- **QR Code Scanning**: Scan QR codes at starting locations to determine exact indoor position
- **A* Pathfinding**: Calculates shortest route using A* algorithm
- **AR Navigation**: Real-time AR directional arrows overlaid on camera feed
- **Destination Selection**: Easy-to-use interface for selecting campus locations
- **Offline Support**: Complete offline functionality with local AsyncStorage database
- **Enhanced AR Experience**: Large, stable AR arrows with sensor smoothing

## 📱 Technology Stack

### Mobile App (React Native/Expo)
- Expo SDK ~54.0.0
- React Native 0.81.5 with TypeScript
- `expo-camera` - Camera access and QR code scanning
- `expo-sensors` - Device orientation/compass/magnetometer
- `@react-native-async-storage/async-storage` - Local data storage
- `react-native-reanimated` - Smooth AR overlays
- React Navigation - App routing

### Database
- AsyncStorage - Local device storage (no backend required!)
- A* pathfinding algorithm for route calculation
- QR code generation scripts for location mapping

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
   npm install
   ```

3. **Generate QR codes**
   ```bash
   npm run generate:qr
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS Simulator / `a` for Android Emulator

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
├── src/                    # React Native app source
│   ├── components/         # Reusable AR components
│   ├── screens/            # App screens (QR, AR Navigation, etc.)
│   ├── services/           # API services (local database)
│   ├── database/           # Local AsyncStorage database service
│   ├── utils/              # Utilities (A* algorithm, navigation)
│   └── types/              # TypeScript type definitions
├── assets/                 # App assets (icons, images)
├── __tests__/              # Unit tests
├── scripts/                # Utility scripts
│   ├── generate-qr.js      # QR code generator
│   ├── verify-qr-db-match.js # QR/DB verification
│   └── clear-app-cache.js  # Cache clearing utility
├── qr-codes/               # Generated QR codes
├── docs/                   # Documentation
├── App.tsx                 # App entry point
├── package.json            # Dependencies and scripts
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
npm test
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

