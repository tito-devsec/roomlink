import { useState, type ReactNode } from 'react';
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../components/neo/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../constants/Colors';
import { IconButton, NeoButton, NeoPressable, ProgressBar, Text, type IconName } from '../components/neo';
import UniversityPicker from '../components/UniversityPicker';
import { saveMyProfile } from '../services/profile';


const STEPS = themed((): { id: string; title: string; subtitle: string; icon: IconName; color: string }[] => [
  { id: 'university', title: 'Your University', subtitle: 'We\'ll show hostels near your campus', icon: 'school', color: Colors.cyan },
  { id: 'type', title: 'Room Type', subtitle: 'What kind of accommodation are you looking for?', icon: 'home', color: Colors.purple },
  { id: 'budget', title: 'Monthly Budget', subtitle: 'Set your comfortable price range', icon: 'wallet', color: Colors.green },
  { id: 'gender', title: 'Gender Preference', subtitle: 'Choose your preferred accommodation type', icon: 'people', color: Colors.pink },
]);

const ROOM_TYPES: { id: string; label: string; desc: string; icon: IconName }[] = [
  { id: 'hostel', label: 'Hostel', desc: 'Shared facilities, community vibe', icon: 'bed' },
  { id: 'private_room', label: 'Private Room', desc: 'Your own space, shared common areas', icon: 'home' },
  { id: 'shared_room', label: 'Shared Room', desc: 'Split costs with a roommate', icon: 'people' },
  { id: 'apartment', label: 'Apartment', desc: 'Full independence & privacy', icon: 'business' },
];

const BUDGET_RANGES = [
  { label: 'Budget', range: '50k - 100k', min: 50000, max: 100000 },
  { label: 'Standard', range: '100k - 200k', min: 100000, max: 200000 },
  { label: 'Comfort', range: '200k - 350k', min: 200000, max: 350000 },
  { label: 'Premium', range: '350k+', min: 350000, max: 999999 },
];

const GENDER_PREFS: { id: string; label: string; icon: IconName }[] = [
  { id: 'mixed', label: 'Mixed', icon: 'people' },
  { id: 'male', label: 'Males Only', icon: 'male' },
  { id: 'female', label: 'Females Only', icon: 'female' },
];

// Two budget cards per row inside 24px padding with a 14px gap.

function CheckBadge() {
  return (
    <View style={styles.checkBadge}>
      <Icon name="checkmark" size={15} color={Colors.yellow} />
    </View>
  );
}

