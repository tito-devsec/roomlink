import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../../components/neo/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderWidth, Colors, Fonts, themed } from '../../constants/Colors';
import { IconButton, Logo, NeoPressable, Text, type IconName } from '../../components/neo';

const OPTIONS = themed((): { role: 'student' | 'landlord'; icon: IconName; title: string; desc: string; color: string; route: string }[] => [
  {
    role: 'student',
    icon: 'school',
    title: 'I’m a Tenant',
    desc: 'For students: find verified hostels, match with roommates, and join your university community.',
    color: Colors.yellow,
    route: '/(auth)/register',
  },
  {
    role: 'landlord',
    icon: 'business',
    title: 'I’m a Landlord',
    desc: 'List your rooms, reach verified students, and manage booking requests.',
    color: Colors.purple,
    route: '/(auth)/landlord-register',
  },
]);

export default function UserTypeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 28 }]}
      showsVerticalScrollIndicator={false}
    >
      <IconButton icon="arrow-back" onPress={() => router.back()} style={styles.back} accessibilityLabel="Go back" />

      <View style={styles.brandRow}>
        <Logo size={42} />
        <Text style={styles.brand}>RoomLink</Text>
      </View>

      <Text style={styles.overline}>Create an account</Text>
      <Text style={styles.title}>How will you use RoomLink?</Text>
      <Text style={styles.subtitle}>Pick the option that fits you. You can’t change this later without a new account.</Text>

      <View style={styles.cards}>
        {OPTIONS.map(o => (
          <NeoPressable
            key={o.role}
            onPress={() => router.push(o.route as any)}
            shadow={5}
            haptic="light"
            accessibilityLabel={o.title}
            style={[styles.card, { backgroundColor: o.color }]}
          >
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}>
                <Icon name={o.icon} size={28} color={Colors.ink} />
              </View>
              <View style={styles.arrow}>
                <Icon name="arrow-forward" size={20} color={Colors.white} />
              </View>
            </View>
            <Text style={styles.cardTitle}>{o.title}</Text>
            <Text style={styles.cardDesc}>{o.desc}</Text>
          </NeoPressable>
        ))}
      </View>

      <Pressable style={styles.loginLink} onPress={() => router.push('/(auth)/login')} hitSlop={8}>
        <Text style={styles.loginLinkText}>
          Already have an account? <Text style={styles.loginLinkStrong}>Log in</Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 22, flexGrow: 1 },
  back: { alignSelf: 'flex-start' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24 },
  brand: { fontFamily: Fonts.display, fontSize: 22, color: Colors.ink },
  overline: {
    fontSize: 12, fontWeight: '700', color: Colors.blue, letterSpacing: 1.4,
    textTransform: 'uppercase', marginTop: 30,
  },
  title: { fontFamily: Fonts.display, fontSize: 32, lineHeight: 38, color: Colors.ink, marginTop: 4 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 10, lineHeight: 22 },
  cards: { gap: 20, marginTop: 28 },
  card: { borderRadius: 22, padding: 20, borderWidth: BorderWidth.thick, borderColor: Colors.ink },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  arrow: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.ink,
  },
  cardTitle: { fontFamily: Fonts.display, fontSize: 22, color: Colors.ink },
  cardDesc: { fontSize: 14, color: Colors.ink, marginTop: 6, lineHeight: 20, fontWeight: '500' },
  loginLink: { marginTop: 'auto', paddingTop: 28, alignItems: 'center' },
  loginLinkText: { color: Colors.ink, fontSize: 14 },
  loginLinkStrong: { fontWeight: '700', textDecorationLine: 'underline' },
}));
