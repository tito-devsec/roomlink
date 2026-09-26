import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator, Animated, Pressable, StyleSheet, View,
  type StyleProp, type TextStyle, type ViewStyle,
} from 'react-native';
import { Icon, type IconName, type IconVariant } from './Icon';
import { BorderRadius, BorderWidth, Colors, hardShadow, themed } from '../../constants/Colors';
import { NeoPressable, haptic, type HapticKind } from './NeoPressable';
import { Text } from './Text';

// ── Button ─────────────────────────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'blue' | 'danger' | 'success' | 'purple' | 'pink';

const VARIANTS = themed((): Record<ButtonVariant, { bg: string; fg: string }> => ({
  primary: { bg: Colors.yellow, fg: Colors.ink },
  secondary: { bg: Colors.surface, fg: Colors.ink },
  dark: { bg: Colors.ink, fg: Colors.white },
  blue: { bg: Colors.blue, fg: Colors.white },
  danger: { bg: Colors.coral, fg: Colors.ink },
  success: { bg: Colors.green, fg: Colors.ink },
  purple: { bg: Colors.purple, fg: Colors.ink },
  pink: { bg: Colors.pink, fg: Colors.ink },
}));

const SIZES = {
  sm: { h: 40, font: 13, px: 14, icon: 16, shadow: 3 },
  md: { h: 52, font: 15, px: 18, icon: 18, shadow: 4 },
  lg: { h: 58, font: 17, px: 22, icon: 20, shadow: 5 },
};

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: keyof typeof SIZES;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  haptic?: HapticKind;
}

export function NeoButton({
  title, onPress, variant = 'primary', size = 'md', icon, iconRight,
  loading, disabled, style, textStyle, haptic: h = 'light',
}: ButtonProps) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  return (
    <NeoPressable
      onPress={loading ? undefined : onPress}
      disabled={disabled}
      haptic={h}
      shadow={s.shadow}
      accessibilityLabel={title}
      style={[styles.btn, { backgroundColor: v.bg, minHeight: s.h, paddingHorizontal: s.px }, style]}
    >
      {loading
        ? <ActivityIndicator size="small" color={v.fg} />
        : icon ? <Icon name={icon} size={s.icon} color={v.fg} /> : null}
      <Text style={[styles.btnText, { color: v.fg, fontSize: s.font }, textStyle]} numberOfLines={1}>{title}</Text>
      {iconRight && !loading ? <Icon name={iconRight} size={s.icon} color={v.fg} /> : null}
    </NeoPressable>
  );
}

// ── Icon button ────────────────────────────────────────────────────────
interface IconButtonProps {
  icon: IconName;
  iconVariant?: IconVariant;
  onPress?: () => void;
  color?: string;
  iconColor?: string;
  size?: number;
  iconSize?: number;
  round?: boolean;
  shadow?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  haptic?: HapticKind;
  children?: ReactNode;
}

export function IconButton({
  icon, iconVariant, onPress, color = Colors.surface, iconColor = Colors.ink, size = 44, iconSize,
  round, shadow = 3, style, accessibilityLabel, haptic: h = false, children,
}: IconButtonProps) {
  return (
    <NeoPressable
      onPress={onPress}
      shadow={shadow}
      haptic={h}
      hitSlop={6}
      accessibilityLabel={accessibilityLabel ?? String(icon)}
      style={[styles.iconBtn, {
        width: size, height: size, backgroundColor: color,
        borderRadius: round ? size / 2 : Math.round(size * 0.3),
      }, style]}
    >
      <Icon name={icon} variant={iconVariant} size={iconSize ?? Math.round(size * 0.44)} color={iconColor} />
      {children}
    </NeoPressable>
  );
}

// ── Chip (selectable) ──────────────────────────────────────────────────
interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, active, onPress, icon, color = Colors.surface, style }: ChipProps) {
  const fg = active ? Colors.yellow : Colors.ink;
  return (
    <NeoPressable
      onPress={onPress}
      shadow={2}
      haptic="selection"
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={label}
      style={[styles.chip, { backgroundColor: active ? Colors.ink : color }, style]}
    >
      {icon ? <Icon name={icon} size={15} color={fg} /> : null}
      <Text style={[styles.chipText, { color: fg }]}>{label}</Text>
    </NeoPressable>
  );
}

// ── Tag (static label) ─────────────────────────────────────────────────
interface TagProps {
  label: string;
  color?: string;
  textColor?: string;
  icon?: IconName;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  shadow?: number;
}

