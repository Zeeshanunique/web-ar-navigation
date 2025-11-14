const path = require('path');

// Resolve backend directory path
const backendPath = path.join(__dirname, '../backend');

// Add backend node_modules to module path
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  try {
    return originalRequire.apply(this, arguments);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      try {
        return originalRequire.call(this, path.join(backendPath, 'node_modules', id));
      } catch (e2) {
        throw e;
      }
    }
    throw e;
  }
};

const mongoose = require('mongoose');
const Location = require(path.join(backendPath, 'src/models/Location'));
require('dotenv').config({ path: path.join(backendPath, '.env') });

// Sample campus locations
const sampleLocations = [
  {
    id: 'parking_01',
    name: 'Parking Lot',
    x: 10,
    y: 5,
    category: 'Parking',
    icon: '🅿️',
    isDestination: true,
    connections: ['cafeteria', 'classroom_a'],
  },
  {
    id: 'cafeteria',
    name: 'Cafeteria',
    x: 12,
    y: 10,
    category: 'Food',
    icon: '🍽️',
    isDestination: true,
    connections: ['parking_01', 'library', 'classroom_a'],
  },
  {
    id: 'library',
    name: 'Library',
    x: 16,
    y: 14,
    category: 'Academic',
    icon: '📚',
    isDestination: true,
    connections: ['cafeteria', 'classroom_a', 'lab'],
  },
  {
    id: 'classroom_a',
    name: 'Classroom Block A',
    x: 8,
    y: 12,
    category: 'Academic',
    icon: '🏫',
    isDestination: true,
    connections: ['parking_01', 'cafeteria', 'library', 'auditorium'],
  },
  {
    id: 'lab',
    name: 'Laboratory',
    x: 14,
    y: 8,
    category: 'Academic',
    icon: '🔬',
    isDestination: true,
    connections: ['library', 'auditorium'],
  },
  {
    id: 'auditorium',
    name: 'Auditorium',
    x: 18,
    y: 6,
    category: 'Events',
    icon: '🎭',
    isDestination: true,
    connections: ['classroom_a', 'lab'],
  },
  // Additional waypoints
  {
    id: 'junction_1',
    name: 'Junction 1',
    x: 11,
    y: 7,
    category: 'Other',
    icon: '📍',
    isDestination: false,
    connections: ['parking_01', 'cafeteria'],
  },
  {
    id: 'junction_2',
    name: 'Junction 2',
    x: 13,
    y: 11,
    category: 'Other',
    icon: '📍',
    isDestination: false,
    connections: ['cafeteria', 'library'],
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ar-navigation';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Clear existing locations
    await Location.deleteMany({});
    console.log('🗑️  Cleared existing locations');
    
    // Insert sample locations
    for (const locationData of sampleLocations) {
      const location = new Location(locationData);
      await location.save();
      console.log(`✅ Created location: ${locationData.name} (${locationData.id})`);
    }
    
    console.log('\n🎉 Database seeded successfully!');
    console.log(`📊 Total locations: ${sampleLocations.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

