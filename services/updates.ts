// Over-the-air updates (EAS Update). Installed builds pick up new JavaScript and
// images published with `eas update --channel <channel>` — no new APK needed.
// Native changes (new native modules, app.json native settings) still need a new
// build: bump "version" in app.json so old builds don't receive incompatible code.
//
// expo-updates already downloads on launch and applies on the next start; this
// checks on launch and whenever the app comes back to the foreground, and offers
// to restart as soon as a new version has been downloaded.

import { useEffect } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import * as Updates from 'expo-updates';

const CHECK_EVERY_MS = 5 * 60 * 1000;

export function useUpdatePrompt() {
  useEffect(() => {
    if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled) return;
    let busy = false;
    let prompted = false;
    let lastCheck = 0;

    const check = async () => {
      if (busy || prompted || Date.now() - lastCheck < CHECK_EVERY_MS) return;
      busy = true;
      lastCheck = Date.now();
      try {
        const { isAvailable } = await Updates.checkForUpdateAsync();
        if (!isAvailable) return;
        const { isNew } = await Updates.fetchUpdateAsync();
        if (!isNew) return;
        prompted = true;
        Alert.alert('Update ready', 'A newer version of RoomLink has been downloaded.', [
          { text: 'Later', style: 'cancel' },
          { text: 'Restart now', onPress: () => { Updates.reloadAsync().catch(() => {}); } },
        ]);
      } catch {
        // Offline or the update server is unreachable: try again later.
      } finally {
        busy = false;
      }
    };

    check();
    const sub = AppState.addEventListener('change', state => { if (state === 'active') check(); });
    return () => sub.remove();
  }, []);
}

/** Short label for the running code, e.g. "preview · a1b2c3d4" or "built-in". */
export function updateLabel(): string {
  if (!Updates.isEnabled) return 'dev';
  const id = Updates.isEmbeddedLaunch || !Updates.updateId ? 'built-in' : Updates.updateId.slice(0, 8);
  return Updates.channel ? `${Updates.channel} · ${id}` : id;
}
