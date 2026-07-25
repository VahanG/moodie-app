/**
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import { initializeSupabase } from './src/features/supabase';
import { ThemeProvider, useTheme } from './src/theme';

function App() {
  React.useEffect(() => initializeSupabase(), []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <NavigationBar style={theme.isDark ? 'light' : 'dark'} />
      <HomeScreen />
    </>
  );
}

export default App;
