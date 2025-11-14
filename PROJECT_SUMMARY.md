# AR-Based Indoor Navigation System - Project Summary

## Project Overview

This project implements an **AR-Based Indoor Navigation System** for college campus navigation using QR codes. The system helps students and visitors navigate indoor spaces with visual AR guidance.

## Key Features

✅ **QR Code Scanning** - Scan QR codes at starting locations to determine exact position  
✅ **A* Pathfinding** - Calculates shortest route using A* algorithm  
✅ **AR Navigation** - Real-time AR directional arrows overlaid on camera feed  
✅ **Destination Selection** - Easy-to-use interface for selecting campus locations  
✅ **Offline Support** - Works offline with fallback data after initial sync  

## Technology Stack

### Frontend (Mobile)
- **React Native** with Expo
- **react-native-vision-camera** - Camera access
- **vision-camera-code-scanner** - QR code scanning
- **react-native-sensors** - Device orientation
- **react-native-reanimated** - AR overlays
- **React Navigation** - App routing

### Backend
- **Node.js** + **Express** - RESTful API
- **MongoDB** - Location graph storage
- **Mongoose** - ODM for MongoDB

## Project Structure

```
web-ar-navigation/
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── screens/        # App screens (Home, QR Scanner, Destination, AR Navigation)
│   │   ├── components/     # Reusable components (AR Arrow)
│   │   ├── services/       # API services
│   │   └── utils/          # Utilities (A* algorithm, navigation utils)
│   └── App.js
├── backend/                # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utilities (A* algorithm)
│   └── index.js
├── scripts/                # Utility scripts
│   ├── generate-qr.js      # QR code generator
│   └── seed-db.js          # Database seeding
└── docs/                   # Documentation
    ├── ARCHITECTURE.md
    └── API_REFERENCE.md
```

## How It Works

1. **User scans QR code** at starting location (e.g., Parking)
2. **App determines position** from QR code data
3. **User selects destination** from list (e.g., Library)
4. **Backend calculates route** using A* algorithm
5. **AR arrows guide user** overlaid on camera feed
6. **User follows directions** to reach destination

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up backend:**
   - Create `backend/.env` file
   - Start MongoDB
   - Seed database: `npm run seed:db`
   - Start server: `npm run start:backend`

3. **Start mobile app:**
   ```bash
   npm run start:mobile
   ```

See `SETUP.md` for detailed instructions.

## API Endpoints

- `GET /api/location/:id` - Get location by ID
- `GET /api/location/destinations` - Get all destinations
- `POST /api/route` - Calculate route between locations

See `docs/API_REFERENCE.md` for complete API documentation.

## Key Algorithms

### A* Pathfinding
- Finds shortest path between two nodes in a graph
- Uses Euclidean distance as heuristic
- Implemented in both frontend and backend

### AR Arrow Rendering
- Calculates bearing from current to next waypoint
- Gets device heading from accelerometer
- Rotates arrow based on angle difference

## Sample Data

The system includes sample campus locations:
- Parking Lot
- Library
- Cafeteria
- Classroom Block A
- Laboratory
- Auditorium

## Future Enhancements

- Multi-floor support with automatic floor detection
- Real-time position tracking using step counting
- Integration with campus ERP systems
- 3D AR mapping for better visualization
- Crowd data and traffic estimation

## Documentation

- **README.md** - Project overview and quick start
- **SETUP.md** - Detailed setup instructions
- **docs/ARCHITECTURE.md** - System architecture
- **docs/API_REFERENCE.md** - API documentation

## License

MIT

## Author

University Project - AR Navigation System

