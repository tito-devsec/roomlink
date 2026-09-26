// In-app dialog for web. React Native Web ships Alert.alert as a no-op, and
// browsers or embedded previews may block window.confirm (some answer "Cancel"
// instantly), which silently broke sign-out and every confirmation. On web,
// Alert.alert now opens this dialog instead; native builds keep the platform
// Alert. Mount <DialogHost /> once, at the root.

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { Alert, Animated, Modal, Platform, Pressable, StyleSheet, View, type AlertButton } from 'react-native';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import { NeoButton, type ButtonVariant } from './controls';
import { Text } from './Text';

interface DialogRequest { id: number; title: string; message?: string; buttons: AlertButton[] }

let queue: DialogRequest[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export function showDialog(title: string, message?: string, buttons?: AlertButton[]) {
  queue = [...queue, { id: nextId++, title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] }];
  emit();
}

if (Platform.OS === 'web') Alert.alert = showDialog;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => { listeners.delete(onChange); };
}

const variantFor = (b: AlertButton): ButtonVariant =>
  b.style === 'cancel' ? 'secondary' : b.style === 'destructive' ? 'danger' : 'primary';

export function DialogHost() {
  const dialog = useSyncExternalStore(subscribe, () => queue[0] ?? null, () => null);
  if (!dialog) return null;

  // Close first, so a button that opens another dialog queues behind nothing.
  const close = (button?: AlertButton) => {
    queue = queue.slice(1);
    emit();
    button?.onPress?.();
  };
  // Tapping outside (or Escape) means Cancel, or the only button of a notice.
  const cancel = dialog.buttons.find(b => b.style === 'cancel');
  const dismissWith = cancel ?? (dialog.buttons.length === 1 ? dialog.buttons[0] : undefined);
  const dismiss = () => { if (dismissWith) close(dismissWith); };

  // Short labels sit side by side (Cancel first); long ones stack, Cancel last.
  const stacked = dialog.buttons.length > 2 || dialog.buttons.some(b => (b.text ?? '').length > 12);
  const buttons = stacked && cancel ? [...dialog.buttons.filter(b => b !== cancel), cancel] : dialog.buttons;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <Pressable style={[StyleSheet.absoluteFill, styles.overlay]} onPress={dismiss} accessibilityLabel="Close dialog" />
      <View style={styles.center} pointerEvents="box-none">
        <DialogCard key={dialog.id}>
          <Text style={styles.title}>{dialog.title}</Text>
          {dialog.message ? <Text style={styles.message}>{dialog.message}</Text> : null}
          <View style={[styles.actions, stacked && styles.actionsStacked]}>
            {buttons.map((b, i) => (
              <NeoButton
                key={`${i}-${b.text}`}
                title={b.text ?? 'OK'}
                variant={variantFor(b)}
                size="md"
                style={!stacked && styles.actionFlex}
                onPress={() => close(b)}
              />
            ))}
          </View>
        </DialogCard>
      </View>
    </Modal>
  );
}

function DialogCard({ children }: { children: ReactNode }) {
  const pop = useRef(new Animated.Value(0.92)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, tension: 140, friction: 8 }).start();
  }, [pop]);
  return (
    <Animated.View accessibilityRole="alert" style={[styles.card, hardShadow(6), { transform: [{ scale: pop }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = themed(() => StyleSheet.create({
  overlay: { backgroundColor: Colors.overlay },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%', maxWidth: 400, padding: 22, borderRadius: 22,
    backgroundColor: Colors.surface, borderWidth: BorderWidth.thick, borderColor: Colors.ink,
  },
  title: { fontFamily: Fonts.display, fontSize: 22, color: Colors.ink },
  message: { fontSize: 15, lineHeight: 21, color: Colors.textSecondary, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 22 },
  actionsStacked: { flexDirection: 'column' },
  actionFlex: { flex: 1 },
}));
