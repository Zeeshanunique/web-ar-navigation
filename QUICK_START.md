# Quick Start Guide

Get the AR Navigation System up and running in 5 minutes!

## Prerequisites Check

- [ ] Node.js installed (v16+)
- [ ] MongoDB installed and running
- [ ] React Native/Expo CLI installed

## Step 1: Install Dependencies

```bash
npm run install:all
```

## Step 2: Configure Backend

```bash
cd backend
```

Create a `.env` file with:
```env
PORT=3000
MONGODB_URI=
NODE_ENV=development
```

## Step 3: Seed Database

```bash
npm run seed:db
```

## Step 4: Start Backend

```bash
npm run start:backend
```

Backend should be running at `http://localhost:3000`

## Step 5: Start Mobile App

```bash
npm run start:mobile
```

Press `a` for Android or `i` for iOS.

## Test the App

1. Open the app
2. Tap "Scan QR to Start"
3. Scan a QR code (or use test data)
4. Select a destination
5. Follow the AR arrows!

## Troubleshooting

**Backend not starting?**
- Check MongoDB is running: `mongod`
- Verify `.env` file exists

**Mobile app errors?**
- Clear cache: `cd mobile && expo start -c`
- Reinstall: `rm -rf node_modules && npm install`

**QR code not scanning?**
- Check camera permissions
- Ensure good lighting
- QR format: `{"locationId": "parking_01"}`

## Next Steps

- Generate QR codes: `npm run generate:qr`
- Customize locations in `scripts/seed-db.js`
- Read full documentation in `SETUP.md`

