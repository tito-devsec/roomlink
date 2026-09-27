// Verify email — the missing step of registration.
//
// Clerk sends a 6-digit code to the email used at sign-up. This screen collects
// it, verifies via attemptEmailAddressVerification, activates the session, and
// routes by role (student → onboarding, landlord → dashboard).

import { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator, Alert,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSignUp, useClerk } from '@clerk/clerk-expo';
import { Icon } from '../../components/neo/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import { IconButton, NeoButton, Text, KeyboardSafeView } from '../../components/neo';
import { resolveRole } from '../../services/role';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30;
const CODE_GAP = 8;

export default function VerifyEmailScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Fit six boxes (plus their 4px shadows) inside the 24px side padding.
  const boxW = Math.min(50, Math.floor((width - 48 - CODE_GAP * 5 - 4) / CODE_LENGTH));
  const clerk = useClerk();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { email, role } = useLocalSearchParams<{ email: string; role: string }>();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const setDigit = (i: number, val: string) => {
    // Support paste of the full code into any box.
    const clean = val.replace(/\D/g, '');
    if (clean.length > 1) {
      const next = Array(CODE_LENGTH).fill('');
      clean.slice(0, CODE_LENGTH).split('').forEach((c, idx) => { next[idx] = c; });
      setDigits(next);
      const last = Math.min(clean.length, CODE_LENGTH) - 1;
      inputs.current[last]?.focus();
      if (clean.length >= CODE_LENGTH) verify(next.join(''));
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < CODE_LENGTH - 1) inputs.current[i + 1]?.focus();
    if (next.every(d => d !== '')) verify(next.join(''));
  };

  const onKeyPress = (i: number, key: string) => {
    if (key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const verify = async (code: string) => {
    if (!isLoaded || loading) return;
    setLoading(true); setError('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        const actual = await resolveRole(clerk.user, role === 'landlord' ? 'landlord' : 'student');
        if (actual === 'landlord') {
          Alert.alert(
            'Email verified',
            'Your landlord account is pending approval by the RoomLink team. You can set up your first listing now; it publishes once approved.',
            [{ text: 'Continue', onPress: () => router.replace('/(landlord)/dashboard') }],
          );
        } else {
          router.replace('/onboarding');
        }
      } else {
        setError('Verification incomplete — please try the code again.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Invalid or expired code');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!isLoaded || cooldown > 0) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setCooldown(RESEND_COOLDOWN);
      setError('');
      Alert.alert('Code sent', `We emailed a new code to ${email || 'your address'}.`);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Could not resend the code');
    }
  };

  return (
    <KeyboardSafeView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <IconButton icon="arrow-back" onPress={() => router.back()} style={styles.back} accessibilityLabel="Go back" />

        <View style={[styles.iconTile, hardShadow(5)]}>
          <Icon name="mail-open" size={34} color={Colors.white} />
        </View>

        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a {CODE_LENGTH}-digit code to{'\n'}
          <Text style={styles.email}>{email || 'your email address'}</Text>
        </Text>

        <View style={styles.codeRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={r => { inputs.current[i] = r; }}
              style={[
                styles.codeBox,
                { width: boxW },
                d !== '' && styles.codeBoxFilled,
                error !== '' && styles.codeBoxError,
                hardShadow(focusedIdx === i ? 4 : 3),
              ]}
              value={d}
              onChangeText={v => setDigit(i, v)}
              onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
              onFocus={() => setFocusedIdx(i)}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH} // allows paste
              autoFocus={i === 0}
              selectTextOnFocus
              selectionColor={Colors.blue}
            />
          ))}
        </View>

        {error !== '' && <Text style={styles.error}>{error}</Text>}
        {loading && <ActivityIndicator color={Colors.ink} style={styles.spinner} />}

        <NeoButton
          title={loading ? 'Verifying…' : 'Verify email'}
          size="lg"
          onPress={() => verify(digits.join(''))}
          disabled={loading || digits.some(d => d === '')}
          style={styles.verifyBtn}
        />

        <Pressable onPress={resend} disabled={cooldown > 0} style={styles.resendWrap} hitSlop={8}>
          <Text style={[styles.resendText, cooldown > 0 && styles.resendWaiting]}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardSafeView>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { alignItems: 'center', paddingHorizontal: 24 },
  back: { alignSelf: 'flex-start', marginBottom: 28 },
  iconTile: {
    width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.blue, borderWidth: BorderWidth.thick, borderColor: Colors.ink, marginBottom: 24,
    transform: [{ rotate: '-4deg' }],
  },
  title: { fontFamily: Fonts.display, fontSize: 28, color: Colors.ink, marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  email: { color: Colors.ink, fontWeight: '700' },
  codeRow: { flexDirection: 'row', gap: CODE_GAP, marginBottom: 8 },
  codeBox: {
    height: 58, borderRadius: 12, textAlign: 'center',
    fontFamily: Fonts.display, fontSize: 24, color: Colors.ink,
    backgroundColor: Colors.surface, borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  codeBoxFilled: { backgroundColor: Colors.yellow },
  codeBoxError: { backgroundColor: Colors.coralSoft },
  error: { color: Colors.errorInk, fontSize: 13, fontWeight: '700', marginTop: 14, textAlign: 'center' },
  spinner: { marginTop: 16 },
  verifyBtn: { alignSelf: 'stretch', marginTop: 28 },
  resendWrap: { marginTop: 20, padding: 8 },
  resendText: { color: Colors.ink, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  resendWaiting: { color: Colors.textMuted, textDecorationLine: 'none' },
}));
