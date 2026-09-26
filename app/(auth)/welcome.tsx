import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../../components/neo/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import { IconButton, Logo, NeoButton, Tag, Text, type IconName } from '../../components/neo';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=900&q=80';

const STATS = themed((): { v: string; l: string; c: string; icon: IconName }[] => [
  { v: '2K+', l: 'Hostels', c: Colors.yellow, icon: 'home' },
  { v: '15K+', l: 'Students', c: Colors.pink, icon: 'people' },
  { v: '4.8', l: 'Rating', c: Colors.cyan, icon: 'star' },
]);

const SOCIAL = themed((): { icon: IconName; color: string; label: string }[] => [
  { icon: 'logo-google', color: '#EA4335', label: 'Continue with Google' },
  { icon: 'logo-apple', color: Colors.ink, label: 'Continue with Apple' },
  { icon: 'logo-facebook', color: '#1877F2', label: 'Continue with Facebook' },
]);

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const { height } = useWindowDimensions();
  const heroH = Math.min(300, height * 0.34);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(80),
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slide, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      ]),
      Animated.spring(pop, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.brandRow, { opacity: fade }]}>
        <Logo size={42} />
        <Text style={styles.brandName}>RoomLink</Text>
      </Animated.View>

      {/* Hero: framed photo on a tilted back card, with sticker tags */}
      <Animated.View style={[styles.hero, { height: heroH, opacity: fade, transform: [{ translateY: slide }] }]}>
        <View style={styles.heroBack} />
        <View style={[styles.heroFrame, hardShadow(6)]}>
          <View style={styles.heroClip}>
            <Image source={{ uri: HERO_IMAGE }} style={styles.heroImg} resizeMode="cover" />
          </View>
        </View>
        <Animated.View style={[styles.stickerTop, { transform: [{ rotate: '-6deg' }, { scale: pop }] }]}>
          <Tag label="Verified hostels" icon="shield-checkmark" color={Colors.green} size="md" shadow={3} />
        </Animated.View>
        <Animated.View style={[styles.stickerBottom, { transform: [{ rotate: '5deg' }, { scale: pop }] }]}>
          <Tag label="From TZS 90k / mo" icon="pricetag" color={Colors.yellow} size="md" shadow={3} />
        </Animated.View>
      </Animated.View>

      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
        <Text style={styles.headline}>
          Find your{'\n'}
          <Text style={styles.highlight}> dream home </Text>
          {'\n'}with ease.
        </Text>
        <Text style={styles.subtext}>
          RoomLink helps you discover the perfect student hostel tailored to your needs and budget.
        </Text>

        <View style={styles.statsRow}>
          {STATS.map(s => (
            <View key={s.l} style={[styles.stat, { backgroundColor: s.c }, hardShadow(3)]}>
              <View style={styles.statTop}>
                <Text style={styles.statVal}>{s.v}</Text>
                <Icon name={s.icon} variant="solid" size={14} color={Colors.ink} />
              </View>
              <Text style={styles.statLbl}>{s.l}</Text>
            </View>
          ))}
        </View>

        <View style={styles.btnRow}>
          <NeoButton title="Login" size="lg" style={styles.flex} onPress={() => router.push('/(auth)/login')} />
          <NeoButton title="Register" size="lg" variant="secondary" style={styles.flex} onPress={() => router.push('/(auth)/user-type')} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.landlordLink, pressed && styles.landlordLinkPressed]}
          onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'landlord' } })}
          accessibilityRole="button"
          accessibilityLabel="Landlord login"
        >
          <View style={styles.landlordIcon}>
            <Icon name="business" size={16} color={Colors.ink} />
          </View>
          <Text style={styles.landlordText}>
            Landlord? <Text style={styles.landlordStrong}>Log in to your dashboard</Text>
          </Text>
          <Icon name="arrow-forward" size={16} color={Colors.ink} />
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.divLine} />
          <Text style={styles.divText}>or sign in with</Text>
          <View style={styles.divLine} />
        </View>
        <View style={styles.socialRow}>
          {SOCIAL.map(s => (
            <IconButton
              key={s.icon}
              icon={s.icon}
              iconColor={s.color}
              size={54}
              iconSize={24}
              style={styles.flex}
              accessibilityLabel={s.label}
              onPress={() => router.push('/(auth)/login')}
            />
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 22 },
  flex: { flex: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22 },
  brandName: { fontFamily: Fonts.display, fontSize: 22, color: Colors.ink },

  hero: { marginBottom: 30, marginRight: 6 },
  heroBack: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.blue, borderRadius: 24,
    borderWidth: BorderWidth.thick, borderColor: Colors.ink,
    transform: [{ rotate: '3.5deg' }, { translateX: 6 }],
  },
  heroFrame: {
    flex: 1, borderRadius: 24, backgroundColor: Colors.surface,
    borderWidth: BorderWidth.thick, borderColor: Colors.ink,
  },
  heroClip: { flex: 1, borderRadius: 24 - BorderWidth.thick, overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%' },
  stickerTop: { position: 'absolute', top: -14, left: -8 },
  stickerBottom: { position: 'absolute', bottom: -16, right: 4 },

  headline: { fontFamily: Fonts.display, fontSize: 38, lineHeight: 46, color: Colors.ink, marginBottom: 12 },
  highlight: { backgroundColor: Colors.yellow },
  subtext: { fontSize: 15, lineHeight: 22, color: Colors.textSecondary, marginBottom: 22 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 26 },
  stat: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14,
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statVal: { fontFamily: Fonts.display, fontSize: 20, color: Colors.ink },
  statLbl: { fontSize: 12, fontWeight: '700', color: Colors.ink, marginTop: 2 },

  btnRow: { flexDirection: 'row', gap: 14, marginBottom: 18 },
  landlordLink: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14,
    backgroundColor: Colors.purpleSoft, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  landlordLinkPressed: { backgroundColor: Colors.purple },
  landlordIcon: {
    width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.purple, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  landlordText: { flex: 1, fontSize: 13.5, color: Colors.ink },
  landlordStrong: { fontWeight: '700', textDecorationLine: 'underline' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  divLine: { flex: 1, height: BorderWidth.thin, backgroundColor: Colors.ink },
  divText: { color: Colors.ink, fontSize: 13, fontWeight: '600' },
  socialRow: { flexDirection: 'row', gap: 14 },
}));
