import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDestinations, calculateRoute } from '../services/apiService';

export default function DestinationScreen({ navigation, route }) {
  const { currentLocation, locationId } = route.params || {};
  const [destinations, setDestinations] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDestinations();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDestinations(destinations);
    } else {
      const filtered = destinations.filter((dest) =>
        dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDestinations(filtered);
    }
  }, [searchQuery, destinations]);

  const loadDestinations = async () => {
    try {
      const data = await getDestinations();
      setDestinations(data);
      setFilteredDestinations(data);
    } catch (error) {
      console.error('Error loading destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDestination = async (destination) => {
    if (!currentLocation || !locationId) {
      alert('Starting location not set. Please scan a QR code first.');
      navigation.navigate('QRScanner');
      return;
    }

    try {
      // Calculate route
      const route = await calculateRoute(locationId, destination.id);
      
      navigation.navigate('ARNavigation', {
        currentLocation,
        destination,
        path: route.path || route.data?.path || [],
        sourceId: locationId,
        destinationId: destination.id,
      });
    } catch (error) {
      alert(`Failed to calculate route: ${error.message}`);
    }
  };

  const renderDestinationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.destinationItem}
      onPress={() => handleSelectDestination(item)}
    >
      <View style={styles.destinationIcon}>
        <Text style={styles.iconText}>{item.icon || '📍'}</Text>
      </View>
      <View style={styles.destinationInfo}>
        <Text style={styles.destinationName}>{item.name}</Text>
        {item.category && (
          <Text style={styles.destinationCategory}>{item.category}</Text>
        )}
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading destinations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {currentLocation && (
          <Text style={styles.currentLocationText}>
            From: {currentLocation.name || locationId}
          </Text>
        )}
        <TextInput
          style={styles.searchInput}
          placeholder="Search destinations..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredDestinations}
        renderItem={renderDestinationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No destinations found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  currentLocationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    padding: 15,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  destinationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 24,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  destinationCategory: {
    fontSize: 14,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#4A90E2',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

