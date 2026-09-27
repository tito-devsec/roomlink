import { useState, type ReactNode } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Icon } from '../../components/neo/Icon';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import {
  IconButton, Logo, NeoButton, NeoCard, NeoPressable, NeoSwitch, PageTitle, StatTile, Tag, Text,
  initialsOf, type IconName,
} from '../../components/neo';
import { getMyUniversityId } from '../../services/profile';
import { communityThreadId } from '../../services/chat';
import { clearRole } from '../../services/role';
import { endDemoSession, useDemoSession } from '../../services/demoAuth';
import { setThemeMode, useThemeMode } from '../../services/theme';
import { updateLabel } from '../../services/updates';

interface RowProps {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  color?: string;
  danger?: boolean;
  badge?: { label: string; color: string };
  toggle?: { value: boolean; onChange: (v: boolean) => void };
}

function SettingRow({ icon, label, value, onPress, color = Colors.cyan, danger, badge, toggle }: RowProps) {
  const content = (
    <>
      <View style={[styles.settingIcon, { backgroundColor: danger ? Colors.coral : color }]}>
        <Icon name={icon} size={18} color={Colors.ink} />
      </View>
      <Text style={[styles.settingLabel, danger && styles.dangerLabel]}>{label}</Text>
      <View style={styles.settingRight}>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
        {badge ? <Tag label={badge.label} color={badge.color} /> : null}
        {toggle ? (
          <NeoSwitch value={toggle.value} onValueChange={toggle.onChange} />
        ) : (
          !danger && <Icon name="chevron-forward" size={18} color={Colors.ink} />
        )}
      </View>
    </>
  );
  if (toggle) return <View style={styles.settingRow}>{content}</View>;
  return (
    <Pressable
      style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {content}
    </Pressable>
  );
}

