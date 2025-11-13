# Setup Guide

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cloud)

## Step-by-Step Setup

### 1. Clone/Navigate to Project

```bash
cd web-ar-navigation
```

### 2. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

### 3. Set Up MongoDB

**Option A: Local MongoDB**
1. Install MongoDB locally
2. Start MongoDB service:
   ```bash
   # macOS (using Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   # Start MongoDB from Services
   ```

**Option B: MongoDB Atlas (Cloud)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in backend `.env` file

### 4. Configure Environment Variables

**Backend:**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/web-ar-navigation
FRONTEND_URL=http://localhost:3000
QR_CODE_SIZE=256
```

**Frontend:**
Create `frontend/.env.local` (optional):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 5. Seed the Database

```bash
cd backend
npm run seed
```

This will create sample locations (Parking, Entrance, Library, etc.)

### 6. Generate QR Codes

```bash
cd scripts
node generate-qr.js
```

This generates QR code images in `frontend/public/qr_codes/`

### 7. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

### 8. Test the Application

1. Open `http://localhost:3000` in a browser (preferably mobile for AR features)
2. Grant camera permissions
3. Scan a QR code (you can print the generated QR codes)
4. Select a destination
5. Start navigation!

## Troubleshooting

### Camera Not Working

- Ensure you're using HTTPS or localhost (required for camera access)
- Check browser permissions for camera access
- Try a different browser (Chrome/Firefox recommended)

### MongoDB Connection Error

- Verify MongoDB is running: `mongosh` or check service status
- Check `MONGODB_URI` in `.env` file
- Ensure MongoDB is accessible on the specified port (default: 27017)

### QR Code Not Scanning

- Ensure good lighting
- Hold camera steady
- Check QR code is in focus
- Verify QR code contains valid JSON with `locationId`

### CORS Errors

- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check backend CORS configuration in `backend/src/index.js`

### Port Already in Use

- Change `PORT` in backend `.env`
- Or kill the process using the port:
  ```bash
  # macOS/Linux
  lsof -ti:5000 | xargs kill
  ```

## Production Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy

### Backend (Render/Railway)

1. Push code to GitHub
2. Create new service
3. Set environment variables from `.env`
4. Deploy

### Database (MongoDB Atlas)

1. Create cluster
2. Get connection string
3. Update `MONGODB_URI` in production environment

## Next Steps

- Customize locations for your use case
- Adjust coordinates to match your building layout
- Add more locations and connections
- Enhance AR overlay with custom graphics
- Integrate with indoor positioning systems (IPS) for accurate tracking

