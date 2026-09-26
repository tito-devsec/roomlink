import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated, Easing, Image, Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions,
  type StyleProp, type ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { Icon } from './Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, BorderWidth, Colors, Fonts, colorFor, hardShadow, themed } from '../../constants/Colors';
import { NeoButton, IconButton } from './controls';
import type { IconName } from './Icon';
import { NeoPressable } from './NeoPressable';
import { Text } from './Text';

// ── Card ───────────────────────────────────────────────────────────────
interface CardProps {
  children?: ReactNode;
  color?: string;
  shadow?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  /** Clip children to the rounded corners on an inner layer, so the outer shadow is never clipped. */
  clip?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function NeoCard({
  children, color = Colors.surface, shadow = 4, radius = BorderRadius.lg, style, clip, contentStyle, onPress,
}: CardProps) {
  const base = [styles.card, { backgroundColor: color, borderRadius: radius }];
  const body = clip
    ? <View style={[{ borderRadius: radius - BorderWidth.base, overflow: 'hidden' }, contentStyle]}>{children}</View>
    : children;
  if (onPress) {
    return <NeoPressable onPress={onPress} shadow={shadow} style={[base, style]}>{body}</NeoPressable>;
  }
  return <View style={[base, shadow ? hardShadow(shadow) : null, style]}>{body}</View>;
}

// ── Stack screen header (back button + centred title) ──────────────────
interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backIcon?: IconName;
  right?: ReactNode;
  bg?: string;
  bordered?: boolean;
  /** Screen is presented as a modal (an iOS page sheet already clears the status bar). */
  modal?: boolean;
}

export function ScreenHeader({
  title, subtitle, onBack, backIcon = 'arrow-back', right, bg = Colors.bg, bordered = true, modal,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const top = modal && Platform.OS === 'ios' ? 14 : insets.top + 10;
  return (
    <View style={[styles.header, { paddingTop: top, backgroundColor: bg }, bordered && styles.headerBorder]}>
      <IconButton icon={backIcon} onPress={onBack ?? (() => router.back())} size={42} accessibilityLabel="Go back" />
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.headerSub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right ?? <View style={{ width: 42 }} />}
    </View>
  );
}

// ── Tab screen title (overline + big display title) ────────────────────
export function PageTitle({ overline, title, right, style }: {
  overline?: string; title: string; right?: ReactNode; style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.pageTitle, { paddingTop: insets.top + 14 }, style]}>
      <View style={{ flex: 1 }}>
        {overline ? <Text style={styles.overline}>{overline}</Text> : null}
        <Text style={styles.pageTitleText} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
      </View>
      {right}
    </View>
  );
}

// ── Section header ─────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction, style }: {
  title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ── Empty state ────────────────────────────────────────────────────────
export function EmptyState({ icon = 'sparkles', color = Colors.yellow, title, subtitle, action, onAction, style }: {
  icon?: IconName; color?: string; title: string; subtitle?: string;
  action?: string; onAction?: () => void; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.empty, style]}>
      <View style={[styles.emptyTile, { backgroundColor: color }, hardShadow(4)]}>
        <Icon name={icon} size={34} color={Colors.ink} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
      {action ? <NeoButton title={action} onPress={onAction} style={{ marginTop: 20 }} /> : null}
    </View>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────
export function initialsOf(name?: string) {
  return (name || '').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

export function Avatar({ name, size = 48, color, icon, uri, square, shadow = 0, style }: {
  name?: string; size?: number; color?: string; icon?: IconName; uri?: string | null;
  square?: boolean; shadow?: number; style?: StyleProp<ViewStyle>;
}) {
  const radius = square ? Math.round(size * 0.28) : size / 2;
  const inner = radius - BorderWidth.base;
  return (
    <View style={[
      styles.avatar,
      { width: size, height: size, borderRadius: radius, backgroundColor: color ?? colorFor(name || '?') },
      shadow ? hardShadow(shadow) : null,
      style,
    ]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: inner }} />
      ) : icon ? (
        <Icon name={icon} size={Math.round(size * 0.44)} color={Colors.ink} />
      ) : (
        <Text style={{ fontFamily: Fonts.display, fontSize: size * 0.36, color: Colors.ink }}>{initialsOf(name)}</Text>
      )}
    </View>
  );
}

