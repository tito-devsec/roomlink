// RoomLink splash — brand blue, logo sticker, bouncing block loader.
// Routes: signed-in students → tabs, landlords → dashboard, everyone else →
// welcome (where they can sign in or register at any time).

import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../constants/Colors';
import { Logo, Text } from '../components/neo';
import { HOME, resolveRole } from '../services/role';
import { loadDemoSession } from '../services/demoAuth';
import { useThemeMode } from '../services/theme';

const BLOCK_COLORS = themed(() => [Colors.white, Colors.yellow, Colors.pink]);

function BlockLoader() {
  const vals = useRef(BLOCK_COLORS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = vals.map((v, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 140),
      Animated.timing(v, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.delay((BLOCK_COLORS.length - 1 - i) * 140),
    ])));
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [vals]);

  return (
    <View style={styles.loader}>
      {vals.map((v, i) => (
        <Animated.View
          key={i}
          style={[styles.block, { backgroundColor: BLOCK_COLORS[i] }, {
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) }],
          }]}
        />
      ))}
    </View>
  );
}

export default function SplashPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const mode = useThemeMode();
  const { user } = useUser();
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const tagIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 70, friction: 7 }),
      ]),
      Animated.spring(tagIn, { toValue: 1, useNativeDriver: true, tension: 90, friction: 6 }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      if (isSignedIn) {
        resolveRole(user).then(role => router.replace(HOME[role]));
      } else {
        // Development test sessions (see services/demoAuth.ts) survive reloads.
        loadDemoSession().then(demo => router.replace(demo ? HOME[demo.role] : '/(auth)/welcome'));
      }
    }, 1600);
    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, user?.id]);

  return (
    <View style={styles.container}>
      {/* Brand blue is dark in the light theme and pale in the dark one. */}
      <StatusBar style={mode === 'dark' ? 'dark' : 'light'} />
      <Animated.View style={[styles.center, { opacity: fade, transform: [{ scale: logoScale }] }]}>
        <Logo size={108} shadow={7} />
        <Animated.View style={[styles.wordmark, hardShadow(4), {
          transform: [{ rotate: '-4deg' }, { scale: tagIn }],
        }]}>
          <Text style={styles.brand}>ROOMLINK</Text>
        </Animated.View>
      </Animated.View>

      <View style={styles.bottom}>
        <BlockLoader />
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.blue, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center' },
  wordmark: {
    marginTop: 26, paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: Colors.yellow, borderWidth: BorderWidth.base, borderColor: Colors.ink, borderRadius: 10,
  },
  brand: { fontFamily: Fonts.display, fontSize: 20, letterSpacing: 3, color: Colors.ink },
  bottom: { position: 'absolute', bottom: 64, alignItems: 'center' },
  loader: { flexDirection: 'row', gap: 10, height: 30, alignItems: 'flex-end' },
  block: {
    width: 14, height: 14, borderRadius: 3,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
}));
