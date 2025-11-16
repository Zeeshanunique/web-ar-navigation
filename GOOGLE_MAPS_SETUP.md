# Google Maps AR Navigation - Setup Guide

This guide explains how to set up and use **QR + Google Maps API** navigation in your AR app.

## 📋 Overview

**How it Works:**
1. **User scans QR code** → Gets starting GPS position (e.g., 13°10'12.2"N, 77°33'33.6"E)
2. **Selects destination** → App has destination GPS coordinates
3. **Google Maps Directions API** → Calculates optimal route
4. **AR overlay navigation** → Displays route arrows on camera view
5. **Real-time GPS tracking** → Follows user along the route
6. **Auto-arrival detection** → Alerts when destination reached

**Benefits:**
- ✅ Professional routing (sidewalks, stairs, accessibility)
- ✅ Turn-by-turn instructions
- ✅ Real-time traffic/construction updates
- ✅ Works both indoors and outdoors
- ✅ No need to manually map routes

---

## 🔑 Step 1: Get Google Maps API Key

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "AR Navigation App")
4. Click "Create"

### 1.2 Enable APIs

1. Go to "APIs & Services" → "Enable APIs and Services"
2. Search for "Directions API"
3. Click "Enable"
4. Also enable:
   - Maps SDK for Android (if building for Android)
   - Maps SDK for iOS (if building for iOS)

### 1.3 Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy your API key (e.g., `AIzaSyD...`)
4. Click "Restrict Key" (recommended):
   - Application restrictions: Choose "iOS apps" or "Android apps"
   - API restrictions: Select "Directions API"

### 1.4 Add API Key to Your App

**Option A: Environment Variable**
```bash
# Create .env file (add to .gitignore!)
echo "GOOGLE_MAPS_API_KEY=AIzaSyD..." > .env
```

**Option B: Direct Configuration**
Open `src/services/GoogleMapsService.ts` and replace:
```typescript
apiKey: 'YOUR_API_KEY_HERE'
```
with:
```typescript
apiKey: 'AIzaSyD...'  // Your actual API key
```

⚠️ **Security Note:** Never commit API keys to Git! Use environment variables in production.

---

## 📍 Step 2: Add GPS Coordinates to Your Locations

### 2.1 Find Your Campus GPS Coordinates

