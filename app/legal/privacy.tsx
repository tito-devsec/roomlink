import { ScrollView, View, StyleSheet } from 'react-native';
import { Icon, type IconName } from '../../components/neo/Icon';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import { NeoCard, ScreenHeader, Tag, Text } from '../../components/neo';

const SECTIONS: { icon: IconName; title: string; content: string }[] = [
  {
    icon: 'search',
    title: 'Information We Collect',
    content: `We collect information you provide directly:\n\n• Account info: name, email, phone, WhatsApp number\n• Academic info: university, year of study, gender\n• Student ID photos for verification purposes\n• Profile photo and preferences\n• Messages sent via our chat platform\n• Booking and transaction history\n\nInformation collected automatically:\n• Device type, OS version, and app version\n• Location data (only when permission granted)\n• Usage patterns and feature interactions\n• Crash reports and performance data`,
  },
  {
    icon: 'settings',
    title: 'How We Use Your Information',
    content: `We use your information to:\n\n• Create and manage your student account\n• Verify your student status via ID documents\n• Connect you with relevant hostel listings\n• Enable real-time chat with your university community\n• Send booking confirmations and notifications\n• Improve app performance and user experience\n• Prevent fraud and ensure platform safety\n• Comply with legal obligations`,
  },
  {
    icon: 'card',
    title: 'Student ID Verification Data',
    content: `We take the security of your identity documents extremely seriously:\n\n• ID photos are encrypted using AES-256 encryption\n• Documents are stored on secure servers in compliance with Tanzanian data protection laws\n• Only authorized verification staff can access your documents\n• ID photos are permanently deleted after successful verification\n• We never sell, rent, or share your ID documents with any third party\n• You may request deletion of your verification data at any time`,
  },
  {
    icon: 'location',
    title: 'Location Data',
    content: `Location access is optional but enhances your experience:\n\n• We access your location only when the app is open and you've granted permission\n• Location is used to show nearby hostels and calculate distances\n• We do not track your location in the background\n• Location data is not stored on our servers beyond your session\n• You can revoke location permission at any time in your device settings`,
  },
  {
    icon: 'chatbubbles',
    title: 'Chat and Communications',
    content: `Messages within RoomLink chat:\n\n• Group messages are visible to all verified members of that university group\n• Direct messages are private between the two parties\n• Messages are stored on our secure servers to enable history\n• University group admins may moderate content for community safety\n• Reported messages may be reviewed by our safety team\n• You can delete your own messages at any time\n• We do not read private messages unless required by law or for safety investigations`,
  },
  {
    icon: 'handshake',
    title: 'Information Sharing',
    content: `We do not sell your personal information. We share data only:\n\n• With hostel owners: only your name and contact info when you initiate a booking inquiry\n• With service providers: trusted partners who help operate our platform (hosting, analytics) under strict data agreements\n• For legal compliance: when required by Tanzanian law, court order, or to protect user safety\n• Business transfers: in the event of a merger or acquisition, with appropriate privacy protections\n\nWe never share your student ID documents with hostel owners or other students.`,
  },
  {
    icon: 'lock-closed',
    title: 'Data Security',
    content: `We implement industry-standard security measures:\n\n• All data transmission is encrypted using TLS 1.3\n• Passwords are hashed using bcrypt — we never store plain-text passwords\n• Authentication is powered by Clerk, a leading identity platform\n• Student ID documents use AES-256 encryption at rest\n• Regular security audits and penetration testing\n• Automatic session expiry and suspicious login detection\n\nWhile we implement strong security measures, no system is 100% secure. We encourage you to use a strong, unique password.`,
  },
  {
    icon: 'alarm-clock',
    title: 'Data Retention',
    content: `We retain your data for as long as your account is active or as needed to provide services:\n\n• Account data: retained until you delete your account\n• Verification ID photos: deleted after successful verification (within 30 days)\n• Chat messages: retained for 2 years, then automatically deleted\n• Booking history: retained for 5 years for legal compliance\n• Usage logs: retained for 90 days\n\nYou may request deletion of your account and associated data at any time.`,
  },
  {
    icon: 'child',
    title: 'Age Requirements',
    content: `RoomLink is designed for university students aged 16 and above. We do not knowingly collect personal information from anyone under 16 years of age.\n\nIf you believe a child under 16 has provided us with personal information, please contact us immediately at privacy@roomlink.co.tz and we will delete such information promptly.`,
  },
  {
    icon: 'gavel',
    title: 'Your Rights',
    content: `Under Tanzanian data protection law, you have the right to:\n\n• Access: request a copy of your personal data\n• Correction: update inaccurate or incomplete information\n• Deletion: request deletion of your account and data\n• Portability: receive your data in a machine-readable format\n• Objection: opt out of certain data processing activities\n• Restriction: limit how we process your data in certain circumstances\n\nTo exercise these rights, contact us at privacy@roomlink.co.tz or use the Settings menu in your profile.`,
  },
  {
    icon: 'cookie',
    title: 'Cookies and Tracking',
    content: `Our mobile app does not use browser cookies. We use:\n\n• Secure device storage for session management\n• Analytics SDKs to understand app usage (anonymized data only)\n• Crash reporting tools to improve app stability\n\nYou can opt out of analytics data collection in your Profile → Settings → Privacy.`,
  },
  {
    icon: 'call',
    title: 'Contact & Complaints',
    content: `Data Protection Officer:\nRoomLink Technologies Ltd\nP.O. Box 12345, Dar es Salaam, Tanzania\nEmail: privacy@roomlink.co.tz\nPhone: +255 22 000 0001\n\nIf you have concerns about our privacy practices, you may also contact the Tanzania Communications Regulatory Authority (TCRA).\n\nLast updated: May 1, 2026`,
  },
];

