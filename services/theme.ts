// Light / dark theme choice. The palette itself lives in constants/Colors.ts;
// this module remembers the choice and lets screens react to it. The root
// layout remounts the navigator when it changes (navigation state is kept).

import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyThemeMode, getThemeMode, type ThemeMode } from '../constants/Colors';

const KEY = 'roomlink.theme';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

/** Restores the saved theme; call once before the first render. */
export async function loadThemeMode(): Promise<ThemeMode> {
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') { applyThemeMode(saved); emit(); }
  } catch {}
  return getThemeMode();
}

export function setThemeMode(next: ThemeMode) {
  if (next === getThemeMode()) return;
  applyThemeMode(next);
  emit();
  AsyncStorage.setItem(KEY, next).catch(() => {});
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => { listeners.delete(onChange); };
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, getThemeMode, () => 'light');
}
