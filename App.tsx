// ============================================
// NOTED - Main App Component
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { NoteDetailScreen } from './src/screens/NoteDetailScreen';
import { SystemsScreen } from './src/screens/SystemsScreen';
import { AllFoldersScreen } from './src/screens/AllFoldersScreen';
import { AllNotesScreen } from './src/screens/AllNotesScreen';
import { FolderDetailScreen } from './src/screens/FolderDetailScreen';
import { BubblePlaygroundScreen } from './src/screens/BubblePlaygroundScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { CreateBubbleScreen } from './src/screens/CreateBubbleScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { PlannerScreen } from './src/screens/PlannerScreen';
import { PendingScreen } from './src/screens/PendingScreen';
import { ToDoTodayScreen } from './src/screens/ToDoTodayScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { getDatabase } from './src/services';
import { useStore } from './src/store';

const Stack = createNativeStackNavigator();

// Loading screen component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <Text style={{ fontSize: 18, color: '#666' }}>Initializing Noted...</Text>
  </View>
);

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const { loadFolders } = useStore();

  const bootstrapApp = useCallback(async () => {
    try {
      console.log('🚀 Starting app bootstrap...');

      // Step 1: Initialize database
      console.log('📱 Initializing database...');
      const db = await getDatabase();
      if (!db) {
        throw new Error('Database not available for this platform');
      }

      await db.init();
      console.log('✅ Database initialized');

      // Step 2: Load initial data safely
      console.log('📁 Loading folders...');
      await loadFolders();
      console.log('✅ Folders loaded');

      console.log('🎉 App bootstrap complete');
      setIsInitialized(true);

    } catch (error) {
      console.error('❌ App bootstrap failed:', error);
      setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
      // Even on error, we can show the app - user might still use some features
      setIsInitialized(true);
    }
  }, [loadFolders]);

  useEffect(() => {
    console.log('📍 App component mounted');
    bootstrapApp();

    // Cleanup function to prevent state updates after unmount
    return () => {
      console.log('📍 App component unmounting - cleaning up effects');
    };
  }, [bootstrapApp]);

  // Show loading screen until initialization is complete
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  // Show error state if something went wrong, but still render the app
  if (initError) {
    console.warn('⚠️ App initialized with errors, but continuing:', initError);
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
        <Stack.Screen name="Systems" component={SystemsScreen} />
        <Stack.Screen name="AllFolders" component={AllFoldersScreen} />
        <Stack.Screen name="AllNotes" component={AllNotesScreen} />
        <Stack.Screen name="FolderDetail" component={FolderDetailScreen} />
        <Stack.Screen name="BubblePlayground" component={BubblePlaygroundScreen} />
        <Stack.Screen name="CreateBubble" component={CreateBubbleScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Planner" component={PlannerScreen} />
        <Stack.Screen name="Pending" component={PendingScreen} />
        <Stack.Screen name="ToDoToday" component={ToDoTodayScreen} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
