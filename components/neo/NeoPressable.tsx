import { useMemo, useRef, type ReactNode } from 'react';
import {
  Animated, Easing, Platform, Pressable, StyleSheet, View,
  type GestureResponderEvent, type Insets, type StyleProp, type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BorderRadius, Colors } from '../../constants/Colors';

export type HapticKind = 'light' | 'medium' | 'selection' | false;

export function haptic(kind: HapticKind) {
  if (!kind || Platform.OS === 'web') return;
  const run = kind === 'selection'
    ? Haptics.selectionAsync()
    : Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  run.catch(() => {});
}

// Keys that size/position the element. They go on the outer box so the shadow
// block (absolutely filled inside it) always matches the face exactly.
const BOX_KEYS = new Set([
  'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'aspectRatio',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'marginHorizontal', 'marginVertical', 'marginStart', 'marginEnd',
  'position', 'top', 'left', 'right', 'bottom', 'zIndex', 'transform',
]);

function splitStyle(style: StyleProp<ViewStyle>) {
  const flat = (StyleSheet.flatten(style) || {}) as Record<string, unknown>;
  const box: Record<string, unknown> = {};
  const face: Record<string, unknown> = {};
  for (const key of Object.keys(flat)) (BOX_KEYS.has(key) ? box : face)[key] = flat[key];
  return { box: box as ViewStyle, face: face as ViewStyle };
}

export interface NeoPressableProps {
  children: ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Shadow offset in px; 0 renders a flat pressable that still sinks on press. */
  shadow?: number;
  shadowColor?: string;
  haptic?: HapticKind;
  hitSlop?: number | Insets;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'tab' | 'checkbox' | 'switch';
  accessibilityState?: { selected?: boolean; checked?: boolean; disabled?: boolean };
}

export function NeoPressable({
  children, onPress, onLongPress, disabled, style,
  shadow = 4, shadowColor = Colors.ink, haptic: hapticKind = false,
  hitSlop, accessibilityLabel, accessibilityRole = 'button', accessibilityState,
}: NeoPressableProps) {
  const press = useRef(new Animated.Value(0)).current;
  const { box, face } = useMemo(() => splitStyle(style), [style]);
  const radius = (face.borderRadius as number | undefined) ?? BorderRadius.md;
  const travel = shadow > 0 ? shadow : 2;
  const offset = useMemo(
    () => press.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }),
    [press, travel],
  );

  const pressIn = () => {
    Animated.timing(press, { toValue: 1, duration: 70, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    haptic(hapticKind);
  };
  const pressOut = () => {
    Animated.spring(press, { toValue: 0, useNativeDriver: true, speed: 24, bounciness: 9 }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
      style={[box, disabled && styles.disabled]}
    >
      {shadow > 0 && (
        <View
          pointerEvents="none"
          style={[styles.shadow, {
            top: shadow, left: shadow, right: -shadow, bottom: -shadow,
            borderRadius: radius, backgroundColor: shadowColor,
          }]}
        />
      )}
      <Animated.View
        style={[styles.face, face, { transform: [{ translateX: offset }, { translateY: offset }] }]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute' },
  face: { flexGrow: 1 },
  disabled: { opacity: 0.5 },
});
