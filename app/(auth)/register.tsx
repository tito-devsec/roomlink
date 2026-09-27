import { useState } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSignUp, useOAuth, useClerk } from '@clerk/clerk-expo';
import { Icon } from '../../components/neo/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import {
  Checkbox, Chip, IconButton, NeoButton, NeoInput, Segmented, Text, KeyboardSafeView, type IconName,
} from '../../components/neo';
import {
  AuthBrand, CaptchaSlot, ErrorBanner, OrDivider, SocialButtons, type OAuthProvider,
} from '../../components/AuthParts';
import { HOME, resolveRole, roleMetadata, setRole } from '../../services/role';
import { saveMyProfile } from '../../services/profile';
import UniversityPicker from '../../components/UniversityPicker';

const YEAR_NUM: Record<string, number> = { '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4, '5th Year+': 5 };

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year+'];

const STRENGTH = themed(() => [
  { label: '', color: Colors.surface },
  { label: 'Weak', color: Colors.coral },
  { label: 'Fair', color: Colors.orange },
  { label: 'Good', color: Colors.cyan },
  { label: 'Strong', color: Colors.green },
]);

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  return (
    <View style={styles.strength}>
      <View style={styles.strengthBars}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={[styles.strengthBar, { backgroundColor: i <= score ? STRENGTH[score].color : Colors.surface }]} />
        ))}
      </View>
      {score > 0 && <Text style={styles.strengthLabel}>{STRENGTH[score].label}</Text>}
    </View>
  );
}

function StepDot({ n, label, step }: { n: number; label: string; step: number }) {
  const done = step > n;
  const current = step === n;
  return (
    <View style={styles.stepItem}>
      <View style={[
        styles.stepDot,
        { backgroundColor: done ? Colors.green : current ? Colors.yellow : Colors.surface },
        current && hardShadow(2),
      ]}>
        {done ? <Icon name="checkmark" size={16} color={Colors.ink} /> : <Text style={styles.stepNum}>{n}</Text>}
      </View>
      <Text style={[styles.stepLabel, current && styles.stepLabelOn]}>{label}</Text>
    </View>
  );
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string }>();
  const clerk = useClerk();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });
  const { startOAuthFlow: startFacebookOAuth } = useOAuth({ strategy: 'oauth_facebook' });

  const [tab, setTab] = useState<'login' | 'register'>('register');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: '', email: params.email || '', gender: '', university: '',
    yearOfStudy: '', phone: '', whatsapp: '', password: '', confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const switchTab = (next: 'login' | 'register') => {
    setTab(next);
    if (next === 'login') setTimeout(() => router.replace('/(auth)/login'), 180);
  };

  const validateStep1 = () => {
    if (!form.fullName.trim()) { setError('Full name is required'); return false; }
    if (!form.email.trim() || !form.email.includes('@')) { setError('Valid email is required'); return false; }
    if (!form.password || form.password.length < 8) { setError('Password must be at least 8 characters'); return false; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return false; }
    return true;
  };

  const handleRegister = async () => {
    if (!isLoaded) return;
    if (!agreedToTerms) { Alert.alert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy to continue.'); return; }
    setLoading(true); setError('');
    try {
      const nameParts = form.fullName.trim().split(' ');
      const result = await signUp.create({
        emailAddress: form.email.trim(),
        password: form.password,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || '',
        unsafeMetadata: roleMetadata('student'),
      });
      // Persist the student's university + basics so their community scoping and
      // roommate matching work from first launch.
      await saveMyProfile({
        full_name: form.fullName.trim(),
        university_id: form.university || undefined as any,
        gender: (form.gender?.toLowerCase() as any) || undefined,
        year_of_study: YEAR_NUM[form.yearOfStudy] || undefined,
      });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        await setRole('student');
        router.replace('/onboarding');
      } else if (result.status === 'missing_requirements') {
        // Email verification required — send the code and collect it properly.
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        await setRole('student');
        router.push({ pathname: '/(auth)/verify-email', params: { email: form.email.trim(), role: 'student' } });
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    try {
      const startFlow = provider === 'google' ? startGoogleOAuth : provider === 'apple' ? startAppleOAuth : startFacebookOAuth;
      const { createdSessionId, setActive: setOAuthActive } = await startFlow({
        redirectUrl: Linking.createURL('/onboarding', { scheme: 'roomlink' }),
        unsafeMetadata: roleMetadata('student'),
      });
      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        // The provider may have signed in an existing landlord account instead.
        const actual = await resolveRole(clerk.user, 'student');
        router.replace(actual === 'landlord' ? HOME.landlord : '/onboarding');
      }
    } catch (err: any) {
      Alert.alert('Sign-up failed', err.message || 'OAuth failed');
    }
  };

  return (
    <KeyboardSafeView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <IconButton icon="arrow-back" onPress={() => router.back()} style={styles.back} accessibilityLabel="Go back" />

        <AuthBrand tagline="Join thousands of students" />

        <Segmented
          options={[{ value: 'login', label: 'Log In' }, { value: 'register', label: 'Sign Up' }]}
          value={tab}
          onChange={switchTab}
          height={50}
          style={styles.segmented}
        />

        <View style={[styles.card, hardShadow(6)]}>
          <View style={styles.stepRow}>
            <StepDot n={1} label="Personal" step={step} />
            <View style={[styles.stepLine, step > 1 && styles.stepLineDone]} />
            <StepDot n={2} label="Academic" step={step} />
          </View>

          {error ? <ErrorBanner message={error} /> : null}

          {step === 1 ? (
            <>
              <Field label="Full name" icon="person" value={form.fullName} onChange={v => update('fullName', v)} placeholder="Enter your full name" />
              <Field label="Email" icon="mail" value={form.email} onChange={v => update('email', v)} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
              <Field label="Phone" icon="call" value={form.phone} onChange={v => update('phone', v)} placeholder="+255 7XX XXX XXX" keyboardType="phone-pad" />
              <Field label="WhatsApp" icon="logo-whatsapp" value={form.whatsapp} onChange={v => update('whatsapp', v)} placeholder="+255 7XX XXX XXX" keyboardType="phone-pad" />

              <View style={styles.group}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.chips}>
                  {GENDER_OPTIONS.map(g => (
                    <Chip key={g} label={g} active={form.gender === g} onPress={() => update('gender', g)} />
                  ))}
                </View>
              </View>

              <View style={styles.group}>
                <NeoInput
                  label="Password"
                  icon="lock-closed"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChangeText={v => update('password', v)}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  right={(
                    <Pressable onPress={() => setShowPass(!showPass)} hitSlop={10} accessibilityLabel={showPass ? 'Hide password' : 'Show password'}>
                      <Icon name={showPass ? 'eye' : 'eye-off'} size={20} color={Colors.ink} />
                    </Pressable>
                  )}
                />
                <PasswordStrength password={form.password} />
              </View>

              <Field label="Confirm password" icon="lock-closed" value={form.confirmPassword} onChange={v => update('confirmPassword', v)} placeholder="Repeat password" secureTextEntry autoCapitalize="none" />

              <NeoButton
                title="Next step"
                size="lg"
                iconRight="arrow-forward"
                style={styles.cta}
                onPress={() => { if (validateStep1()) { setError(''); setStep(2); } }}
              />
            </>
          ) : (
            <>
              <View style={[styles.group, styles.pickerGroup]}>
                <Text style={styles.label}>University</Text>
                <UniversityPicker value={form.university} onChange={(id) => update('university', id)} />
              </View>

              <View style={styles.group}>
                <Text style={styles.label}>Year of study</Text>
                <View style={styles.chips}>
                  {YEAR_OPTIONS.map(y => (
                    <Chip key={y} label={y} active={form.yearOfStudy === y} onPress={() => update('yearOfStudy', y)} />
                  ))}
                </View>
              </View>

              <Pressable style={styles.termsRow} onPress={() => setAgreedToTerms(!agreedToTerms)}>
                <Checkbox checked={agreedToTerms} />
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink} onPress={() => router.push('/legal/terms')}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink} onPress={() => router.push('/legal/privacy')}>Privacy Policy</Text>
                  , including the collection and verification of my student ID for account verification.
                </Text>
              </Pressable>

              <CaptchaSlot />

              <NeoButton
                title={loading ? 'Creating account…' : 'Create account'}
                onPress={handleRegister}
                loading={loading}
                size="lg"
                style={styles.cta}
              />

              <Pressable style={styles.backStep} onPress={() => { setStep(1); setError(''); }} hitSlop={8}>
                <Icon name="arrow-back" size={16} color={Colors.ink} />
                <Text style={styles.backStepText}>Back</Text>
              </Pressable>
            </>
          )}
        </View>

        <OrDivider label="or sign up with" />
        <SocialButtons onPress={handleOAuth} />
      </ScrollView>
    </KeyboardSafeView>
  );
}

