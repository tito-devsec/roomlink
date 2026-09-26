import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, BorderWidth, Colors, Shadow, themed } from '../../constants/Colors';
import { haptic } from './NeoPressable';
import { Text } from './Text';

export interface TabSpec {
  name: string;
  icon: IconName; // bold when inactive, solid when active
  label: string;
}

interface Route { key: string; name: string }
interface Props {
  state: { index: number; routes: Route[] };
  navigation: { navigate: (name: string) => void };
  tabs: TabSpec[];
  accent?: string;
}

const PAD = 6;

// Floating tab bar. One native-driven value moves the accent pill and
// cross-fades every icon between its bold and solid glyph.
export function NeoTabBar({ state, navigation, tabs, accent = Colors.yellow }: Props) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter(r => tabs.some(t => t.name === r.name));
  const activeName = state.routes[state.index]?.name;
  const activeIdx = Math.max(0, routes.findIndex(r => r.name === activeName));

  const [width, setWidth] = useState(0);
  const pos = useRef(new Animated.Value(activeIdx)).current;

  useEffect(() => {
    Animated.spring(pos, { toValue: activeIdx, useNativeDriver: true, tension: 170, friction: 19 }).start();
  }, [activeIdx, pos]);

  const itemW = width / Math.max(1, routes.length);
  const last = Math.max(1, routes.length - 1);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 14) }]}>
      <View
        style={[styles.bar, Shadow.md]}
        onLayout={e => setWidth(e.nativeEvent.layout.width - PAD * 2 - BorderWidth.base * 2)}
      >
        {width > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[styles.pill, {
              width: itemW,
              backgroundColor: accent,
              transform: [{ translateX: pos.interpolate({ inputRange: [0, last], outputRange: [0, itemW * last] }) }],
            }]}
          />
        )}
        {routes.map((route, i) => {
          const tab = tabs.find(t => t.name === route.name)!;
          const on = pos.interpolate({ inputRange: [i - 1, i, i + 1], outputRange: [0, 1, 0], extrapolate: 'clamp' });
          const off = pos.interpolate({ inputRange: [i - 1, i, i + 1], outputRange: [1, 0, 1], extrapolate: 'clamp' });
          const focused = i === activeIdx;
          return (
            <Pressable
              key={route.key}
              style={styles.item}
              onPress={() => {
                if (focused) return;
                haptic('selection');
                navigation.navigate(route.name);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
            >
              <View style={styles.iconBox}>
                <Animated.View style={[StyleSheet.absoluteFill, styles.center, { opacity: off }]}>
                  <Icon name={tab.icon} size={21} color={Colors.ink} />
                </Animated.View>
                <Animated.View style={[StyleSheet.absoluteFill, styles.center, { opacity: on }]}>
                  <Icon name={tab.icon} variant="solid" size={21} color={Colors.ink} />
                </Animated.View>
              </View>
              <Text style={[styles.label, focused && styles.labelOn]} numberOfLines={1}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16 },
  bar: {
    flexDirection: 'row', padding: PAD,
    backgroundColor: Colors.surface,
    borderWidth: BorderWidth.base, borderColor: Colors.ink, borderRadius: BorderRadius.xl + 2,
  },
  pill: {
    position: 'absolute', top: PAD, bottom: PAD, left: PAD,
    borderRadius: BorderRadius.lg, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 7, gap: 2 },
  iconBox: { width: 26, height: 24 },
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10.5, fontWeight: '600', color: Colors.ink },
  labelOn: { fontWeight: '700' },
}));