**Method 1: Google Maps**
1. Go to [Google Maps](https://maps.google.com)
2. Right-click on your location (e.g., Parking Lot)
3. Click first item in menu (coordinates)
4. Copy coordinates: `13.170200, 77.559100`

**Method 2: GPS App on Phone**
1. Install "GPS Status" or similar app
2. Walk to each location
3. Note down latitude and longitude

### 2.2 Update Location Database

Edit `src/database/DatabaseService.ts`:

```typescript
{
  id: 'parking_01',
  name: 'Parking Lot',
  x: 10,
  y: 5,
  latitude: 13.170200,   // ← Add your actual GPS coordinates
  longitude: 77.559100,  // ← Add your actual GPS coordinates
  floor: 1,
  // ...
}
```

Update ALL locations with their actual GPS coordinates.

---

## 🔲 Step 3: Generate QR Codes with GPS Data

### 3.1 Update QR Generator Script

The script is already updated! Just verify coordinates in:
```
scripts/generate-qr.js
```

### 3.2 Generate QR Codes

```bash
npm run generate:qr
```

This creates QR codes in `qr-codes/` directory with format:
```json
{
  "locationId": "parking_01",
  "latitude": 13.170200,
  "longitude": 77.559100
}
```

### 3.3 Print and Place QR Codes

1. Print QR codes (preferably waterproof/laminated)
2. Place at entrance of each location:
   - Height: ~1.5m (eye level)
   - Visible and accessible
   - Protected from weather
3. Add sign: "Scan for Navigation"

---

## 🧭 Step 4: Test Navigation

### 4.1 Basic Test

1. Start app: `npm start`
2. Scan QR code at Parking
3. Select destination (e.g., Library)
4. App should:
   - Show "Calculating route with Google Maps..."
   - Display route with AR arrows
   - Show turn-by-turn instructions
   - Track your GPS position

### 4.2 Check GPS Accuracy

The app shows GPS accuracy in bottom panel:
```
GPS Accuracy: ±5m  ✅ Good
GPS Accuracy: ±15m ⚠️  OK
GPS Accuracy: ±30m ❌ Poor (won't work well)
```

### 4.3 Troubleshooting

**Issue: "Google Maps API key not configured"**
- Add your API key in `GoogleMapsService.ts`

**Issue: "Failed to get directions"**
- Check internet connection
- Verify API key is valid
- Check if Directions API is enabled in Google Cloud

**Issue: "GPS accuracy too low"**
- Go outdoors (GPS doesn't work indoors)
- Wait for GPS to acquire satellites (~30 seconds)
- Enable high-accuracy GPS in phone settings

**Issue: "No route found"**
- Verify GPS coordinates are correct
- Check if locations are too far apart
- Make sure coordinates are in decimal degrees format

---

## 🎯 Step 5: Using the Navigation

### User Flow

**1. Scan Starting Location**
```
User at Parking → Scans QR code
App: "You are at Parking Lot (13.17°N, 77.56°E)"
```

**2. Select Destination**
```
User selects: "Library"
App: Calculating route...
```

**3. AR Navigation**
```
Screen shows:
- AR arrows pointing direction
- Distance remaining: "150m"
- Instruction: "Turn left onto Main Path"
- GPS accuracy: "±8m"
```

**4. Follow Route**
```
App updates in real-time:
- AR arrows adjust as you move
- Instructions change at turns
- Distance counts down
```

**5. Arrival**
```
When within 10m of destination:
Alert: "🎉 Destination Reached! You have arrived at Library"
```

---

## ⚙️ Configuration

### Adjust Arrival Threshold

In `GoogleMapsARNavigationScreen.tsx`:
```typescript
const ARRIVAL_THRESHOLD = 10; // meters (default)
// Change to 20 for less precision, 5 for more
```

### GPS Update Frequency

In `GoogleMapsARNavigationScreen.tsx`:
```typescript
const GPS_UPDATE_INTERVAL = 2000; // ms (default: 2 seconds)
// Lower = more frequent updates, higher battery drain
```

### Navigation Mode

Google Maps supports different travel modes:
```typescript
const route = await googleMapsService.getDirections(
  origin,
  destination,
  'walking'  // 'walking' | 'driving' | 'bicycling' | 'transit'
);
```

---

## 💰 Google Maps API Costs

### Free Tier
- **$200 free credit per month**
- Directions API: $5 per 1000 requests
- Free tier = ~40,000 requests/month

### For Small Campus (500 students)
- Average: 4 navigation requests per student per day
- Monthly: 500 × 4 × 30 = 60,000 requests
- Cost: 60,000 / 1000 × $5 = $300/month
- With free credit: $100/month

### Optimization Tips
1. **Cache routes**: Same route doesn't need recalculation
2. **Limit to campus**: Restrict origin/destination to campus bounds
3. **Batch requests**: Combine similar requests
4. **Use quotas**: Set daily limits in Google Cloud Console

---

## 🎨 Customization

### Custom AR Arrows

Edit `src/components/EnhancedARPathOverlay.tsx`:
- Change arrow colors
- Adjust size/scale
- Modify animation

### Custom Instructions UI

Edit `GoogleMapsARNavigationScreen.tsx`:
- Modify instruction panel style
- Add voice guidance
- Change control buttons

### Localization

Add multi-language support:
```typescript
// In GoogleMapsService.ts
const params = {
  // ...
  language: 'en',  // 'en' | 'es' | 'fr' | 'hi' | etc.
};
```

---

## 🔧 Advanced Features

### Feature: Voice Navigation

Add text-to-speech for instructions:
```bash
npm install expo-speech
```

```typescript
import * as Speech from 'expo-speech';

// When instruction changes
Speech.speak(currentInstruction);
```

### Feature: Offline Maps

For areas with poor connectivity, cache routes:
```typescript
// In GoogleMapsService.ts
const cachedRoutes = new Map();

// Before API call
const cacheKey = `${origin.lat},${origin.lng}-${dest.lat},${dest.lng}`;
if (cachedRoutes.has(cacheKey)) {
  return cachedRoutes.get(cacheKey);
}
```

### Feature: Real-time Updates

Handle route recalculation if user goes off-route:
```typescript
// Check if user is far from route
const distanceFromRoute = calculateDistanceToNearestWaypoint();
if (distanceFromRoute > 20) {
  // Recalculate route from current position
  recalculateRoute();
}
```

---

## 📱 Deployment

### iOS

1. Add location permissions to `app.json`:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "We need your location for AR navigation",
        "NSCameraUsageDescription": "We need camera access for AR navigation"
      }
    }
  }
}
```

### Android

1. Add permissions to `app.json`:
```json
{
  "expo": {
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "CAMERA"
      ]
    }
  }
}
```

---

## ✅ Checklist

Before going live:

- [ ] Google Maps API key configured
- [ ] All locations have GPS coordinates
- [ ] QR codes generated and placed
- [ ] Tested navigation outdoors
- [ ] Tested navigation on different devices
- [ ] Set API usage limits in Google Cloud
- [ ] App permissions configured
- [ ] Error handling tested
- [ ] Arrival detection verified
- [ ] Battery usage optimized

---

## 📚 Additional Resources

- [Google Maps Directions API Docs](https://developers.google.com/maps/documentation/directions)
- [Expo Location Docs](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo Camera Docs](https://docs.expo.dev/versions/latest/sdk/camera/)

---

## 🆘 Support

**Common Issues:**
- API not working: Check API key and enabled APIs
- Poor GPS: Use outdoors, wait for signal
- No route: Verify coordinates are correct
- High costs: Implement caching, set quotas

**Need Help?**
- Check logs: `npx expo start --dev-client`
- Test API directly: Use Postman with Directions API
- Verify GPS: Use GPS test app on phone

---

**🎉 You're all set! Your AR app now has professional Google Maps navigation!**

