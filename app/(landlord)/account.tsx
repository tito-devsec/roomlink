import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Icon } from '../../components/neo/Icon';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import { NeoButton, NeoCard, NeoSwitch, PageTitle, StatTile, Tag, Text, type IconName } from '../../components/neo';
import { clearRole } from '../../services/role';
import { endDemoSession, useDemoSession } from '../../services/demoAuth';
import { setThemeMode, useThemeMode } from '../../services/theme';
import { LANDLORD_STATS } from '../../services/landlordData';

const ROWS = themed((): { icon: IconName; label: string; color: string; onPress?: () => void }[] => [
  { icon: 'business', label: 'Business information', color: Colors.purple },
  { icon: 'shield-checkmark', label: 'Verification documents', color: Colors.green },
  { icon: 'star', label: 'Feature a listing', color: Colors.yellow },
  { icon: 'cash', label: 'Payouts & revenue', color: Colors.cyan },
  { icon: 'notifications', label: 'Notifications', color: Colors.pink },
  { icon: 'settings', label: 'Settings', color: Colors.orange },
  {
    icon: 'help-circle', label: 'Help & support', color: Colors.blueSoft,
    onPress: () => router.push({ pathname: '/help', params: { role: 'landlord' } }),
  },
]);

export default function LandlordProfile() {
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();
  const demo = useDemoSession();
  const dark = useThemeMode() === 'dark';
  const firstName = user?.firstName || demo?.firstName || 'Landlord';

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => {
        await endDemoSession(); await clearRole();
        if (isSignedIn) await signOut();
        router.replace('/(auth)/welcome');
      } },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <PageTitle overline="Landlord account" title="Profile" />

      <NeoCard color={Colors.purple} shadow={5} radius={22} style={styles.hero}>
        <View style={[styles.avatar, hardShadow(4)]}>
          <Text style={styles.avatarText}>{firstName[0].toUpperCase()}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>{firstName} {user?.lastName || ''}</Text>
          <Text style={styles.email} numberOfLines={1}>{user?.primaryEmailAddress?.emailAddress || demo?.email || 'landlord@roomlink.co.tz'}</Text>
          <Tag label="Verification pending" icon="time" color={Colors.orange} style={styles.verifyTag} />
        </View>
      </NeoCard>

      <View style={styles.statsRow}>
        <StatTile value={LANDLORD_STATS.activeRooms} label="Active" icon="bed" color={Colors.green} />
        <StatTile value={LANDLORD_STATS.totalBookings} label="Bookings" icon="document-text" color={Colors.cyan} />
        <StatTile value="4.8" label="Rating" icon="star" color={Colors.yellow} />
      </View>

      <NeoCard shadow={4} radius={18} clip style={styles.menu}>
        {ROWS.map((r, i) => (
          <Pressable
            key={r.label}
            style={({ pressed }) => [styles.row, i < ROWS.length - 1 && styles.rowBorder, pressed && styles.rowPressed]}
            onPress={r.onPress ?? (() => Alert.alert(r.label, 'Connect this screen to your backend.'))}
            accessibilityRole="button"
            accessibilityLabel={r.label}
          >
            <View style={[styles.rowIcon, { backgroundColor: r.color }]}>
              <Icon name={r.icon} size={18} color={Colors.ink} />
            </View>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Icon name="chevron-forward" size={18} color={Colors.ink} />
          </Pressable>
        ))}
      </NeoCard>

      <NeoCard shadow={4} radius={18} style={styles.menu}>
        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: Colors.purple }]}>
            <Icon name={dark ? 'sun' : 'moon'} size={18} color={Colors.ink} />
          </View>
          <Text style={styles.rowLabel}>Dark mode</Text>
          <NeoSwitch value={dark} onValueChange={on => setThemeMode(on ? 'dark' : 'light')} />
        </View>
      </NeoCard>

      <NeoButton title="Sign out" icon="log-out" variant="danger" size="lg" onPress={handleSignOut} style={styles.signOut} />
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 130 },
  flex: { flex: 1 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: 20, padding: 18 },
  avatar: {
    width: 78, height: 78, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.yellow, borderWidth: BorderWidth.thick, borderColor: Colors.ink,
  },
  avatarText: { fontFamily: Fonts.display, color: Colors.ink, fontSize: 32 },
  name: { fontFamily: Fonts.display, color: Colors.ink, fontSize: 20 },
  email: { color: Colors.ink, fontSize: 13.5, fontWeight: '500', marginTop: 2 },
  verifyTag: { marginTop: 10 },
  statsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 22 },
  menu: { marginHorizontal: 20, marginTop: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1.5, borderBottomColor: Colors.ink },
  rowPressed: { backgroundColor: Colors.yellowSoft },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  rowLabel: { flex: 1, color: Colors.ink, fontSize: 15, fontWeight: '600' },
  signOut: { marginHorizontal: 20, marginTop: 26 },
}));
