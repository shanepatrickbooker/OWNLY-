import 'react-native-get-random-values'; // Must be imported before react-native-purchases
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { initializeDatabase } from './(tabs)/database/database';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from '../contexts/ThemeContext';
import { notificationService } from '../services/notificationService';
import { ErrorBoundary } from '../components/ErrorBoundary';

function AppContent() {
  const { isDark } = useTheme();
  
  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <SubscriptionProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="paywall" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </SubscriptionProvider>
      <StatusBar style={isDark ? 'light' : 'auto'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    const initializeApp = async () => {
      await initializeDatabase();
      await notificationService.initialize();
    };
    
    initializeApp().catch(console.error);
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ErrorBoundary>
      <CustomThemeProvider>
        <AppContent />
      </CustomThemeProvider>
    </ErrorBoundary>
  );
}
