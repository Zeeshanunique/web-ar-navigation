# Architecture Overview

## System Architecture

```
┌─────────────────┐
│   Web Browser   │
│  (Next.js App)  │
└────────┬────────┘
         │
         │ HTTP/REST API
         │
┌────────▼────────┐
│  Express.js     │
│   Backend       │
└────────┬────────┘
         │
         │ MongoDB Driver
         │
┌────────▼────────┐
│    MongoDB      │
│   Database      │
└─────────────────┘
```

## Component Architecture

### Frontend (Next.js)

```
Pages
├── index.js          # Homepage (QR scan + destination selection)
└── navigation.js     # AR Navigation view

Components
├── CameraFeed.js     # WebRTC camera stream
├── QRScanner.js      # QR code detection using jsQR
├── AROverlay.js      # AR arrows and directions
├── DestinationSelector.js  # Location dropdown
└── RouteInfoCard.js  # Route details display

Hooks
└── useARNavigator.js # AR navigation logic & device orientation

Utils
├── apiClient.js      # Axios HTTP client
└── routeUtils.js    # Route calculation helpers
```

### Backend (Express.js)

```
Routes
├── locationRouter.js  # Location CRUD endpoints
└── routeRouter.js     # Route calculation endpoint

Controllers
├── locationController.js  # Location business logic
└── routeController.js     # Route calculation logic

Models
└── Location.js       # MongoDB schema

Utils
├── aStarAlgorithm.js # A* pathfinding implementation
└── qrGenerator.js    # QR code generation

Config
├── db.js            # MongoDB connection
└── env.js           # Environment variables
```

## Data Flow

### 1. QR Code Scanning Flow

```
User scans QR → QRScanner detects code → 
Extract locationId → API call to /api/locations/qr/:qrId → 
Backend queries MongoDB → Returns location data → 
Frontend sets source location
```

### 2. Route Calculation Flow

```
User selects destination → Frontend calls /api/route → 
Backend fetches all locations → A* algorithm calculates path → 
Returns path with directions → Frontend displays route
```

### 3. AR Navigation Flow

```
Camera feed active → Device orientation API → 
useARNavigator hook calculates arrow angle → 
AROverlay renders arrow → Updates in real-time
```

## Technologies

### Frontend Stack
- **Next.js 14**: React framework with SSR
- **React 18**: UI library
- **jsQR**: QR code detection
- **WebRTC**: Camera access
- **DeviceOrientation API**: Device sensors

### Backend Stack
- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM
- **qrcode**: QR code generation
- **A* Algorithm**: Pathfinding

## Key Algorithms

### A* Pathfinding

The A* algorithm finds the shortest path between two locations:

1. **Heuristic Function**: Euclidean distance between points
2. **Open Set**: Locations to be evaluated
3. **Closed Set**: Locations already evaluated
4. **Cost Function**: `f(n) = g(n) + h(n)`
   - `g(n)`: Actual cost from start to node
   - `h(n)`: Estimated cost from node to goal

### AR Direction Calculation

1. Calculate bearing from current position to next waypoint
2. Get device compass heading (DeviceOrientation API)
3. Calculate relative angle: `bearing - heading`
4. Rotate arrow by relative angle

## Security Considerations

- **CORS**: Configured for specific frontend URL
- **Input Validation**: Validate location IDs and coordinates
- **Error Handling**: Graceful error responses
- **Camera Permissions**: User must grant camera access
- **HTTPS**: Required for camera access in production

## Scalability

### Current Limitations
- Single MongoDB instance
- No caching layer
- No load balancing

### Future Enhancements
- Redis caching for routes
- MongoDB replica set
- CDN for static assets
- WebSocket for real-time updates
- Indoor positioning system (IPS) integration

## Performance Optimizations

1. **Route Caching**: Cache frequently used routes
2. **Lazy Loading**: Load components on demand
3. **Image Optimization**: Optimize QR code images
4. **Database Indexing**: Index on `locationId` and `qrCodeId`
5. **API Rate Limiting**: Prevent abuse

