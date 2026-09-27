import { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSignIn, useClerk } from '@clerk/clerk-expo';
import { Icon } from '../../components/neo/Icon';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import { NeoButton, NeoInput, ScreenHeader, Text, KeyboardSafeView } from '../../components/neo';
import { HOME, resolveRole } from '../../services/role';

export default function ResetPasswordScreen() {
  const { email, role: pickedRole } = useLocalSearchParams<{ email: string; role?: string }>();
  const clerk = useClerk();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'code' | 'password'>('code');

  const handleVerifyCode = async () => {
    if (!code.trim()) { Alert.alert('Error', 'Enter the 6-digit code from your email'); return; }
    setStep('password');
  };

  const handleResetPassword = async () => {
    if (!isLoaded) return;
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (newPassword.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        const role = await resolveRole(clerk.user, pickedRole === 'landlord' ? 'landlord' : pickedRole === 'student' ? 'student' : undefined);
        Alert.alert('Success', 'Password reset successfully!', [{ text: 'OK', onPress: () => router.replace(HOME[role]) }]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Reset failed. Check your code.');
    } finally { setLoading(false); }
  };

  const isCode = step === 'code';

  return (
    <KeyboardSafeView style={styles.container}>
      <ScreenHeader title="Reset password" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.iconTile, { backgroundColor: isCode ? Colors.cyan : Colors.yellow }, hardShadow(5)]}>
          <Icon name={isCode ? 'mail-open' : 'key'} size={34} color={Colors.ink} />
        </View>

        <Text style={styles.title}>{isCode ? 'Check your email' : 'New password'}</Text>
        <Text style={styles.subtitle}>
          {isCode ? 'We sent a 6-digit reset code to' : 'Enter your new password below'}
          {isCode ? <Text style={styles.email}>{`\n${email}`}</Text> : null}
        </Text>

        {isCode ? (
          <>
            <NeoInput
              label="Verification code"
              icon="keypad"
              placeholder="Enter 6-digit code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              containerStyle={styles.field}
            />
            <NeoButton title="Verify code" size="lg" iconRight="arrow-forward" onPress={handleVerifyCode} style={styles.btn} />
          </>
        ) : (
          <>
            <NeoInput
              label="New password"
              icon="lock-closed"
              placeholder="Min 8 characters"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              containerStyle={styles.field}
              right={(
                <Pressable onPress={() => setShowPass(!showPass)} hitSlop={10} accessibilityLabel={showPass ? 'Hide password' : 'Show password'}>
                  <Icon name={showPass ? 'eye' : 'eye-off'} size={20} color={Colors.ink} />
                </Pressable>
              )}
            />
            <NeoInput
              label="Confirm password"
              icon="lock-closed"
              placeholder="Repeat password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              containerStyle={styles.field}
            />
            <NeoButton
              title={loading ? 'Resetting…' : 'Reset password'}
              size="lg"
              loading={loading}
              onPress={handleResetPassword}
              style={styles.btn}
            />
          </>
        )}

        <Pressable
          style={styles.backToLogin}
          onPress={() => router.replace({ pathname: '/(auth)/login', params: pickedRole ? { role: pickedRole } : {} })}
          hitSlop={8}
        >
          <Icon name="arrow-back" size={16} color={Colors.ink} />
          <Text style={styles.backToLoginText}>Back to login</Text>
        </Pressable>
      </ScrollView>
    </KeyboardSafeView>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 24, paddingTop: 36, paddingBottom: 40, alignItems: 'center' },
  iconTile: {
    width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.thick, borderColor: Colors.ink, marginBottom: 24,
    transform: [{ rotate: '-4deg' }],
  },
  title: { fontFamily: Fonts.display, fontSize: 28, color: Colors.ink, marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  email: { color: Colors.ink, fontWeight: '700' },
  field: { alignSelf: 'stretch', marginBottom: 16 },
  btn: { alignSelf: 'stretch', marginTop: 8 },
  backToLogin: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24 },
  backToLoginText: { color: Colors.ink, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
}));