function Field({ label, icon, value, onChange, placeholder, keyboardType, autoCapitalize, secureTextEntry }: {
  label: string; icon: IconName; value: string; onChange: (v: string) => void; placeholder: string;
  keyboardType?: 'email-address' | 'phone-pad'; autoCapitalize?: 'none' | 'words'; secureTextEntry?: boolean;
}) {
  return (
    <NeoInput
      label={label}
      icon={icon}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize || 'words'}
      secureTextEntry={secureTextEntry}
      containerStyle={styles.group}
    />
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.yellow },
  scroll: { paddingHorizontal: 20 },
  back: { alignSelf: 'flex-start' },
  segmented: { marginBottom: 20 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 22, padding: 20,
    borderWidth: BorderWidth.thick, borderColor: Colors.ink,
  },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 20 },
  stepItem: { alignItems: 'center', gap: 6, width: 80 },
  stepDot: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  stepNum: { fontFamily: Fonts.display, fontSize: 15, color: Colors.ink },
  stepLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  stepLabelOn: { color: Colors.ink, fontWeight: '700' },
  stepLine: { flex: 1, maxWidth: 70, height: BorderWidth.base, backgroundColor: Colors.ink, marginTop: 16, opacity: 0.25 },
  stepLineDone: { opacity: 1 },

  group: { marginBottom: 16 },
  pickerGroup: { zIndex: 20 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.ink, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  strength: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  strengthBars: { flex: 1, flexDirection: 'row', gap: 5 },
  strengthBar: { flex: 1, height: 10, borderRadius: 3, borderWidth: BorderWidth.thin, borderColor: Colors.ink },
  strengthLabel: { fontSize: 12, fontWeight: '700', color: Colors.ink, minWidth: 44, textAlign: 'right' },

  termsRow: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 18,
    backgroundColor: Colors.yellowSoft, padding: 14, borderRadius: 14,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  termsText: { flex: 1, fontSize: 13, color: Colors.ink, lineHeight: 19 },
  termsLink: { fontWeight: '700', textDecorationLine: 'underline' },

  cta: { marginTop: 6 },
  backStep: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 18 },
  backStepText: { color: Colors.ink, fontSize: 14, fontWeight: '700' },
}));
