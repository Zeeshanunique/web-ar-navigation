# 🧭 Web-Based AR Navigation System

A complete WebAR navigation system using QR codes and camera-based AR overlays for indoor/outdoor navigation.

## 🚀 Features

- **QR Code Scanning**: Scan QR codes to set your starting location
- **AR Navigation**: Real-time AR overlays with directional arrows
- **A* Pathfinding**: Intelligent shortest path calculation
- **WebRTC Camera**: Direct camera access via WebRTC
- **Device Orientation**: Uses device sensors for accurate AR positioning
- **Responsive Design**: Works on mobile and desktop browsers

## 📁 Project Structure

```
web-ar-navigation/
├── frontend/          # Next.js WebAR Frontend
├── backend/           # Express.js Backend
├── docs/              # Documentation
└── scripts/           # Utility scripts
```

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, Three.js, AR.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **QR Detection**: jsQR
- **AR**: WebRTC + DeviceOrientation API

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud instance)

### Setup

1. **Clone and navigate to the project:**
   ```bash
   cd web-ar-navigation
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd ../backend
   npm install
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and other settings
   ```

5. **Seed the database with sample locations:**
   ```bash
   npm run seed
   ```

6. **Generate QR codes for locations:**
   ```bash
   cd ../scripts
   node generate-qr.js
   ```

## 🚀 Running the Application

### Development Mode

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```
   Backend runs on `http://localhost:5000`

2. **Start the frontend (in a new terminal):**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on `http://localhost:3000`

### Production Build

```bash
# Frontend
cd frontend
npm run build
npm start

# Backend
cd backend
npm start
```

## 📱 Usage Flow

1. Open the web app in a browser (preferably mobile for AR features)
2. Grant camera permissions when prompted
3. Scan a QR code at your starting location
4. Select a destination from the dropdown
5. Follow the AR arrows to navigate
6. Scan the destination QR code to complete navigation

## 🔧 Configuration

### Backend Environment Variables

- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `FRONTEND_URL`: Frontend URL for CORS
- `QR_CODE_SIZE`: Size of generated QR codes

### Frontend Configuration

Update `frontend/utils/apiClient.js` with your backend URL if different from default.

## 📚 API Endpoints

### GET `/api/locations`
Get all available locations

### GET `/api/locations/:qrId`
Get location details by QR code ID

### POST `/api/route`
Calculate route between two locations
```json
{
  "source": "parking",
  "destination": "library"
}
```

## 🧪 Testing

1. Ensure MongoDB is running
2. Seed the database: `cd backend && npm run seed`
3. Generate QR codes: `cd scripts && node generate-qr.js`
4. Start both servers
5. Open `http://localhost:3000` in a mobile browser

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.

