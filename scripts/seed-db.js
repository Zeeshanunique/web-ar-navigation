const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const Location = require('../backend/src/models/Location');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/web-ar-navigation',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample locations data (campus example)
const sampleLocations = [
  {
    locationId: 'parking',
    name: 'Parking Area',
    coordinates: { x: 0, y: 0, z: 0 },
    qrCodeId: 'parking-qr',
    description: 'Main parking area',
    floor: 0,
    connections: [
      { locationId: 'entrance', distance: 50 },
      { locationId: 'cafeteria', distance: 100 },
    ],
  },
  {
    locationId: 'entrance',
    name: 'Main Entrance',
    coordinates: { x: 50, y: 0, z: 0 },
    qrCodeId: 'entrance-qr',
    description: 'Main building entrance',
    floor: 0,
    connections: [
      { locationId: 'parking', distance: 50 },
      { locationId: 'lobby', distance: 30 },
      { locationId: 'cafeteria', distance: 80 },
    ],
  },
  {
    locationId: 'lobby',
    name: 'Lobby',
    coordinates: { x: 80, y: 0, z: 0 },
    qrCodeId: 'lobby-qr',
    description: 'Main lobby area',
    floor: 0,
    connections: [
      { locationId: 'entrance', distance: 30 },
      { locationId: 'library', distance: 60 },
      { locationId: 'elevator', distance: 40 },
    ],
  },
  {
    locationId: 'library',
    name: 'Library',
    coordinates: { x: 140, y: 0, z: 0 },
    qrCodeId: 'library-qr',
    description: 'Main library',
    floor: 0,
    connections: [
      { locationId: 'lobby', distance: 60 },
      { locationId: 'classroom-a', distance: 50 },
    ],
  },
  {
    locationId: 'cafeteria',
    name: 'Cafeteria',
    coordinates: { x: 50, y: 100, z: 0 },
    qrCodeId: 'cafeteria-qr',
    description: 'Cafeteria and dining area',
    floor: 0,
    connections: [
      { locationId: 'parking', distance: 100 },
      { locationId: 'entrance', distance: 80 },
      { locationId: 'gym', distance: 70 },
    ],
  },
  {
    locationId: 'gym',
    name: 'Gymnasium',
    coordinates: { x: 50, y: 170, z: 0 },
    qrCodeId: 'gym-qr',
    description: 'Sports and fitness center',
    floor: 0,
    connections: [
      { locationId: 'cafeteria', distance: 70 },
    ],
  },
  {
    locationId: 'elevator',
    name: 'Elevator',
    coordinates: { x: 120, y: 0, z: 0 },
    qrCodeId: 'elevator-qr',
    description: 'Main elevator',
    floor: 0,
    connections: [
      { locationId: 'lobby', distance: 40 },
      { locationId: 'classroom-a', distance: 30 },
    ],
  },
  {
    locationId: 'classroom-a',
    name: 'Classroom A',
    coordinates: { x: 150, y: 0, z: 0 },
    qrCodeId: 'classroom-a-qr',
    description: 'Classroom A',
    floor: 0,
    connections: [
      { locationId: 'library', distance: 50 },
      { locationId: 'elevator', distance: 30 },
    ],
  },
];

// Seed database
const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing locations
    await Location.deleteMany({});
    console.log('Cleared existing locations');

    // Insert sample locations
    const inserted = await Location.insertMany(sampleLocations);
    console.log(`\n✅ Seeded ${inserted.length} locations:`);
    inserted.forEach((loc) => {
      console.log(`  - ${loc.name} (${loc.locationId})`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();

