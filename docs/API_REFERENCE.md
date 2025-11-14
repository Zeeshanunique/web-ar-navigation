# API Reference

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-backend-url.com/api
```

## Authentication

Currently, no authentication is required. For production, consider adding API keys or JWT tokens.

## Endpoints

### Get Location by ID

Get location information by QR code ID.

**Endpoint:** `GET /api/location/:id`

**Parameters:**
- `id` (path parameter): Location ID (e.g., "parking_01")

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "parking_01",
    "name": "Parking Lot",
    "x": 10,
    "y": 5,
    "floor": 1,
    "category": "Parking",
    "icon": "🅿️",
    "isDestination": true,
    "connections": ["cafeteria", "classroom_a"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Location not found"
}
```

---

### Get All Destinations

Get a list of all available destinations.

**Endpoint:** `GET /api/location/destinations`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "library",
      "name": "Library",
      "category": "Academic",
      "icon": "📚"
    },
    {
      "id": "cafeteria",
      "name": "Cafeteria",
      "category": "Food",
      "icon": "🍽️"
    }
  ]
}
```

---

### Get All Locations

Get all locations (including waypoints).

**Endpoint:** `GET /api/location`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "parking_01",
      "name": "Parking Lot",
      "x": 10,
      "y": 5,
      "floor": 1,
      "category": "Parking",
      "icon": "🅿️",
      "isDestination": true,
      "connections": ["cafeteria", "classroom_a"]
    },
    {
      "id": "junction_1",
      "name": "Junction 1",
      "x": 11,
      "y": 7,
      "floor": 1,
      "category": "Other",
      "icon": "📍",
      "isDestination": false,
      "connections": ["parking_01", "cafeteria"]
    }
  ]
}
```

---

### Create Location

Create a new location (admin function).

**Endpoint:** `POST /api/location`

**Request Body:**
```json
{
  "id": "new_location",
  "name": "New Location",
  "x": 15,
  "y": 10,
  "floor": 1,
  "category": "Academic",
  "icon": "📍",
  "isDestination": true,
  "connections": ["library", "cafeteria"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new_location",
    "name": "New Location",
    "x": 15,
    "y": 10,
    "floor": 1,
    "category": "Academic",
    "icon": "📍",
    "isDestination": true,
    "connections": ["library", "cafeteria"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Location ID already exists"
}
```

---

### Calculate Route

Calculate the shortest path between two locations using A* algorithm.

**Endpoint:** `POST /api/route`

**Request Body:**
```json
{
  "source": "parking_01",
  "destination": "library"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "path": [
      { "x": 10, "y": 5 },
      { "x": 11, "y": 7 },
      { "x": 12, "y": 10 },
      { "x": 16, "y": 14 }
    ],
    "distance": 8.5,
    "steps": 4,
    "source": {
      "id": "parking_01",
      "name": "Parking Lot",
      "x": 10,
      "y": 5
    },
    "destination": {
      "id": "library",
      "name": "Library",
      "x": 16,
      "y": 14
    }
  }
}
```

**Error Responses:**

**400 - Missing Parameters:**
```json
{
  "success": false,
  "message": "Source and destination are required"
}
```

**404 - Location Not Found:**
```json
{
  "success": false,
  "message": "Source location 'parking_01' not found"
}
```

**404 - No Path Found:**
```json
{
  "success": false,
  "message": "No path found between source and destination"
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Currently, no rate limiting is implemented. For production, consider adding rate limiting to prevent abuse.

## CORS

CORS is enabled for all origins in development. For production, configure allowed origins:

```javascript
app.use(cors({
  origin: ['https://your-app-domain.com'],
  credentials: true
}));
```

## Data Models

### Location Schema

```javascript
{
  id: String (required, unique),
  name: String (required),
  x: Number (required),
  y: Number (required),
  floor: Number (default: 1),
  category: String (enum: ['Academic', 'Food', 'Parking', 'Events', 'Administrative', 'Other']),
  icon: String (default: '📍'),
  isDestination: Boolean (default: true),
  connections: [String] (array of location IDs),
  createdAt: Date,
  updatedAt: Date
}
```

## Example Usage

### JavaScript/React Native

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Get location
const location = await axios.get(`${API_BASE_URL}/location/parking_01`);

// Get destinations
const destinations = await axios.get(`${API_BASE_URL}/location/destinations`);

// Calculate route
const route = await axios.post(`${API_BASE_URL}/route`, {
  source: 'parking_01',
  destination: 'library'
});
```

### cURL

```bash
# Get location
curl http://localhost:3000/api/location/parking_01

# Get destinations
curl http://localhost:3000/api/location/destinations

# Calculate route
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"source": "parking_01", "destination": "library"}'
```

## Testing

Use tools like Postman, Insomnia, or cURL to test the API endpoints.

Example test sequence:
1. Start backend server
2. Seed database: `npm run seed:db`
3. Test endpoints using the examples above

