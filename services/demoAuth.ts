// Test sign-in: any email + password opens a local test session for the role
// picked on the login screen, without Clerk. On in development and in test APKs:
// the "preview" build profile sets EXPO_PUBLIC_TEST_LOGIN and uses the "preview"
// update channel, so over-the-air updates to test APKs keep it on too.
// Production builds and their channel never enable it.

import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import type { Role } from './role';

export const DEMO_LOGIN_ENABLED =
  __DEV__ || process.env.EXPO_PUBLIC_TEST_LOGIN === '1' || Updates.channel === 'preview';

export interface DemoSession {
  email: string;
  role: Role;
  firstName: string;
}

const KEY = 'roomlink.demoSession';
let current: DemoSession | null = null;
let loaded = false;
let version = 0; // bumped on sign-in/out so a slow load can't overwrite them
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

// "tenant+clerk_test@example.com" -> "Tenant"
function nameFromEmail(email: string) {
  const word = email.split('@')[0].split('+')[0].split(/[._-]/)[0] || 'Tester';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export async function startDemoSession(email: string, role: Role): Promise<DemoSession> {
  const session = { email, role, firstName: nameFromEmail(email) };
  current = session; loaded = true; version++;
  emit();
  try { await AsyncStorage.setItem(KEY, JSON.stringify(session)); } catch {}
  return session;
}

export async function loadDemoSession(): Promise<DemoSession | null> {
  if (!DEMO_LOGIN_ENABLED) return null;
  const started = version;
  let stored: DemoSession | null = null;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    stored = raw ? JSON.parse(raw) : null;
  } catch {}
  if (started === version) { current = stored; loaded = true; emit(); }
  return current;
}

export async function endDemoSession() {
  current = null; loaded = true; version++;
  emit();
  try { await AsyncStorage.removeItem(KEY); } catch {}
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Screens opened directly (e.g. a web reload) skip the splash that loads it.
  if (!loaded) loadDemoSession();
  return () => { listeners.delete(onChange); };
}

export function useDemoSession(): DemoSession | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
