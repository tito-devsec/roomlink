import { ScrollView, View, StyleSheet } from 'react-native';
import { Icon } from '../../components/neo/Icon';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import { NeoCard, ScreenHeader, Tag, Text } from '../../components/neo';

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    content: `By downloading, installing, or using the RoomLink mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.\n\nRoomLink is operated by RoomLink Technologies Ltd ("we," "us," or "our"). These Terms apply to all users of the App, including students seeking accommodation, hostel owners, and any other visitors.`,
  },
  {
    title: 'Eligibility',
    content: `To use RoomLink, you must:\n\n• Be at least 16 years of age\n• Be enrolled in a recognized university or tertiary institution in Tanzania\n• Provide accurate and complete registration information\n• Maintain the security of your account credentials\n\nBy using the App, you represent and warrant that you meet all eligibility requirements.`,
  },
  {
    title: 'Student Verification',
    content: `RoomLink offers a student verification program to promote trust and safety within our community. Verification requires:\n\n• Submission of a valid university student ID card (front and back)\n• A selfie photograph holding your student ID\n• Accurate personal information matching your ID\n\nVerification is processed within 24 hours. Submitting false documents or impersonating another person is grounds for immediate account termination and may result in legal action.\n\nYour verification documents are encrypted, stored securely, and never shared with third parties except as required by law.`,
  },
  {
    title: 'User Accounts',
    content: `You are responsible for:\n\n• Maintaining the confidentiality of your login credentials\n• All activities that occur under your account\n• Immediately notifying us of any unauthorized account use\n\nWe reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or pose a risk to other users.`,
  },
  {
    title: 'Hostel Listings',
    content: `Hostel owners who list properties on RoomLink agree that:\n\n• All listing information is accurate and up-to-date\n• Listed prices are inclusive of all advertised amenities\n• Properties comply with all applicable Tanzanian housing laws and regulations\n• Contact information provided is valid and monitored\n\nRoomLink does not own, manage, or operate any listed properties. We are a marketplace connecting students with accommodation providers.`,
  },
  {
    title: 'Bookings and Payments',
    content: `RoomLink facilitates connections between students and hostel owners. Booking and payment arrangements are made directly between users.\n\nRoomLink is not liable for:\n• Payment disputes between students and hostel owners\n• Failure to provide booked accommodation\n• Property conditions differing from listings\n\nWe strongly recommend:\n• Verifying accommodation before making any payment\n• Using documented payment methods\n• Reviewing our Booking Safety Guide`,
  },
  {
    title: 'Community Chat',
    content: `The RoomLink community chat features are provided for student interaction within university groups. Users must:\n\n• Communicate respectfully with all community members\n• Not share spam, offensive, or inappropriate content\n• Not advertise products or services without authorization\n• Not share personal contact information publicly\n\nGroup chats are moderated by designated community administrators. Violations may result in removal from the community or account suspension.\n\nMessages sent after joining a group are visible to all group members. You will not see messages sent before your join date.`,
  },
  {
    title: 'Prohibited Activities',
    content: `You may not use RoomLink to:\n\n• Post false, misleading, or fraudulent listings\n• Harass, threaten, or intimidate other users\n• Collect personal data of other users without consent\n• Reverse engineer or attempt to hack the App\n• Violate any applicable laws or regulations\n• Create multiple accounts to circumvent bans\n• Use the platform for any commercial purpose other than legitimate hostel rental`,
  },
  {
    title: 'Privacy',
    content: `Your privacy is important to us. Our Privacy Policy, incorporated into these Terms by reference, explains how we collect, use, and protect your personal information.\n\nBy using RoomLink, you consent to our data practices as described in the Privacy Policy. Please review it carefully.`,
  },
  {
    title: 'Intellectual Property',
    content: `The RoomLink App, including its logo, design, features, and content, is owned by RoomLink Technologies Ltd and protected by applicable intellectual property laws.\n\nYou may not copy, modify, distribute, or create derivative works based on our App or content without prior written permission.`,
  },
  {
    title: 'Limitation of Liability',
    content: `To the maximum extent permitted by Tanzanian law, RoomLink shall not be liable for:\n\n• Indirect, incidental, or consequential damages\n• Loss of data or profits\n• Personal injury or property damage arising from use of listed accommodations\n• Any damages exceeding the amount paid by you to RoomLink in the preceding 12 months\n\nRoomLink provides the platform "as is" without warranties of any kind.`,
  },
  {
    title: 'Changes to Terms',
    content: `We reserve the right to modify these Terms at any time. We will notify users of material changes via email or in-app notification. Continued use of the App after changes constitutes acceptance of the updated Terms.\n\nWe recommend reviewing these Terms periodically.`,
  },
  {
    title: 'Contact Us',
    content: `For questions about these Terms, contact us:\n\nRoomLink Technologies Ltd\nDar es Salaam, Tanzania\nEmail: legal@roomlink.co.tz\nPhone: +255 22 000 0000\n\nLast updated: May 2026`,
  },
];

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Terms of service" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <NeoCard color={Colors.yellow} shadow={5} radius={22} style={styles.hero}>
          <View style={[styles.heroIcon, hardShadow(3)]}>
            <Icon name="clipboard" size={30} color={Colors.ink} />
          </View>
          <Text style={styles.heroTitle}>Terms of Service</Text>
          <Tag label="Effective May 1, 2026" icon="calendar" color={Colors.surface} size="md" style={styles.heroDate} />
          <Text style={styles.heroSubtitle}>
            Please read these terms carefully before using RoomLink. By using our app, you agree to be bound by these terms.
          </Text>
        </NeoCard>

        {SECTIONS.map((section, index) => (
          <NeoCard key={section.title} shadow={3} radius={18} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNum}>
                <Text style={styles.sectionNumText}>{index + 1}</Text>
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </NeoCard>
        ))}

        <View style={styles.footer}>
          <Icon name="shield-checkmark" size={20} color={Colors.ink} />
          <Text style={styles.footerText}>
            These Terms of Service were last updated on May 1, 2026 and are governed by the laws of the United Republic of Tanzania.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingBottom: 60 },
  hero: { padding: 22, marginBottom: 24, alignItems: 'center' },
  heroIcon: {
    width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: BorderWidth.base, borderColor: Colors.ink, marginBottom: 14,
    transform: [{ rotate: '-4deg' }],
  },
  heroTitle: { fontFamily: Fonts.display, fontSize: 24, color: Colors.ink, marginBottom: 10 },
  heroDate: { alignSelf: 'center', marginBottom: 12 },
  heroSubtitle: { fontSize: 14, color: Colors.ink, textAlign: 'center', lineHeight: 20, fontWeight: '500' },
  section: { padding: 18, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sectionNum: {
    width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.yellow, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  sectionNumText: { fontFamily: Fonts.display, fontSize: 14, color: Colors.ink },
  sectionTitle: { fontFamily: Fonts.display, fontSize: 16, color: Colors.ink, flex: 1, lineHeight: 21 },
  sectionContent: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  footer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, borderRadius: 16, marginTop: 8,
    backgroundColor: Colors.greenSoft, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  footerText: { fontSize: 13, color: Colors.ink, lineHeight: 19, flex: 1 },
}));
