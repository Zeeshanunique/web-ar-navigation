# Quick Setup Instructions

## 1. Install Dependencies

```bash
# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && npm install && cd ..
```

## 2. Configure Backend Environment

Create `backend/.env` file with:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/web-ar-navigation
FRONTEND_URL=http://localhost:3000
QR_CODE_SIZE=256
```

## 3. Start MongoDB

Make sure MongoDB is running on your system.

## 4. Seed Database

```bash
cd backend && npm run seed && cd ..
```

## 5. Generate QR Codes

```bash
cd scripts && node generate-qr.js && cd ..
```

## 6. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend && npm run dev
```

## 7. Open Browser

Navigate to `http://localhost:3000`

---

For detailed setup instructions, see [docs/setup-guide.md](./docs/setup-guide.md)

