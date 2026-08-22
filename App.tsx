/**
 * @format
 */

import React from 'react';
import { NavigationBar } from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import { initializeSupabase } from './src/features/supabase';
import { ThemeProvider, useTheme } from './src/theme';
import { UserSettingsSynchronizer } from './src/features/user-settings';
import { LocalizationProvider } from './src/features/localization';

function App() {
  React.useEffect(() => initializeSupabase(), []);

  return (
    <SafeAreaProvider>
      <UserSettingsSynchronizer />
      <LocalizationProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </LocalizationProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { theme } = useTheme();

  return (
    <>
      <NavigationBar style={theme.isDark ? 'light' : 'dark'} />
      <HomeScreen />
    </>
  );
}

export default App;