function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <NeoCard shadow={4} radius={18} clip>{children}</NeoCard>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut, isSignedIn } = useAuth();
  const demo = useDemoSession();
  const [notifications, setNotifications] = useState(true);
  const darkMode = useThemeMode() === 'dark';
  const [locationAccess, setLocationAccess] = useState(true);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await endDemoSession(); await clearRole();
        if (isSignedIn) await signOut();
        router.replace('/(auth)/welcome');
      } },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Request Submitted', 'Your account deletion request has been submitted. This may take up to 30 days.') },
      ]
    );
  };

  const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || demo?.firstName || 'Student';
  const userEmail = user?.emailAddresses[0]?.emailAddress || demo?.email;
  const isVerified = false; // In real app: check verification status from Supabase

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <PageTitle overline="Your account" title="Profile" />

      {/* Profile card */}
      <NeoCard shadow={5} radius={22} clip style={styles.heroCard}>
        <View style={styles.cover}>
          <View style={[styles.coverDot, { left: 18, top: 16, backgroundColor: Colors.yellow }]} />
          <View style={[styles.coverDot, { right: 64, top: 26, backgroundColor: Colors.pink, width: 14, height: 14 }]} />
          <View style={[styles.coverDot, { right: 22, top: 12, backgroundColor: Colors.green, width: 10, height: 10 }]} />
        </View>
        <View style={styles.heroBody}>
          <View style={styles.heroTop}>
            <View style={[styles.avatar, hardShadow(4)]}>
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{initialsOf(userName)}</Text>
              )}
              <IconButton
                icon="camera"
                size={30}
                iconSize={14}
                round
                shadow={2}
                color={Colors.ink}
                iconColor={Colors.white}
                onPress={() => router.push('/profile/edit')}
                style={styles.cameraBtn}
                accessibilityLabel="Change photo"
              />
            </View>
            <NeoButton title="Edit profile" icon="pencil" size="sm" variant="secondary" onPress={() => router.push('/profile/edit')} />
          </View>

          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>

          <View style={styles.badgeRow}>
            {isVerified ? (
              <Tag label="Verified student" icon="shield-checkmark" color={Colors.green} size="md" />
            ) : (
              <NeoPressable onPress={() => router.push('/profile/verification')} shadow={2} style={styles.getVerified}>
                <Icon name="shield" size={13} color={Colors.ink} />
                <Text style={styles.getVerifiedText}>Get verified</Text>
                <Icon name="chevron-forward" size={13} color={Colors.ink} />
              </NeoPressable>
            )}
            <Tag label="University of Dar es Salaam" icon="school" color={Colors.blueSoft} size="md" style={styles.uniTag} />
          </View>
        </View>
      </NeoCard>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <StatTile value="4" label="Saved" icon="heart" color={Colors.pink} onPress={() => router.push('/profile/saved')} />
        <StatTile value="2" label="Bookings" icon="calendar" color={Colors.cyan} onPress={() => router.push('/profile/bookings')} />
        <StatTile value="2" label="Reviews" icon="star" color={Colors.yellow} onPress={() => router.push('/profile/reviews')} />
      </View>

      {!isVerified && (
        <NeoCard color={Colors.orange} shadow={4} radius={18} onPress={() => router.push('/profile/verification')} style={styles.verCTA}>
          <View style={styles.verCTAIcon}><Icon name="school" size={22} color={Colors.ink} /></View>
          <View style={styles.flex}>
            <Text style={styles.verCTATitle}>Verify student status</Text>
            <Text style={styles.verCTASubtitle}>Upload your student ID to get a verified badge</Text>
          </View>
          <Icon name="arrow-forward" size={20} color={Colors.ink} />
        </NeoCard>
      )}

      <Section title="Account">
        <SettingRow icon="person" label="Edit Profile" onPress={() => router.push('/profile/edit')} />
        <Divider />
        <SettingRow
          icon="shield-checkmark"
          label="Student Verification"
          badge={isVerified ? { label: 'Verified', color: Colors.green } : { label: 'Pending', color: Colors.orange }}
          onPress={() => router.push('/profile/verification')}
          color={Colors.green}
        />
        <Divider />
        <SettingRow icon="heart" label="Saved Hostels" value="4" onPress={() => router.push('/profile/saved')} color={Colors.pink} />
        <Divider />
        <SettingRow icon="calendar" label="My Bookings" value="2" onPress={() => router.push('/profile/bookings')} />
        <Divider />
        <SettingRow icon="star" label="My Reviews" value="2" onPress={() => router.push('/profile/reviews')} color={Colors.yellow} />
      </Section>

      <Section title="Preferences">
        <SettingRow icon="notifications" label="Push Notifications" toggle={{ value: notifications, onChange: setNotifications }} />
        <Divider />
        <SettingRow
          icon={darkMode ? 'sun' : 'moon'}
          label="Dark Mode"
          toggle={{ value: darkMode, onChange: on => setThemeMode(on ? 'dark' : 'light') }}
          color={Colors.purple}
        />
        <Divider />
        <SettingRow icon="location" label="Location Services" toggle={{ value: locationAccess, onChange: setLocationAccess }} color={Colors.green} />
      </Section>

      <Section title="Community">
        <SettingRow
          icon="chatbubbles"
          label="University Community"
          onPress={async () => { const uid = await getMyUniversityId(); router.push(`/chat/${communityThreadId(uid)}`); }}
        />
        <Divider />
        <SettingRow icon="people" label="Find Roommate" onPress={() => router.push('/roommate')} color={Colors.purple} />
      </Section>

      <Section title="Legal">
        <SettingRow icon="document-text" label="Terms of Service" onPress={() => router.push('/legal/terms')} color={Colors.orange} />
        <Divider />
        <SettingRow icon="lock-closed" label="Privacy Policy" onPress={() => router.push('/legal/privacy')} color={Colors.purple} />
        <Divider />
        <SettingRow icon="help-circle" label="Help & Support" onPress={() => router.push('/help')} color={Colors.green} />
      </Section>

      <Section>
        <SettingRow icon="log-out" label="Sign Out" onPress={handleSignOut} danger />
        <Divider />
        <SettingRow icon="trash" label="Delete Account" onPress={handleDeleteAccount} danger />
      </Section>

      <View style={styles.appInfo}>
        <Logo size={40} />
        <View>
          <Text style={styles.appName}>RoomLink</Text>
          <View style={styles.madeWith}>
            <Text style={styles.appVersion}>Version 1.0.0 · Made with</Text>
            <Icon name="heart" variant="solid" size={11} color={Colors.coral} />
            <Text style={styles.appVersion}>in Tanzania</Text>
          </View>
          <Text style={styles.appVersion}>Icons: Uicons by Flaticon</Text>
          <Text style={styles.appVersion}>Build: {updateLabel()}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 130 },
  flex: { flex: 1 },

  heroCard: { marginHorizontal: 20 },
  cover: { height: 78, backgroundColor: Colors.blue, borderBottomWidth: BorderWidth.base, borderBottomColor: Colors.ink },
  coverDot: {
    position: 'absolute', width: 18, height: 18, borderRadius: 9,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  heroBody: { paddingHorizontal: 18, paddingBottom: 18 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -44, marginBottom: 12 },
  avatar: {
    width: 88, height: 88, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.pink, borderWidth: BorderWidth.thick, borderColor: Colors.ink,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 24 - BorderWidth.thick },
  avatarText: { fontFamily: Fonts.display, fontSize: 32, color: Colors.ink },
  cameraBtn: { position: 'absolute', bottom: -8, right: -10 },
  userName: { fontFamily: Fonts.display, fontSize: 24, color: Colors.ink },
  userEmail: { fontSize: 14, color: Colors.textSecondary, marginTop: 2, marginBottom: 14 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  getVerified: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.orange, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  getVerifiedText: { fontSize: 12.5, fontWeight: '700', color: Colors.ink },
  uniTag: { flexShrink: 1 },

  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 22 },

  verCTA: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 22, padding: 14 },
  verCTAIcon: {
    width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  verCTATitle: { fontFamily: Fonts.display, fontSize: 15, color: Colors.ink, marginBottom: 2 },
  verCTASubtitle: { fontSize: 12.5, color: Colors.ink, fontWeight: '500' },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: Colors.ink,
    textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 10,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  settingRowPressed: { backgroundColor: Colors.yellowSoft },
  settingIcon: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.ink },
  dangerLabel: { color: Colors.errorInk, fontWeight: '700' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  divider: { height: 1.5, backgroundColor: Colors.ink },

  appInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 28 },
  appName: { fontFamily: Fonts.display, fontSize: 15, color: Colors.ink },
  appVersion: { fontSize: 12, color: Colors.textSecondary },
  madeWith: { flexDirection: 'row', alignItems: 'center', gap: 4 },
}));