function OptionCard({ selected, onPress, children }: { selected: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <NeoPressable
      onPress={onPress}
      shadow={selected ? 4 : 3}
      haptic="selection"
      accessibilityState={{ selected }}
      style={[styles.optionCard, selected && styles.optionCardActive]}
    >
      {children}
      {selected && <CheckBadge />}
    </NeoPressable>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const budgetW = (width - 48 - 14) / 2; // two per row inside 24px padding
  const [currentStep, setCurrentStep] = useState(0);
  const [prefs, setPrefs] = useState({
    university: '',
    roomType: '',
    budget: null as any,
    gender: '',
  });

  const persist = async () => {
    const budget = prefs.budget || {};
    await saveMyProfile({
      university_id: prefs.university || undefined as any,
      gender: (prefs.gender?.toLowerCase() as any) || undefined,
      budget_min: (budget as any).min,
      budget_max: (budget as any).max,
    });
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      persist().finally(() => router.replace('/(tabs)'));
    }
  };

  const skip = () => router.replace('/(tabs)');

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <View style={[styles.stepCount, hardShadow(2)]}>
          <Text style={styles.stepCountText}>{currentStep + 1}/{STEPS.length}</Text>
        </View>
        <ProgressBar progress={(currentStep + 1) / STEPS.length} style={styles.progress} />
        <Pressable onPress={skip} hitSlop={10}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.heroSection}>
        <View style={[
          styles.heroTile,
          { backgroundColor: step.color, transform: [{ rotate: currentStep % 2 ? '4deg' : '-4deg' }] },
          hardShadow(6),
        ]}>
          <Icon name={step.icon} size={40} color={Colors.ink} />
        </View>
      </View>

      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.subtitle}>{step.subtitle}</Text>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {currentStep === 0 && (
          <View>
            <UniversityPicker
              value={prefs.university}
              onChange={(id) => setPrefs(p => ({ ...p, university: id }))}
            />
            <Text style={styles.pickerHint}>
              Start typing to find your university. This sets the community you'll join.
            </Text>
          </View>
        )}

        {currentStep === 1 && (
          <View style={styles.optionList}>
            {ROOM_TYPES.map(rt => {
              const on = prefs.roomType === rt.id;
              return (
                <OptionCard key={rt.id} selected={on} onPress={() => setPrefs(p => ({ ...p, roomType: rt.id }))}>
                  <View style={styles.optionIcon}>
                    <Icon name={rt.icon} size={22} color={Colors.ink} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{rt.label}</Text>
                    <Text style={styles.optionDesc}>{rt.desc}</Text>
                  </View>
                </OptionCard>
              );
            })}
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.budgetGrid}>
            {BUDGET_RANGES.map(b => {
              const on = prefs.budget?.label === b.label;
              return (
                <NeoPressable
                  key={b.label}
                  onPress={() => setPrefs(p => ({ ...p, budget: b }))}
                  shadow={on ? 4 : 3}
                  haptic="selection"
                  accessibilityState={{ selected: on }}
                  style={[styles.budgetCard, { width: budgetW }, on && styles.optionCardActive]}
                >
                  <Text style={styles.budgetLabel}>{b.label}</Text>
                  <Text style={styles.budgetRange}>TZS {b.range}</Text>
                  {on && <View style={styles.budgetCheck}><CheckBadge /></View>}
                </NeoPressable>
              );
            })}
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.optionList}>
            {GENDER_PREFS.map(g => {
              const on = prefs.gender === g.id;
              return (
                <OptionCard key={g.id} selected={on} onPress={() => setPrefs(p => ({ ...p, gender: g.id }))}>
                  <View style={styles.optionIcon}>
                    <Icon name={g.icon} size={22} color={Colors.ink} />
                  </View>
                  <Text style={[styles.optionTitle, styles.optionText]}>{g.label}</Text>
                </OptionCard>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {currentStep > 0 && (
          <IconButton icon="arrow-back" size={58} shadow={4} onPress={() => setCurrentStep(s => s - 1)} accessibilityLabel="Previous step" />
        )}
        <NeoButton
          title={isLast ? 'Get started' : 'Continue'}
          iconRight={isLast ? 'checkmark' : 'arrow-forward'}
          size="lg"
          onPress={next}
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, marginBottom: 28 },
  stepCount: {
    backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  stepCountText: { color: Colors.ink, fontSize: 13, fontWeight: '700' },
  progress: { flex: 1 },
  skipText: { color: Colors.ink, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },

  heroSection: { alignItems: 'center', marginBottom: 22 },
  heroTile: {
    width: 90, height: 90, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.thick, borderColor: Colors.ink,
  },
  title: { fontFamily: Fonts.display, fontSize: 28, color: Colors.ink, textAlign: 'center', marginBottom: 8, paddingHorizontal: 24 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24, paddingHorizontal: 32, lineHeight: 21 },

  content: { flex: 1 },
  contentInner: { paddingHorizontal: 24, paddingBottom: 24 },
  optionList: { gap: 14 },
  pickerHint: { fontSize: 13, color: Colors.textSecondary, marginTop: 14, lineHeight: 19 },

  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 14,
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  optionCardActive: { backgroundColor: Colors.yellow },
  optionIcon: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  optionText: { flex: 1 },
  optionTitle: { color: Colors.ink, fontSize: 16, fontWeight: '700' },
  optionDesc: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  checkBadge: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },

  budgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  budgetCard: {
    minHeight: 96, justifyContent: 'flex-end',
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  budgetLabel: { fontFamily: Fonts.display, fontSize: 18, color: Colors.ink, marginBottom: 4 },
  budgetRange: { fontSize: 13, fontWeight: '600', color: Colors.ink },
  budgetCheck: { position: 'absolute', top: 10, right: 10 },

  footer: {
    flexDirection: 'row', gap: 14, paddingHorizontal: 24, paddingTop: 16,
    borderTopWidth: BorderWidth.base, borderTopColor: Colors.ink, backgroundColor: Colors.bg,
  },
  nextBtn: { flex: 1 },
}));
