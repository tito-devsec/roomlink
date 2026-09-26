import { useState } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderWidth, Colors, Fonts, themed } from '../../constants/Colors';
import { Checkbox, NeoButton, NeoInput, ScreenHeader, Tag, Text, type IconName } from '../../components/neo';
import { CaptchaSlot, ErrorBanner } from '../../components/AuthParts';
import { roleMetadata, setRole } from '../../services/role';

function Field({ label, icon, value, onChange, placeholder, keyboardType, secureTextEntry, autoCapitalize }: {
  label: string; icon: IconName; value: string; onChange: (v: string) => void; placeholder: string;
  keyboardType?: 'email-address' | 'phone-pad'; secureTextEntry?: boolean; autoCapitalize?: 'none';
}) {
  return (
    <NeoInput
      label={label}
      icon={icon}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      containerStyle={styles.field}
    />
  );
}

export default function LandlordRegisterScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string }>();
  const { signUp, setActive, isLoaded } = useSignUp();
  const [form, setForm] = useState({
    fullName: '', businessName: '', email: params.email || '', phone: '',
    nationalId: '', password: '', confirmPassword: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    setError('');
    if (!form.fullName.trim()) return setError('Full name is required');
    if (!form.businessName.trim()) return setError('Business name is required');
    if (!form.email.includes('@')) return setError('A valid email is required');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (!agreed) return Alert.alert('Terms required', 'Please agree to the Terms and Privacy Policy.');
    if (!isLoaded) return;

    setLoading(true);
    try {
      const parts = form.fullName.trim().split(' ');
      const result = await signUp.create({
        emailAddress: form.email.trim(),
        password: form.password,
        firstName: parts[0],
        lastName: parts.slice(1).join(' ') || '',
        unsafeMetadata: roleMetadata('landlord'),
      });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        await setRole('landlord');
        Alert.alert(
          'Account created',
          'Your landlord account is pending verification by the RoomLink team. You can set up your first listing now; it will publish once you’re approved.',
          [{ text: 'Continue', onPress: () => router.replace('/(landlord)/dashboard') }],
        );
      } else {
        // Email verification required — collect the code before activating.
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        await setRole('landlord');
        router.push({ pathname: '/(auth)/verify-email', params: { email: form.email.trim(), role: 'landlord' } });
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Landlord sign up" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>List your rooms.</Text>
        <Tag label="Reach verified students" icon="business" color={Colors.purple} size="md" shadow={2} style={styles.badge} />

        <Field label="Full name" icon="person" value={form.fullName} onChange={v => update('fullName', v)} placeholder="Your name" />
        <Field label="Business / property name" icon="business" value={form.businessName} onChange={v => update('businessName', v)} placeholder="e.g. Blue Horizon Hostels" />
        <Field label="Email" icon="mail" value={form.email} onChange={v => update('email', v)} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone" icon="call" value={form.phone} onChange={v => update('phone', v)} placeholder="+255 7XX XXX XXX" keyboardType="phone-pad" />
        <Field label="National ID (NIDA)" icon="card" value={form.nationalId} onChange={v => update('nationalId', v)} placeholder="ID number" />
        <Field label="Password" icon="lock-closed" value={form.password} onChange={v => update('password', v)} placeholder="Min 8 characters" secureTextEntry autoCapitalize="none" />
        <Field label="Confirm password" icon="lock-closed" value={form.confirmPassword} onChange={v => update('confirmPassword', v)} placeholder="Repeat password" secureTextEntry autoCapitalize="none" />

        <Pressable style={styles.terms} onPress={() => setAgreed(a => !a)}>
          <Checkbox checked={agreed} />
          <Text style={styles.termsText}>I agree to the Terms of Service and Privacy Policy</Text>
        </Pressable>

        {!!error && <ErrorBanner message={error} />}

        <CaptchaSlot />

        <NeoButton
          title={loading ? 'Creating account…' : 'Create landlord account'}
          variant="purple"
          size="lg"
          loading={loading}
          onPress={handleRegister}
        />

        <Pressable
          style={styles.loginLink}
          onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'landlord' } })}
          hitSlop={8}
        >
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginStrong}>Log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 22 },
  title: { fontFamily: Fonts.display, fontSize: 30, color: Colors.ink, marginBottom: 12 },
  badge: { marginBottom: 26 },
  field: { marginBottom: 16 },
  terms: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, marginBottom: 20,
    backgroundColor: Colors.purpleSoft, padding: 14, borderRadius: 14,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  termsText: { flex: 1, color: Colors.ink, fontSize: 14, fontWeight: '500' },
  loginLink: { alignItems: 'center', marginTop: 22 },
  loginText: { color: Colors.ink, fontSize: 14 },
  loginStrong: { fontWeight: '700', textDecorationLine: 'underline' },
}));
