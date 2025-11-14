# System Architecture

## Overview

The AR Navigation System is built with a **client-server architecture**:

- **Mobile App (React Native)**: Frontend application for users
- **Backend API (Node.js/Express)**: Server for route calculation and data management
- **Database (MongoDB)**: Stores location graph and campus data

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   QR     │  │   AR     │  │  Route   │             │
│  │ Scanner  │→ │ Overlay  │← │ Display  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│       │              │              │                  │
│       └──────────────┼──────────────┘                  │
│                      │                                 │
│              ┌───────▼────────┐                        │
│              │  API Service   │                        │
│              └───────┬────────┘                        │
└──────────────────────┼──────────────────────────────────┘
                       │ HTTP/REST
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Backend API (Express)                      │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  Location    │  │   Route      │                    │
│  │  Controller  │  │  Controller  │                    │
│  └──────┬───────┘  └──────┬───────┘                    │
│         │                 │                            │
│         └────────┬────────┘                            │
│                  │                                      │
│         ┌────────▼────────┐                            │
│         │  A* Algorithm   │                            │
│         └────────┬────────┘                            │
│                  │                                      │
│         ┌────────▼────────┐                            │
│         │  Location Model │                            │
│         └────────┬────────┘                            │
└──────────────────┼──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│              MongoDB Database                            │
│  ┌──────────────────────────────────────┐              │
│  │         Locations Collection          │              │
│  │  - id, name, x, y, connections       │              │
│  └──────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Mobile App Components

#### 1. **Screens**
- `HomeScreen`: Main entry point with navigation options
- `QRScannerScreen`: Camera view for scanning QR codes
- `DestinationScreen`: List of available destinations
- `ARNavigationScreen`: AR overlay with directional arrows

#### 2. **Components**
- `ARArrow`: SVG arrow component that rotates based on device orientation

#### 3. **Services**
- `apiService`: Handles all API communication with backend
  - `getLocationById()`: Fetch location data from QR code
  - `getDestinations()`: Get list of available destinations
  - `calculateRoute()`: Request route calculation from backend

#### 4. **Utils**
- `aStarAlgorithm.js`: Client-side A* implementation (for offline mode)
- `navigationUtils.js`: Helper functions for bearing calculation, distance, etc.

### Backend Components

#### 1. **Controllers**
- `locationController.js`: Handles location-related requests
  - `getLocationById()`: Get location by ID
  - `getDestinations()`: Get all destinations
  - `getAllLocations()`: Get all locations
  - `createLocation()`: Create new location

- `routeController.js`: Handles route calculation
  - `calculateRoute()`: Calculate shortest path using A*

#### 2. **Models**
- `Location.js`: MongoDB schema for locations
  - Fields: id, name, x, y, floor, category, icon, connections

#### 3. **Utils**
- `aStarAlgorithm.js`: Server-side A* pathfinding implementation

#### 4. **Routes**
- `locationRouter.js`: Routes for location endpoints
- `routeRouter.js`: Routes for route calculation

## Data Flow

### 1. QR Code Scanning Flow

```
User scans QR → QRScannerScreen detects code
    ↓
Extract locationId from QR data
    ↓
API call: GET /api/location/:id
    ↓
Backend queries MongoDB
    ↓
Return location data (x, y coordinates)
    ↓
Navigate to DestinationScreen with current location
```

### 2. Route Calculation Flow

```
User selects destination
    ↓
API call: POST /api/route { source, destination }
    ↓
Backend fetches all locations from MongoDB
    ↓
Build graph from locations and connections
    ↓
Run A* algorithm to find shortest path
    ↓
Return path array: [{x, y}, {x, y}, ...]
    ↓
Navigate to ARNavigationScreen with path
```

### 3. AR Navigation Flow

```
ARNavigationScreen displays camera feed
    ↓
Calculate bearing from current waypoint to next
    ↓
Get device heading from accelerometer/compass
    ↓
Calculate angle difference (bearing - heading)
    ↓
Render ARArrow rotated by angle difference
    ↓
User follows arrow direction
    ↓
(Optional) Scan another QR to recalibrate position
```

## Graph Structure

The campus is represented as a **graph** where:

- **Nodes**: Locations (parking, library, cafeteria, etc.)
- **Edges**: Walkable paths between locations
- **Weights**: Euclidean distance between connected nodes

### Example Graph

```
parking_01 (10, 5)
    │
    ├──→ junction_1 (11, 7)
    │       │
    │       ├──→ cafeteria (12, 10)
    │       │       │
    │       │       ├──→ library (16, 14)
    │       │       │
    │       │       └──→ classroom_a (8, 12)
    │       │
    │       └──→ ...
```

## A* Algorithm

The A* algorithm finds the shortest path by:

1. **Starting Node**: Current location (from QR scan)
2. **Goal Node**: Selected destination
3. **Heuristic**: Euclidean distance (h)
4. **Cost Function**: g(n) = cost from start to node n
5. **Total Cost**: f(n) = g(n) + h(n)

### Algorithm Steps

```
1. Initialize open set with start node
2. While open set is not empty:
   a. Select node with lowest f score
   b. If node is goal, reconstruct path
   c. Move node to closed set
   d. For each neighbor:
      - Calculate g and h
      - Add to open set if not already evaluated
3. Return path or null if no path found
```

## API Endpoints

### Location Endpoints

- `GET /api/location/:id` - Get location by ID
- `GET /api/location/destinations` - Get all destinations
- `GET /api/location` - Get all locations
- `POST /api/location` - Create new location

### Route Endpoints

- `POST /api/route` - Calculate route
  - Request: `{ source: "parking_01", destination: "library" }`
  - Response: `{ path: [{x, y}, ...], distance: 10.5, steps: 4 }`

## Offline Mode

The mobile app includes **fallback data** for offline operation:

- Predefined locations in `apiService.js`
- Simple straight-line path calculation
- Limited functionality but still usable

## Security Considerations

1. **Input Validation**: All API inputs are validated
2. **Error Handling**: Comprehensive error handling at all levels
3. **CORS**: Configured for development (adjust for production)
4. **Environment Variables**: Sensitive data stored in `.env`

## Scalability

- **Database Indexing**: Locations indexed by id, x, y
- **Graph Caching**: Consider caching graph structure
- **API Rate Limiting**: Add rate limiting for production
- **CDN**: Serve static assets via CDN

## Future Enhancements

1. **Multi-floor Support**: Add floor detection and vertical navigation
2. **Real-time Updates**: WebSocket for live position updates
3. **User Tracking**: Track user position using step counting
4. **Crowd Data**: Integrate real-time traffic information
5. **3D AR**: Upgrade to full 3D AR mapping