const COMMITMENTS = themed((): { icon: IconName; label: string; color: string }[] => [
  { icon: 'ban', label: "We Don't\nSell Data", color: Colors.pink },
  { icon: 'lock-closed', label: 'ID Photos\nEncrypted', color: Colors.green },
  { icon: 'eye-off', label: 'No Background\nTracking', color: Colors.purple },
]);

const ICON_TINTS = themed(() => [Colors.yellowSoft, Colors.blueSoft, Colors.pinkSoft, Colors.greenSoft, Colors.purpleSoft, Colors.orangeSoft]);

export default function PrivacyScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Privacy policy" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <NeoCard color={Colors.cyan} shadow={5} radius={22} style={styles.hero}>
          <View style={[styles.heroIcon, hardShadow(3)]}><Icon name="lock-closed" size={30} color={Colors.ink} /></View>
          <Text style={styles.heroTitle}>Privacy Policy</Text>
          <Tag label="Effective May 1, 2026" icon="calendar" color={Colors.surface} size="md" style={styles.heroDate} />
          <Text style={styles.heroSubtitle}>
            At RoomLink, your privacy is our priority. This policy explains how we collect, use, and protect your personal information.
          </Text>
        </NeoCard>

        <View style={styles.commitmentRow}>
          {COMMITMENTS.map(c => (
            <View key={c.label} style={[styles.commitCard, { backgroundColor: c.color }, hardShadow(3)]}>
              <Icon name={c.icon} size={24} color={Colors.ink} />
              <Text style={styles.commitLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        {SECTIONS.map((section, i) => (
          <NeoCard key={section.title} shadow={3} radius={18} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: ICON_TINTS[i % ICON_TINTS.length] }]}>
                <Icon name={section.icon} size={18} color={Colors.ink} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </NeoCard>
        ))}

        <View style={styles.footer}>
          <Icon name="shield-checkmark" size={20} color={Colors.ink} />
          <Text style={styles.footerText}>
            This Privacy Policy is governed by the laws of the United Republic of Tanzania and complies with the Electronic and Postal Communications Act.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingBottom: 60 },
  hero: { padding: 22, marginBottom: 20, alignItems: 'center' },
  heroIcon: {
    width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: BorderWidth.base, borderColor: Colors.ink, marginBottom: 14,
    transform: [{ rotate: '4deg' }],
  },
  heroTitle: { fontFamily: Fonts.display, fontSize: 24, color: Colors.ink, marginBottom: 10 },
  heroDate: { alignSelf: 'center', marginBottom: 12 },
  heroSubtitle: { fontSize: 14, color: Colors.ink, textAlign: 'center', lineHeight: 20, fontWeight: '500' },
  commitmentRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  commitCard: {
    flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 8,
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  commitLabel: { fontSize: 11.5, color: Colors.ink, textAlign: 'center', fontWeight: '700', lineHeight: 15 },
  section: { padding: 18, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sectionIcon: {
    width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  sectionTitle: { fontFamily: Fonts.display, fontSize: 16, color: Colors.ink, flex: 1, lineHeight: 21 },
  sectionContent: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  footer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, borderRadius: 16, marginTop: 8,
    backgroundColor: Colors.greenSoft, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  footerText: { fontSize: 13, color: Colors.ink, lineHeight: 19, flex: 1 },
}));
