import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import {
  SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { Colors, themed } from '../constants/Colors';
import { IconFonts } from '../components/neo/Icon';
import { DialogHost } from '../components/neo/Dialog';
import { loadThemeMode, useThemeMode } from '../services/theme';
import { useUpdatePrompt } from '../services/updates';

SplashScreen.preventAutoHideAsync();

const CLERK_PUBLISHABLE_KEY = 'pk_test_cXVpY2stZ3JvdXBlci0yLmNsZXJrLmFjY291bnRzLmRldiQ';

const tokenCache = {
  async getToken(key: string) {
    try { return SecureStore.getItemAsync(key); } catch { return null; }
  },
  async saveToken(key: string, value: string) {
    try { return SecureStore.setItemAsync(key, value); } catch { return; }
  },
};

function RootLayoutNav() {
  const { isLoaded } = useAuth();
  const mode = useThemeMode();
  useUpdatePrompt();
  useEffect(() => {
    if (isLoaded) SplashScreen.hideAsync();
  }, [isLoaded]);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {/* Remounting on a theme change redraws every screen in the new palette;
          React Navigation restores the navigation state, so nobody loses their place. */}
      <Stack
        key={mode}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: Colors.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(landlord)" options={{ animation: 'fade' }} />
        <Stack.Screen name="hostel" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="chat" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="roommate" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="landlord" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="payment" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="legal" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="help" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <DialogHost />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ArchivoBlack_400Regular,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    [IconFonts.bold]: require('../assets/fonts/uicons-bold.ttf'),
    [IconFonts.solid]: require('../assets/fonts/uicons-solid.ttf'),
    [IconFonts.brands]: require('../assets/fonts/uicons-brands.ttf'),
  });
  // Apply the saved theme before anything draws; re-render the root background on changes.
  const [themeReady, setThemeReady] = useState(false);
  useThemeMode();
  useEffect(() => { loadThemeMode().finally(() => setThemeReady(true)); }, []);

  // Keep the native splash up until the type is ready (fall back to system
  // fonts rather than hang if loading fails).
  if ((!fontsLoaded && !fontError) || !themeReady) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <RootLayoutNav />
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}

const styles = themed(() => StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.bg } }));
