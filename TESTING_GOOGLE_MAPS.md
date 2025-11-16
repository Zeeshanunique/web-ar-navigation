# Testing Google Maps API

Quick guide to test your Google Maps API key before using it in the app.

## 🧪 Quick Test

### Method 1: Using npm script
```bash
npm run test:gmaps YOUR_API_KEY_HERE
```

### Method 2: Using environment variable
```bash
GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE npm run test:gmaps
```

### Method 3: Direct execution
```bash
node scripts/test-google-maps.js YOUR_API_KEY_HERE
```

## ✅ What the test checks:

1. **API Connection** - Verifies API key is valid
2. **Directions API** - Tests route calculation
3. **Walking Mode** - Ensures walking directions work
4. **Response Format** - Validates data structure

## 📊 Sample Output

### ✅ **Success:**
```
==========================================================
🗺️  Google Maps API Test
==========================================================

API Key: AIzaSyD...Xyz1
Testing Google Maps Directions API...

📡 Test 1: API Connection...
   ✅ API connection successful!
   Status: OK

🧭 Testing: Public Test Route...
   From: 37.422, -122.0841
   To:   37.4275, -122.1697
   ✅ Route calculated successfully!
   Distance: 5.2 km
   Duration: 1 hour 5 mins
   Steps: 12 turn-by-turn instructions
   Polyline points: 856 characters

   First 3 instructions:
   1. Head north toward Charleston Rd (120 m)
   2. Turn right onto Charleston Rd (650 m)
   3. Turn left onto Rengstorff Ave (1.2 km)

🧭 Testing: Campus Route...
   From: 13.1702, 77.5591
   To:   13.1705, 77.559333
   ✅ Route calculated successfully!
   Distance: 35 m
   Duration: 1 min
   Steps: 1 turn-by-turn instructions

==========================================================
🎉 All Tests Complete!
==========================================================
✅ Google Maps API is working correctly!

Next Steps:
1. Add your API key to src/services/GoogleMapsService.ts
2. Update GPS coordinates in src/database/DatabaseService.ts
3. Run: npm start
4. Test navigation in the app
```

### ❌ **API Key Invalid:**
```
📡 Test 1: API Connection...
   ❌ API request denied!
   Error: The provided API key is invalid.

   Possible issues:
   - API key is invalid
   - Directions API is not enabled
   - API key restrictions are too strict
```

### ⚠️ **No Route Found:**
```
🧭 Testing: Campus Route...
   ⚠️  No route found between these locations
   This might be normal if locations are very close or not connected
```

## 🔧 Common Issues

### Issue 1: REQUEST_DENIED
**Problem:** API key is invalid or Directions API not enabled

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Enabled APIs"
3. Enable "Directions API"
4. Check your API key is correct

### Issue 2: OVER_QUERY_LIMIT
**Problem:** Exceeded free tier quota

**Solution:**
1. Check usage in Google Cloud Console
2. Wait until quota resets (daily)
3. Or upgrade your billing plan

### Issue 3: ZERO_RESULTS
**Problem:** No route exists between locations

**Solution:**
1. Verify GPS coordinates are correct
2. Check if locations are accessible by walking
3. Test with known good coordinates first

### Issue 4: Connection Timeout
**Problem:** Network issues or API not responding

**Solution:**
1. Check internet connection
2. Try again in a few minutes
3. Verify Google Maps API is operational

## 🎯 Test with Your Campus Coordinates

Edit `scripts/test-google-maps.js`:

```javascript
// Update these with your actual campus coordinates
const CAMPUS_PARKING = { lat: 13.170200, lng: 77.559100 };  // Your parking GPS
const CAMPUS_LIBRARY = { lat: 13.170500, lng: 77.559333 };  // Your library GPS
```

Then run test again:
```bash
npm run test:gmaps YOUR_API_KEY
```

## 📍 How to Get Your Campus GPS Coordinates

### Method 1: Google Maps (Web)
1. Go to [maps.google.com](https://maps.google.com)
2. Right-click on your location
3. Click first menu item (coordinates)
4. Copy: `13.170200, 77.559100`

### Method 2: Google Maps (Mobile)
1. Long-press on location
2. View place details
3. Coordinates shown at top

### Method 3: GPS App
1. Install "GPS Status" app
2. Walk to location
3. Note latitude/longitude

## ✅ Checklist Before App Testing

- [ ] Google Maps API key obtained
- [ ] Directions API enabled in Google Cloud
- [ ] Test script passed successfully
- [ ] Campus coordinates verified
- [ ] API key added to `GoogleMapsService.ts`
- [ ] GPS coordinates updated in `DatabaseService.ts`

## 🔗 Resources

- [Google Maps Directions API Docs](https://developers.google.com/maps/documentation/directions)
- [Get API Key](https://console.cloud.google.com/apis/credentials)
- [Check API Status](https://status.cloud.google.com/)

---

**Ready?** Once the test passes, you're all set to use Google Maps in your AR navigation app! 🎉