export function Tag({ label, color = Colors.surface, textColor = Colors.ink, icon, size = 'sm', style, shadow = 0 }: TagProps) {
  const md = size === 'md';
  return (
    <View style={[
      styles.tag,
      { backgroundColor: color, paddingHorizontal: md ? 11 : 8, paddingVertical: md ? 5 : 3 },
      shadow ? hardShadow(shadow) : null,
      style,
    ]}>
      {icon ? <Icon name={icon} size={md ? 13 : 11} color={textColor} /> : null}
      <Text style={[styles.tagText, { color: textColor, fontSize: md ? 12.5 : 11 }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// ── Checkbox ───────────────────────────────────────────────────────────
export function Checkbox({ checked, onPress, size = 22 }: { checked: boolean; onPress?: () => void; size?: number }) {
  const box = (
    <View style={[styles.checkbox, { width: size, height: size }, checked && styles.checkboxOn]}>
      {checked && <Icon name="checkmark" size={size - 6} color={Colors.ink} />}
    </View>
  );
  if (!onPress) return box;
  return (
    <Pressable
      onPress={() => { haptic('selection'); onPress(); }}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      {box}
    </Pressable>
  );
}

// ── Switch ─────────────────────────────────────────────────────────────
const TRACK_W = 52;
const KNOB = 20;
const TRACK_PAD = 3;

export function NeoSwitch({ value, onValueChange }: { value: boolean; onValueChange?: (v: boolean) => void }) {
  const x = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(x, { toValue: value ? 1 : 0, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }, [value, x]);
  const travel = TRACK_W - BorderWidth.base * 2 - TRACK_PAD * 2 - KNOB;
  return (
    <Pressable
      onPress={() => { haptic('selection'); onValueChange?.(!value); }}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <View style={[styles.track, { backgroundColor: value ? Colors.green : Colors.surface }, hardShadow(2)]}>
        <Animated.View style={[styles.knob, {
          transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }) }],
        }]} />
      </View>
    </Pressable>
  );
}

// ── Segmented control ──────────────────────────────────────────────────
// The ink thumb slides between options while each label cross-fades from
// ink to yellow — both driven by one native-driver value, so they stay in sync.
const SEG_PAD = 4;

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
  height?: number;
}

export function Segmented<T extends string>({ options, value, onChange, style, height = 44 }: SegmentedProps<T>) {
  const index = Math.max(0, options.findIndex(o => o.value === value));
  const [width, setWidth] = useState(0);
  const pos = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.spring(pos, { toValue: index, useNativeDriver: true, tension: 180, friction: 20 }).start();
  }, [index, pos]);

  const segW = width / options.length;
  const last = Math.max(1, options.length - 1);

  return (
    <View
      style={[styles.seg, { height }, hardShadow(3), style]}
      onLayout={e => setWidth(e.nativeEvent.layout.width - BorderWidth.base * 2 - SEG_PAD * 2)}
    >
      {width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[styles.segThumb, {
            width: segW,
            transform: [{ translateX: pos.interpolate({ inputRange: [0, last], outputRange: [0, segW * last] }) }],
          }]}
        />
      )}
      {options.map((o, i) => {
        const on = pos.interpolate({ inputRange: [i - 1, i, i + 1], outputRange: [0, 1, 0], extrapolate: 'clamp' });
        const off = pos.interpolate({ inputRange: [i - 1, i, i + 1], outputRange: [1, 0, 1], extrapolate: 'clamp' });
        return (
          <Pressable
            key={o.value}
            style={styles.segItem}
            onPress={() => { if (o.value !== value) { haptic('selection'); onChange(o.value); } }}
            accessibilityRole="tab"
            accessibilityState={{ selected: o.value === value }}
          >
            <Animated.View style={[styles.segLabelWrap, { opacity: off }]}>
              <Text style={styles.segText} numberOfLines={1}>{o.label}</Text>
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, styles.segLabelWrap, { opacity: on }]}>
              <Text style={[styles.segText, styles.segTextOn]} numberOfLines={1}>{o.label}</Text>
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: BorderWidth.base, borderColor: Colors.ink, borderRadius: BorderRadius.md,
  },
  btnText: { fontWeight: '700', letterSpacing: 0.2 },

  iconBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },

  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, height: 38,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink, borderRadius: BorderRadius.full,
  },
  chipText: { fontSize: 13.5, fontWeight: '700' },

  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    borderWidth: BorderWidth.thin, borderColor: Colors.ink, borderRadius: BorderRadius.full,
  },
  tagText: { fontWeight: '700' },

  checkbox: {
    borderWidth: BorderWidth.base, borderColor: Colors.ink, borderRadius: 6,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: Colors.green },

  track: {
    width: TRACK_W, height: KNOB + TRACK_PAD * 2 + BorderWidth.base * 2,
    borderRadius: BorderRadius.full, borderWidth: BorderWidth.base, borderColor: Colors.ink,
    padding: TRACK_PAD, justifyContent: 'center',
  },
  knob: {
    width: KNOB, height: KNOB, borderRadius: KNOB / 2,
    backgroundColor: Colors.surface, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },

  seg: {
    flexDirection: 'row', padding: SEG_PAD,
    backgroundColor: Colors.surface, borderWidth: BorderWidth.base, borderColor: Colors.ink,
    borderRadius: BorderRadius.md + 2,
  },
  segThumb: {
    position: 'absolute', top: SEG_PAD, bottom: SEG_PAD, left: SEG_PAD,
    backgroundColor: Colors.ink, borderRadius: BorderRadius.md - 2,
  },
  segItem: { flex: 1 },
  segLabelWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  segText: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  segTextOn: { color: Colors.yellow },
}));