// ── Logo tile ──────────────────────────────────────────────────────────
// The logo file is a JPEG with black corners, so it is scaled up inside a
// clipped navy tile to crop them away.
export function Logo({ size = 44, shadow = 3, shadowColor = Colors.ink }: { size?: number; shadow?: number; shadowColor?: string }) {
  const radius = Math.round(size * 0.27);
  return (
    <View style={[styles.logo, { width: size, height: size, borderRadius: radius }, shadow ? hardShadow(shadow, shadowColor) : null]}>
      <View style={[styles.logoClip, { borderRadius: radius - BorderWidth.base }]}>
        <Image
          source={require('../../assets/images/roomlink-logo.png')}
          style={{ width: size * 1.2, height: size * 1.2 }}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

// ── Dashed divider ─────────────────────────────────────────────────────
// Drawn from small blocks: single-side dashed borders are unreliable on Android.
const DASHES = Array.from({ length: 120 });
export function DashedLine({ color = Colors.ink, thickness = 2, dash = 7, gap = 5, style }: {
  color?: string; thickness?: number; dash?: number; gap?: number; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.dashRow, { height: thickness }, style]}>
      {DASHES.map((_, i) => (
        <View key={i} style={{ width: dash, height: thickness, marginRight: gap, backgroundColor: color }} />
      ))}
    </View>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────
export function ProgressBar({ progress, color = Colors.yellow, height = 14, style }: {
  progress: number; color?: string; height?: number; style?: StyleProp<ViewStyle>;
}) {
  const anim = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress, anim]);
  return (
    <View style={[styles.progress, { height }, style]}>
      <Animated.View style={[styles.progressFill, {
        backgroundColor: color,
        width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp' }),
      }]} />
    </View>
  );
}

// ── Stat tile ──────────────────────────────────────────────────────────
/** Stretches to share a row by default; pass `width` for a fixed-size tile (e.g. in a horizontal scroller). */
export function StatTile({ value, label, icon, color = Colors.surface, onPress, width, style }: {
  value: string | number; label: string; icon?: IconName; color?: string;
  onPress?: () => void; width?: number; style?: StyleProp<ViewStyle>;
}) {
  const body = (
    <>
      {icon ? (
        <View style={styles.statIcon}><Icon name={icon} size={16} color={Colors.ink} /></View>
      ) : null}
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </>
  );
  return (
    <NeoCard
      color={color}
      shadow={3}
      radius={BorderRadius.lg}
      onPress={onPress}
      style={[styles.stat, width ? { width } : styles.statFill, style]}
    >
      {body}
    </NeoCard>
  );
}

// ── Bottom sheet ───────────────────────────────────────────────────────
export function BottomSheet({ visible, onClose, children, style }: {
  visible: boolean; onClose: () => void; children: ReactNode; style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
    } else if (mounted) {
      Animated.timing(anim, {
        toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true,
      }).start(({ finished }) => { if (finished) setMounted(false); });
    }
  }, [visible, mounted, anim]);

  // Animate in only once the modal's views exist.
  useEffect(() => {
    if (visible && mounted) {
      Animated.timing(anim, {
        toValue: 1, duration: 340, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: true,
      }).start();
    }
  }, [visible, mounted, anim]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: anim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 20 },
          { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [screenH, 0] }) }] },
          style,
        ]}
      >
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { borderWidth: BorderWidth.base, borderColor: Colors.ink },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14,
  },
  headerBorder: { borderBottomWidth: BorderWidth.base, borderBottomColor: Colors.ink },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.ink },
  headerSub: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginTop: 1 },

  pageTitle: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 20, paddingBottom: 14 },
  overline: {
    fontSize: 12, fontWeight: '700', color: Colors.blue,
    textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 2,
  },
  pageTitleText: { fontFamily: Fonts.display, fontSize: 34, lineHeight: 40, color: Colors.ink },

  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { fontFamily: Fonts.display, fontSize: 20, color: Colors.ink, flexShrink: 1 },
  sectionAction: { fontSize: 14, fontWeight: '700', color: Colors.ink, textDecorationLine: 'underline' },

  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
  emptyTile: {
    width: 84, height: 84, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.base, borderColor: Colors.ink, marginBottom: 20,
  },
  emptyTitle: { fontFamily: Fonts.display, fontSize: 20, color: Colors.ink, textAlign: 'center', marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  avatar: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },

  logo: { borderWidth: BorderWidth.base, borderColor: Colors.ink, backgroundColor: Colors.logoNavy },
  logoClip: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },

  dashRow: { flexDirection: 'row', overflow: 'hidden' },

  progress: {
    backgroundColor: Colors.surface, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
    borderRadius: BorderRadius.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRightWidth: BorderWidth.thin, borderRightColor: Colors.ink },

  stat: { padding: 12, gap: 2 },
  statFill: { flex: 1 },
  statIcon: {
    width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: BorderWidth.thin, borderColor: Colors.ink, marginBottom: 8,
  },
  statValue: { fontFamily: Fonts.display, fontSize: 22, color: Colors.ink },
  statLabel: { fontSize: 12, fontWeight: '700', color: Colors.ink },

  overlay: { backgroundColor: Colors.overlay },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '88%',
    backgroundColor: Colors.bg, paddingHorizontal: 20, paddingTop: 12,
    borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl,
    borderWidth: BorderWidth.thick, borderBottomWidth: 0, borderColor: Colors.ink,
  },
  handle: {
    alignSelf: 'center', width: 44, height: 6, borderRadius: 3,
    backgroundColor: Colors.ink, marginBottom: 16,
  },
}));
