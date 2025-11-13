# API Reference

## Base URL
```
http://localhost:5000/api
```

## Endpoints

### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running"
}
```

---

### Get All Locations
```
GET /api/locations
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "locationId": "parking",
      "name": "Parking Area",
      "coordinates": { "x": 0, "y": 0, "z": 0 },
      "qrCodeId": "parking-qr",
      "description": "Main parking area",
      "floor": 0,
      "connections": [
        { "locationId": "entrance", "distance": 50 }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Location by QR Code ID
```
GET /api/locations/qr/:qrId
```

**Parameters:**
- `qrId` (path): QR code identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "locationId": "parking",
    "name": "Parking Area",
    "coordinates": { "x": 0, "y": 0, "z": 0 },
    "qrCodeId": "parking-qr",
    "description": "Main parking area",
    "floor": 0,
    "connections": [...],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Location not found"
}
```

---

### Get Location by Location ID
```
GET /api/locations/:locationId
```

**Parameters:**
- `locationId` (path): Location identifier

**Response:** Same as above

---

### Create Location
```
POST /api/locations
```

**Request Body:**
```json
{
  "locationId": "new-location",
  "name": "New Location",
  "coordinates": { "x": 100, "y": 200, "z": 0 },
  "qrCodeId": "new-location-qr",
  "description": "Description here",
  "floor": 0,
  "connections": [
    { "locationId": "parking", "distance": 150 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "locationId": "new-location",
    "name": "New Location",
    ...
  }
}
```

---

### Calculate Route
```
POST /api/route
```

**Request Body:**
```json
{
  "source": "parking",
  "destination": "library"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "path": [
      {
        "locationId": "parking",
        "name": "Parking Area",
        "coordinates": { "x": 0, "y": 0, "z": 0 },
        "direction": "east",
        "isDestination": false
      },
      {
        "locationId": "entrance",
        "name": "Main Entrance",
        "coordinates": { "x": 50, "y": 0, "z": 0 },
        "direction": "northeast",
        "isDestination": false
      },
      {
        "locationId": "library",
        "name": "Library",
        "coordinates": { "x": 140, "y": 0, "z": 0 },
        "direction": null,
        "isDestination": true
      }
    ],
    "distance": 110,
    "steps": 2
  }
}
```

**Error Responses:**

400 - Missing parameters:
```json
{
  "success": false,
  "error": "Source and destination are required"
}
```

404 - No path found:
```json
{
  "success": false,
  "error": "No path found between locations"
}
```

---

## Error Format

All error responses follow this format:
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "stack": "..." // Only in development mode
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

