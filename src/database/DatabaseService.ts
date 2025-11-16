import AsyncStorage from '@react-native-async-storage/async-storage';
import { aStar, createGraph } from '../utils/aStarAlgorithm';
import type { Location, Destination, NavigationPath } from '../types';

// Storage keys
const LOCATIONS_KEY = '@ar_nav_locations';
const CONNECTIONS_KEY = '@ar_nav_connections';
const INITIALIZED_KEY = '@ar_nav_initialized';
const DB_VERSION_KEY = '@ar_nav_db_version';
const CURRENT_DB_VERSION = '2.1'; // Added Home and Office locations

interface StoredLocation extends Location {
  connections?: string[];
  isDestination?: boolean;
  createdAt: string;
  updatedAt: string;
}

class DatabaseService {
  private locations: StoredLocation[] = [];
  private connections: Array<{ from: string; to: string }> = [];

  async initialize(): Promise<void> {
    try {
      // Check database version
      const currentVersion = await AsyncStorage.getItem(DB_VERSION_KEY);
      const forceReseed = currentVersion !== CURRENT_DB_VERSION;
      
      if (forceReseed) {
        await this.clearAllData();
      }
      
      // Load existing data
      await this.loadData();
      
      // Seed initial data if database is empty or version changed
      if (this.locations.length === 0 || forceReseed) {
        await this.seedInitialData();
        await AsyncStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
      }
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async loadData(): Promise<void> {
    try {
      const [locationsData, connectionsData] = await Promise.all([
        AsyncStorage.getItem(LOCATIONS_KEY),
        AsyncStorage.getItem(CONNECTIONS_KEY)
      ]);

      this.locations = locationsData ? JSON.parse(locationsData) : [];
      this.connections = connectionsData ? JSON.parse(connectionsData) : [];
    } catch (error) {
      console.error('Error loading data:', error);
      this.locations = [];
      this.connections = [];
    }
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(LOCATIONS_KEY, JSON.stringify(this.locations)),
        AsyncStorage.setItem(CONNECTIONS_KEY, JSON.stringify(this.connections))
      ]);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  private async seedInitialData(): Promise<void> {
    const now = new Date().toISOString();
    // TODO: Replace these GPS coordinates with your actual campus locations
    // Format: Decimal degrees (e.g., 13.170367, 77.559333)
    const initialLocations: StoredLocation[] = [
      {
        id: 'two_wheeler_parking',
        name: 'Two Wheeler Parking',
        x: 50,
        y: 30,
        latitude: 13.1700670,
        longitude: 77.5593300,
        floor: 0,
        category: 'Parking',
        icon: '🏍️',
        isDestination: true,
        connections: ['main_entrance', 'girls_hostel'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'main_entrance',
        name: 'Main Entrance',
        x: 45,
        y: 50,
        latitude: 13.1675060,
        longitude: 77.5585460,
        floor: 0,
        category: 'Entrance',
        icon: '🚪',
        isDestination: true,
        connections: ['two_wheeler_parking', 'staff_washroom'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'staff_washroom',
        name: 'Staff Washroom',
        x: 40,
        y: 15,
        latitude: 13.1675480,
        longitude: 77.5582040,
        floor: 0,
        category: 'Facilities',
        icon: '🚻',
        isDestination: true,
        connections: ['main_entrance', 'hod_cabin'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'girls_hostel',
        name: 'Girls Hostel',
        x: 48,
        y: 35,
        latitude: 13.1692180,
        longitude: 77.5591570,
        floor: 0,
        category: 'Accommodation',
        icon: '🏠',
        isDestination: true,
        connections: ['two_wheeler_parking', 'college_canteen'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'college_canteen',
        name: 'College Canteen',
        x: 42,
        y: 32,
        latitude: 13.1685230,
        longitude: 77.5591180,
        floor: 0,
        category: 'Food',
        icon: '🍽️',
        isDestination: true,
        connections: ['girls_hostel', 'mba_block', 'cafe'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'mba_block',
        name: 'MBA Block',
        x: 38,
        y: 30,
        latitude: 13.1681340,
        longitude: 77.5590460,
        floor: 0,
        category: 'Academic',
        icon: '🎓',
        isDestination: true,
        connections: ['college_canteen', 'basketball_court'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'basketball_court',
        name: 'Basketball Court',
        x: 35,
        y: 28,
        latitude: 13.1680380,
        longitude: 77.5587730,
        floor: 0,
        category: 'Sports',
        icon: '🏀',
        isDestination: true,
        connections: ['mba_block', 'cafe'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cafe',
        name: 'Cafe',
        x: 35,
        y: 28,
        latitude: 13.1680380,
        longitude: 77.5587730,
        floor: 0,
        category: 'Food',
        icon: '☕',
        isDestination: true,
        connections: ['basketball_court', 'college_canteen', 'room_241'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'boys_hostel',
        name: 'Boys Hostel',
        x: 30,
        y: 15,
        latitude: 13.1671540,
        longitude: 77.5574950,
        floor: 0,
        category: 'Accommodation',
        icon: '🏠',
        isDestination: true,
        connections: ['staff_washroom'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'room_241',
        name: 'Room 241',
        x: 38,
        y: 26,
        latitude: 13.1681200,
        longitude: 77.5584900,
        floor: 2,
        category: 'Classroom',
        icon: '🚪',
        isDestination: true,
        connections: ['cafe', 'room_242'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'room_242',
        name: 'Room 242',
        x: 37,
        y: 26,
        latitude: 13.1680510,
        longitude: 77.5584830,
        floor: 2,
        category: 'Classroom',
        icon: '🚪',
        isDestination: true,
        connections: ['room_241', 'room_239'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'room_239',
        name: 'Room 239',
        x: 35,
        y: 25,
        latitude: 13.1678920,
        longitude: 77.5584610,
        floor: 2,
        category: 'Classroom',
        icon: '🚪',
        isDestination: true,
        connections: ['room_242', 'room_238'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'room_238',
        name: 'Room 238',
        x: 60,
        y: 40,
        latitude: 13.1678450,
        longitude: 77.5584420,
        floor: 2,
        category: 'Classroom',
        icon: '🚪',
        isDestination: true,
        connections: ['room_239', 'room_237'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'room_237',
        name: 'Room 237',
        x: 33,
        y: 24,
        latitude: 13.1677470,
        longitude: 77.5584310,
        floor: 2,
        category: 'Classroom',
        icon: '🚪',
        isDestination: true,
        connections: ['room_238', 'room_236'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'room_236',
        name: 'Room 236',
        x: 32,
        y: 23,
        latitude: 13.1676530,
        longitude: 77.5584200,
        floor: 2,
        category: 'Classroom',
        icon: '🚪',
        isDestination: true,
        connections: ['room_237', 'aiml_staff_room'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'aiml_staff_room',
        name: 'AIML Staff Room',
        x: 32,
        y: 23,
        latitude: 13.1676530,
        longitude: 77.5584200,
        floor: 2,
        category: 'Staff',
        icon: '👥',
        isDestination: true,
        connections: ['room_236', 'seminar_hall'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'seminar_hall',
        name: 'Seminar Hall',
        x: 30,
        y: 21,
        latitude: 13.1674450,
        longitude: 77.5583930,
        floor: 2,
        category: 'Academic',
        icon: '🎤',
        isDestination: true,
        connections: ['aiml_staff_room', 'room_221'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'room_221',
        name: 'Room 221',
        x: 30,
        y: 21,
        latitude: 13.1674450,
        longitude: 77.5583930,
        floor: 2,
        category: 'Classroom',
        icon: '🚪',
        isDestination: true,
        connections: ['seminar_hall', 'hod_cabin'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'hod_cabin',
        name: 'HOD Cabin',
        x: 28,
        y: 19,
        latitude: 13.1672380,
        longitude: 77.5583290,
        floor: 2,
        category: 'Staff',
        icon: '👔',
        isDestination: true,
        connections: ['room_221', 'room_223', 'staff_washroom'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'room_223',
        name: 'Room 223',
        x: 28,
        y: 16,
        latitude: 13.1672390,
        longitude: 77.5581760,
        floor: 2,
        category: 'Classroom',
        icon: '🚪',
        isDestination: true,
        connections: ['hod_cabin', 'room_224'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'room_224',
        name: 'Room 224',
        x: 29,
        y: 16,
        latitude: 13.1673220,
        longitude: 77.5581760,
        floor: 2,
        category: 'Classroom',
        icon: '🚪',
        isDestination: true,
        connections: ['room_223', 'room_201'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'room_201',
        name: 'Room 201',
        x: 29,
        y: 22,
        latitude: 13.1673420,
        longitude: 77.5586350,
        floor: 2,
        category: 'Classroom',
        icon: '🚪',
        isDestination: true,
        connections: ['room_224', 'room_203'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'room_203',
        name: 'Room 203',
        x: 28,
        y: 24,
        latitude: 13.1672560,
        longitude: 77.5588020,
        floor: 2,
        category: 'Classroom',
        icon: '🚪',
        isDestination: true,
        connections: ['room_201', 'room_204'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'room_204',
        name: 'Room 204',
        x: 28,
        y: 25,
        latitude: 13.1672340,
        longitude: 77.5589220,
        floor: 2,
        category: 'Classroom',
        icon: '🚪',
        isDestination: true,
        connections: ['room_203', 'room_205'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'room_205',
        name: 'Room 205',
        x: 28,
        y: 27,
        latitude: 13.1671990,
        longitude: 77.5590530,
        floor: 2,
        category: 'Classroom',
        icon: '🚪',
        isDestination: true,
        connections: ['room_204', 'home'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'home',
        name: 'Home',
        x: 15,
        y: 20,
        latitude: 12.9125404,
        longitude: 77.6247986,
        floor: 0,
        category: 'Personal',
        icon: '🏠',
        isDestination: true,
        connections: ['room_205', 'office'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'office',
        name: 'Office',
        x: 18,
        y: 22,
        latitude: 12.9107142,
        longitude: 77.6263465,
        floor: 0,
        category: 'Work',
        icon: '🏢',
        isDestination: true,
        connections: ['home'],
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Generate connections from location data
    const connections: Array<{ from: string; to: string }> = [];
    initialLocations.forEach(location => {
      if (location.connections) {
        location.connections.forEach(connectionId => {
          connections.push({ from: location.id, to: connectionId });
        });
      }
    });

    this.locations = initialLocations;
    this.connections = connections;
    await this.saveData();
  }

  async getLocationById(id: string): Promise<Location | null> {
    const location = this.locations.find(loc => loc.id === id);
    
    if (!location) {
      return null;
    }

    return {
      id: location.id,
      name: location.name,
      x: location.x,
      y: location.y,
      latitude: location.latitude,    // Include GPS coordinates
      longitude: location.longitude,  // Include GPS coordinates
      floor: location.floor,
      category: location.category,
      icon: location.icon,
    };
  }

  async getDestinations(): Promise<Destination[]> {
    const destinations = this.locations.filter(location => location.isDestination);
    
    return destinations.map(location => ({
      id: location.id,
      name: location.name,
      category: location.category,
      icon: location.icon,
    }));
  }

  async getAllLocations(): Promise<Location[]> {
    return this.locations.map(location => ({
      id: location.id,
      name: location.name,
      x: location.x,
      y: location.y,
      floor: location.floor,
      category: location.category,
      icon: location.icon,
    }));
  }

  async calculateRoute(sourceId: string, destinationId: string): Promise<NavigationPath> {
    const locations = await this.getAllLocations();
    const sourceLocation = locations.find(loc => loc.id === sourceId);
    const destLocation = locations.find(loc => loc.id === destinationId);

    if (!sourceLocation || !destLocation) {
      throw new Error('Source or destination location not found');
    }

    // Use stored connections
    const connections = this.connections;

    // Create graph and calculate path using A*
    const graph = createGraph(locations, connections);
    const path = aStar(graph, sourceId, destinationId);

    if (!path) {
      throw new Error('No path found between locations');
    }

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const dx = path[i + 1].x - path[i].x;
      const dy = path[i + 1].y - path[i].y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }

    // Estimate time (assuming 1.4 m/s walking speed)
    const estimatedTime = Math.ceil(totalDistance / 1.4);

    return {
      path: path.map(point => ({ x: point.x, y: point.y })),
      distance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
      steps: path.length,
      estimatedTime,
      source: sourceLocation,
      destination: destLocation,
    };
  }

  async addLocation(location: Omit<StoredLocation, 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = new Date().toISOString();
    const newLocation: StoredLocation = {
      ...location,
      createdAt: now,
      updatedAt: now,
    };

    this.locations.push(newLocation);
    await this.saveData();
  }

  async updateLocation(id: string, updates: Partial<Omit<StoredLocation, 'id' | 'createdAt'>>): Promise<void> {
    const index = this.locations.findIndex(loc => loc.id === id);
    if (index === -1) {
      throw new Error('Location not found');
    }

    this.locations[index] = {
      ...this.locations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveData();
  }

  async deleteLocation(id: string): Promise<void> {
    const index = this.locations.findIndex(loc => loc.id === id);
    if (index === -1) {
      throw new Error('Location not found');
    }

    this.locations.splice(index, 1);
    
    // Remove connections involving this location
    this.connections = this.connections.filter(
      conn => conn.from !== id && conn.to !== id
    );

    await this.saveData();
  }

  async clearAllData(): Promise<void> {
    this.locations = [];
    this.connections = [];
    await Promise.all([
      AsyncStorage.removeItem(LOCATIONS_KEY),
      AsyncStorage.removeItem(CONNECTIONS_KEY),
      AsyncStorage.removeItem(INITIALIZED_KEY),
      AsyncStorage.removeItem(DB_VERSION_KEY)
    ]);
  }

  async forceReseed(): Promise<void> {
    await this.clearAllData();
    await this.seedInitialData();
    await AsyncStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
  }

  async debugDatabaseState(): Promise<void> {
    console.log('🐛 DATABASE DEBUG INFO:');
    console.log(`   Locations in memory: ${this.locations.length}`);
    console.log(`   Connections in memory: ${this.connections.length}`);
    
    const locationsData = await AsyncStorage.getItem(LOCATIONS_KEY);
    const connectionsData = await AsyncStorage.getItem(CONNECTIONS_KEY);
    const versionData = await AsyncStorage.getItem(DB_VERSION_KEY);
    
    console.log(`   Locations in storage: ${locationsData ? JSON.parse(locationsData).length : 0}`);
    console.log(`   Connections in storage: ${connectionsData ? JSON.parse(connectionsData).length : 0}`);
    console.log(`   Database version: ${versionData || 'none'}`);
    console.log(`   Current version: ${CURRENT_DB_VERSION}`);
    
    if (this.locations.length > 0) {
      console.log(`   Location IDs: ${this.locations.map(l => l.id).join(', ')}`);
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;