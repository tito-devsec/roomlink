// Help & Support: searchable answers grouped by topic, plus every way to reach
// the RoomLink team. Opened from Profile (tenants) and Account (landlords);
// `?role=landlord` starts on the landlord topic.

import { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../constants/Colors';
import { Config, computeServiceFee } from '../constants/Config';
import {
  EmptyState, Icon, NeoButton, NeoCard, NeoInput, NeoPressable, ScreenHeader, SectionHeader, Text,
  type IconName,
} from '../components/neo';

type TopicId = 'booking' | 'payments' | 'account' | 'safety' | 'landlords' | 'app';

const TOPICS = themed((): { id: TopicId; label: string; icon: IconName; color: string }[] => [
  { id: 'booking', label: 'Booking & fees', icon: 'receipt', color: Colors.yellow },
  { id: 'payments', label: 'Payments', icon: 'wallet', color: Colors.green },
  { id: 'account', label: 'Account', icon: 'person', color: Colors.cyan },
  { id: 'safety', label: 'Safety', icon: 'shield-checkmark', color: Colors.coral },
  { id: 'landlords', label: 'Landlords', icon: 'business', color: Colors.purple },
  { id: 'app', label: 'Using the app', icon: 'phone-portrait', color: Colors.pink },
]);

const feeRate = `${Math.round(Config.SERVICE_FEE_RATE * 100)}%`;
const feeExample = `TZS ${(80_000).toLocaleString()} rent → TZS ${computeServiceFee(80_000).toLocaleString()} fee`;
const networks = Config.PAYMENT_NETWORKS.map(n => n.label);
const networkList = `${networks.slice(0, -1).join(', ')} and ${networks[networks.length - 1]}`;

const FAQS: { topic: TopicId; q: string; a: string }[] = [
  {
    topic: 'booking', q: 'How do I book a room?',
    a: 'Open a hostel, check that rooms are free and tap Book. You pay RoomLink’s one-time service fee by mobile money, the landlord confirms the request, and we connect you to arrange a visit and move in.',
  },
  {
    topic: 'booking', q: 'What is the service fee?',
    a: `A one-time fee of ${feeRate} of one month’s rent, paid when you book (${feeExample}). It is usually far less than a broker, who often charges a full month’s rent.`,
  },
  {
    topic: 'booking', q: 'Do I pay rent through RoomLink?',
    a: 'No. RoomLink only collects the one-time service fee. You pay rent directly to the landlord once you move in.',
  },
  {
    topic: 'payments', q: 'Which payment methods can I use?',
    a: `${networkList}. After you enter your number, approve the payment prompt that appears on your phone.`,
  },
  {
    topic: 'payments', q: 'My payment failed or is still pending',
    a: 'Check that your phone is on, has enough balance, and that you approved the prompt, then try again. If money left your account but the booking did not confirm, contact us with the transaction ID and we will sort it out.',
  },
  {
    topic: 'account', q: 'How do I verify my student status?',
    a: 'Go to Profile, tap Get verified and upload your student ID. Verified students get a badge that landlords trust.',
  },
  {
    topic: 'account', q: 'How do I switch between tenant and landlord?',
    a: 'Tenant and landlord accounts are separate. Sign out from your profile, then log in or create an account and pick the other role on the login screen.',
  },
  {
    topic: 'account', q: 'I forgot my password',
    a: 'On the login screen, type your email and tap Forgot password. We will email you a code to set a new one.',
  },
  {
    topic: 'safety', q: 'Can I contact landlords directly?',
    a: 'For your safety, every enquiry goes through the RoomLink team, who confirm the room with the landlord for you. Chat with us or send a WhatsApp message below.',
  },
  {
    topic: 'safety', q: 'How do I report a listing or a person?',
    a: 'Send us the hostel name and what happened through chat or email. We review every report and remove listings that break our rules.',
  },
  {
    topic: 'landlords', q: 'How do I list a room?',
    a: 'From your dashboard tap Add a new room, then add the details and photos (5 recommended). The RoomLink team reviews it and publishes it once approved.',
  },
  {
    topic: 'landlords', q: 'Why does my account say “Verification pending”?',
    a: 'The RoomLink team checks every new landlord. You can set up listings meanwhile; they go live as soon as you are approved.',
  },
  {
    topic: 'landlords', q: 'How do booking requests work?',
    a: 'A student pays the service fee to request a room. Accept or decline it in Bookings. When you accept, RoomLink connects you with the student to arrange a visit, and you collect rent directly. Declining costs you nothing.',
  },
  {
    topic: 'app', q: 'How do I switch to dark mode?',
    a: 'Open your profile and turn on Dark mode. Turn it off to go back to the light theme; RoomLink remembers your choice.',
  },
  {
    topic: 'app', q: 'Where are the hostels I saved?',
    a: 'Tap the heart on any hostel to save it. You will find them all in Profile under Saved hostels.',
  },
  {
    topic: 'app', q: 'How do I find hostels near my campus?',
    a: 'Open the Map tab to see hostels and universities around you, and tap any price pin to see the room details.',
  },
];

// Shown before any topic or search is picked.
const POPULAR = [
  'How do I book a room?', 'What is the service fee?', 'Which payment methods can I use?',
  'Can I contact landlords directly?', 'How do I switch between tenant and landlord?',
];

const openLink = (url: string, fallback: string) =>
  Linking.openURL(url).catch(() => Alert.alert('Could not open', fallback));

const whatsappUrl = (text: string) =>
  `https://wa.me/${Config.ADMIN_CONTACT_NUMBER.replace('+', '')}?text=${encodeURIComponent(text)}`;

function FaqItem({ q, a, open, onToggle, last }: {
  q: string; a: string; open: boolean; onToggle: () => void; last: boolean;
}) {
  return (
    <View style={[styles.faq, !last && styles.faqBorder]}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.faqHead, pressed && styles.faqPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.faqQ}>{q}</Text>
        <View style={[styles.faqChevron, open && styles.faqChevronOpen]}>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.ink} />
        </View>
      </Pressable>
      {open ? <Text style={styles.faqA}>{a}</Text> : null}
    </View>
  );
}

