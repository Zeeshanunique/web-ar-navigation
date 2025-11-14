import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import DestinationScreen from './src/screens/DestinationScreen';
import ARNavigationScreen from './src/screens/ARNavigationScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'AR Navigation' }}
        />
        <Stack.Screen 
          name="QRScanner" 
          component={QRScannerScreen}
          options={{ title: 'Scan QR Code' }}
        />
        <Stack.Screen 
          name="Destination" 
          component={DestinationScreen}
          options={{ title: 'Select Destination' }}
        />
        <Stack.Screen 
          name="ARNavigation" 
          component={ARNavigationScreen}
          options={{ 
            title: 'AR Navigation',
            headerShown: false 
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

