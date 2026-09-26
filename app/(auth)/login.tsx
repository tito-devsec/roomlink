import { useState, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable,
  Animated, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSignIn, useOAuth, useClerk } from '@clerk/clerk-expo';
import { Icon } from '../../components/neo/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import { Checkbox, IconButton, NeoButton, NeoInput, Segmented, Tag, Text } from '../../components/neo';
import {
  AuthBrand, ErrorBanner, OrDivider, RolePicker, SocialButtons, type OAuthProvider,
} from '../../components/AuthParts';
import { HOME, resolveRole, roleMetadata, setRole, type Role } from '../../services/role';
import { DEMO_LOGIN_ENABLED, startDemoSession } from '../../services/demoAuth';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const clerk = useClerk();
  const params = useLocalSearchParams<{ role?: string }>();
  const [role, setRolePick] = useState<Role>(params.role === 'landlord' ? 'landlord' : 'student');
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });
  const { startOAuthFlow: startFacebookOAuth } = useOAuth({ strategy: 'oauth_facebook' });

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [error, setError] = useState('');
  const [noAccount, setNoAccount] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // Sign-up for the picked role, carrying over any email already typed.
  const goToSignUp = () => router.replace({
    pathname: role === 'landlord' ? '/(auth)/landlord-register' : '/(auth)/register',
    params: email.trim() ? { email: email.trim() } : {},
  });

  const switchTab = (next: 'login' | 'register') => {
    setTab(next);
    // Let the thumb finish sliding before the screen swaps.
    if (next === 'register') setTimeout(goToSignUp, 180);
  };

  // Always land in the account's own area, whichever option was picked.
  const goHome = async () => {
    const actual = await resolveRole(clerk.user, role);
    router.replace(HOME[actual]);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError('Please fill all fields'); shake(); return; }
    if (DEMO_LOGIN_ENABLED) {
      await startDemoSession(email.trim(), role);
      await setRole(role);
      router.replace(HOME[role]);
      return;
    }
    if (!isLoaded) return;
    setLoading(true); setError(''); setNoAccount(false);
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        await goHome();
      } else {
        setError('Additional verification needed — check your email, or reset your password below.');
        shake();
      }
    } catch (err: any) {
      if (err.errors?.[0]?.code === 'form_identifier_not_found') {
        setNoAccount(true);
        setError('No account uses this email yet. Create it first, then log in.');
      } else {
        setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Login failed');
      }
      shake();
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Enter Email', 'Please enter your email address first, then tap Forgot Password.');
      return;
    }
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signIn.create({ identifier: email.trim(), strategy: 'reset_password_email_code' });
      router.push({ pathname: '/(auth)/reset-password', params: { email: email.trim(), role } });
    } catch (err: any) {
      const msg = err.errors?.[0]?.message || 'Failed to send reset email';
      Alert.alert('Error', msg);
    } finally { setLoading(false); }
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    setSocialLoading(provider);
    try {
      const startFlow = provider === 'google' ? startGoogleOAuth :
                        provider === 'apple' ? startAppleOAuth : startFacebookOAuth;
      const { createdSessionId, setActive: setOAuthActive } = await startFlow({
        redirectUrl: Linking.createURL('/(tabs)', { scheme: 'roomlink' }),
        // Only applied if this sign-in creates a brand-new account.
        unsafeMetadata: roleMetadata(role),
      });
      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        await goHome();
      }
    } catch (err: any) {
      Alert.alert('Sign-in failed', err.message || 'OAuth sign-in failed');
    } finally { setSocialLoading(''); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <IconButton icon="arrow-back" onPress={() => router.back()} style={styles.back} accessibilityLabel="Go back" />

        <AuthBrand tagline="Find your perfect student room" />

        <Segmented
          options={[{ value: 'login', label: 'Log In' }, { value: 'register', label: 'Sign Up' }]}
          value={tab}
          onChange={switchTab}
          height={50}
          style={styles.segmented}
        />

        <Animated.View style={[styles.card, hardShadow(6), { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to your {role === 'landlord' ? 'landlord' : 'tenant'} account
          </Text>
          {DEMO_LOGIN_ENABLED && (
            <Tag
              label="Test mode: any email + password works"
              icon="flash"
              color={Colors.greenSoft}
              size="md"
              style={styles.testTag}
            />
          )}

          <Text style={styles.roleLabel}>I am a</Text>
          <View style={styles.rolePicker}>
            <RolePicker value={role} onChange={setRolePick} />
          </View>

          {error ? (
            <ErrorBanner
              message={error}
              action={noAccount ? `Create this ${role === 'landlord' ? 'landlord' : 'tenant'} account` : undefined}
              onAction={goToSignUp}
            />
          ) : null}

          <NeoInput
            label="Email"
            icon="mail"
            placeholder="you@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.field}
          />
          <NeoInput
            label="Password"
            icon="lock-closed"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            autoCapitalize="none"
            containerStyle={styles.field}
            right={(
              <Pressable onPress={() => setShowPass(!showPass)} hitSlop={10} accessibilityLabel={showPass ? 'Hide password' : 'Show password'}>
                <Icon name={showPass ? 'eye' : 'eye-off'} size={20} color={Colors.ink} />
              </Pressable>
            )}
          />

          <View style={styles.rememberRow}>
            <Pressable style={styles.checkRow} onPress={() => setRememberMe(!rememberMe)} hitSlop={6}>
              <Checkbox checked={rememberMe} size={20} />
              <Text style={styles.rememberText}>Remember me</Text>
            </Pressable>
            <Pressable onPress={handleForgotPassword} hitSlop={8}>
              <Text style={styles.forgotText}>{loading ? '…' : 'Forgot password?'}</Text>
            </Pressable>
          </View>

          <NeoButton
            title={loading ? 'Signing in…' : role === 'landlord' ? 'Log in as landlord' : 'Log in as tenant'}
            onPress={handleLogin}
            loading={loading}
            size="lg"
            variant={role === 'landlord' ? 'purple' : 'primary'}
            iconRight="arrow-forward"
          />
        </Animated.View>

        <OrDivider label="or continue with" />
        <SocialButtons onPress={handleOAuth} busy={socialLoading} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: { fontFamily: Fonts.display, fontSize: 24, color: Colors.ink },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2, marginBottom: 18 },
  testTag: { marginTop: -6, marginBottom: 18 },
  roleLabel: { fontSize: 13, fontWeight: '700', color: Colors.ink, marginBottom: 8 },
  rolePicker: { marginBottom: 20 },
  field: { marginBottom: 16 },
  rememberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2, marginBottom: 22 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rememberText: { color: Colors.ink, fontSize: 14, fontWeight: '600' },
  forgotText: { color: Colors.ink, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
}));