function ContactCard({ icon, title, detail, color, onPress }: {
  icon: IconName; title: string; detail: string; color: string; onPress: () => void;
}) {
  return (
    <NeoPressable onPress={onPress} shadow={3} style={styles.contact} accessibilityLabel={title}>
      <View style={[styles.contactIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={20} color={Colors.ink} />
      </View>
      <Text style={styles.contactTitle}>{title}</Text>
      <Text style={styles.contactDetail} numberOfLines={2}>{detail}</Text>
    </NeoPressable>
  );
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: string }>();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<TopicId | null>(params.role === 'landlord' ? 'landlords' : null);
  const [openQ, setOpenQ] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && !topic) return FAQS.filter(f => POPULAR.includes(f.q));
    return FAQS.filter(f =>
      (!topic || f.topic === topic) &&
      (!q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)));
  }, [query, topic]);

  const activeTopic = TOPICS.find(t => t.id === topic);
  const filtered = !!topic || query.trim() !== '';
  const listTitle = query.trim() ? 'Results' : activeTopic ? activeTopic.label : 'Popular questions';

  const reportProblem = () => openLink(
    `mailto:${Config.SUPPORT_EMAIL}?subject=${encodeURIComponent('Problem report')}&body=${encodeURIComponent(
      `What happened:\n\n\nRoomLink ${Config.APP_VERSION} · ${Platform.OS}`,
    )}`,
    `Email us at ${Config.SUPPORT_EMAIL}.`,
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Help & Support" subtitle="Answers and the RoomLink team" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <NeoCard color={Colors.yellow} shadow={5} radius={22} style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.flex}>
              <Text style={styles.heroTitle}>How can we help?</Text>
              <Text style={styles.heroSub}>Search answers or reach the RoomLink team.</Text>
            </View>
            <View style={[styles.heroBadge, hardShadow(3)]}>
              <Icon name="help-circle" size={26} color={Colors.ink} />
            </View>
          </View>
          <NeoInput
            icon="search"
            placeholder="Search answers"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
            containerStyle={styles.search}
            right={query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
                <Icon name="close" size={18} color={Colors.ink} />
              </Pressable>
            ) : undefined}
          />
        </NeoCard>

        <SectionHeader title="Browse topics" style={styles.sectionHead} />
        <View style={styles.topics}>
          {TOPICS.map(t => {
            const on = topic === t.id;
            const count = FAQS.filter(f => f.topic === t.id).length;
            return (
              <NeoPressable
                key={t.id}
                onPress={() => { setTopic(on ? null : t.id); setOpenQ(null); }}
                shadow={on ? 4 : 3}
                style={[styles.topic, on && { backgroundColor: t.color }]}
                accessibilityLabel={`${t.label}, ${count} answers`}
                accessibilityState={{ selected: on }}
              >
                <View style={[styles.topicIcon, { backgroundColor: on ? Colors.surface : t.color }]}>
                  <Icon name={t.icon} size={18} color={Colors.ink} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.topicLabel} numberOfLines={2}>{t.label}</Text>
                  <Text style={styles.topicCount}>{count} answers</Text>
                </View>
              </NeoPressable>
            );
          })}
        </View>

        <SectionHeader
          title={listTitle}
          action={filtered ? 'Show all' : undefined}
          onAction={() => { setTopic(null); setQuery(''); }}
          style={styles.sectionHead}
        />
        {results.length ? (
          <NeoCard shadow={4} radius={18} clip>
            {results.map((f, i) => (
              <FaqItem
                key={f.q}
                q={f.q}
                a={f.a}
                open={openQ === f.q}
                onToggle={() => setOpenQ(o => (o === f.q ? null : f.q))}
                last={i === results.length - 1}
              />
            ))}
          </NeoCard>
        ) : (
          <EmptyState
            icon="search"
            color={Colors.cyan}
            title="No answers found"
            subtitle="Try other words, or ask the RoomLink team below."
            style={styles.empty}
          />
        )}

        <SectionHeader title="Still need help?" style={styles.sectionHead} />
        <View style={styles.contacts}>
          <ContactCard
            icon="chatbubbles"
            title="Chat with us"
            detail="Reply in the app"
            color={Colors.blueSoft}
            onPress={() => router.push('/chat/admin')}
          />
          {Config.ADMIN_CONTACT_READY ? (
            <ContactCard
              icon="logo-whatsapp"
              title="WhatsApp"
              detail={Config.ADMIN_CONTACT_NUMBER}
              color={Colors.green}
              onPress={() => openLink(whatsappUrl('Hello RoomLink, I need help with '), `Message us on ${Config.ADMIN_CONTACT_NUMBER}.`)}
            />
          ) : null}
          <ContactCard
            icon="mail"
            title="Email"
            detail={Config.SUPPORT_EMAIL.replace('@', '@​')} // may wrap after the @
            color={Colors.orange}
            onPress={() => openLink(`mailto:${Config.SUPPORT_EMAIL}`, `Email us at ${Config.SUPPORT_EMAIL}.`)}
          />
          {Config.ADMIN_CONTACT_READY ? (
            <ContactCard
              icon="call"
              title="Call"
              detail={Config.ADMIN_CONTACT_NUMBER}
              color={Colors.cyan}
              onPress={() => openLink(`tel:${Config.ADMIN_CONTACT_NUMBER}`, `Call us on ${Config.ADMIN_CONTACT_NUMBER}.`)}
            />
          ) : null}
        </View>

        <NeoButton title="Report a problem" icon="alert-circle" variant="secondary" onPress={reportProblem} style={styles.report} />

        <View style={styles.footer}>
          <Pressable onPress={() => router.push('/legal/terms')} hitSlop={8}>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable onPress={() => router.push('/legal/privacy')} hitSlop={8}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Pressable>
        </View>
        <Text style={styles.version}>RoomLink {Config.APP_VERSION}</Text>
      </ScrollView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20 },
  flex: { flex: 1 },

  hero: { padding: 18 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heroTitle: { fontFamily: Fonts.display, fontSize: 24, color: Colors.ink },
  heroSub: { fontSize: 14, color: Colors.ink, marginTop: 4, fontWeight: '500' },
  heroBadge: {
    width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: BorderWidth.base, borderColor: Colors.ink,
    transform: [{ rotate: '6deg' }],
  },
  search: { marginTop: 16 },

  sectionHead: { marginTop: 28, marginBottom: 14 },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  topic: {
    flexGrow: 1, flexBasis: '46%', flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 16, backgroundColor: Colors.surface,
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  topicIcon: {
    width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  topicLabel: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  topicCount: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  faq: { backgroundColor: Colors.surface },
  faqBorder: { borderBottomWidth: BorderWidth.thin, borderBottomColor: Colors.ink },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
  faqPressed: { backgroundColor: Colors.yellowSoft },
  faqQ: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.ink },
  faqChevron: {
    width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bg, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  faqChevronOpen: { backgroundColor: Colors.yellow },
  faqA: { paddingHorizontal: 16, paddingBottom: 16, marginTop: -4, fontSize: 14, lineHeight: 21, color: Colors.textSecondary },
  empty: { paddingTop: 12 },

  contacts: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  contact: {
    flexGrow: 1, flexBasis: '46%', padding: 14, borderRadius: 18, gap: 4,
    backgroundColor: Colors.surface, borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  contactIcon: {
    width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  contactTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  contactDetail: { fontSize: 12, color: Colors.textSecondary },

  report: { marginTop: 22 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 26 },
  footerLink: { fontSize: 13, fontWeight: '700', color: Colors.ink, textDecorationLine: 'underline' },
  footerDot: { color: Colors.textMuted },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 8 },
}));
