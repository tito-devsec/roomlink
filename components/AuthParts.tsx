// Pieces shared by the login and register screens.
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from './neo/Icon';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../constants/Colors';
import type { Role } from '../services/role';
import { IconButton, Logo, NeoPressable, Text, type IconName } from './neo';

export type OAuthProvider = 'google' | 'apple' | 'facebook';

export const ROLE_OPTIONS = themed((): { id: Role; label: string; hint: string; icon: IconName; color: string }[] => [
  { id: 'student', label: 'Tenant', hint: 'Find a room', icon: 'school', color: Colors.yellow },
  { id: 'landlord', label: 'Landlord', hint: 'List rooms', icon: 'business', color: Colors.purple },
]);

export function RolePicker({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  return (
    <View style={styles.roleRow}>
      {ROLE_OPTIONS.map(r => {
        const on = value === r.id;
        return (
          <NeoPressable
            key={r.id}
            onPress={() => onChange(r.id)}
            shadow={on ? 3 : 2}
            haptic="selection"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${r.label} account`}
            style={[styles.roleTile, { backgroundColor: on ? r.color : Colors.surface }]}
          >
            <View style={styles.roleIcon}>
              <Icon name={r.icon} size={18} color={Colors.ink} />
            </View>
            <Text style={styles.roleLabel}>{r.label}</Text>
            <Text style={styles.roleHint}>{r.hint}</Text>
          </NeoPressable>
        );
      })}
    </View>
  );
}

const PROVIDERS = themed((): { id: OAuthProvider; icon: IconName; color: string; label: string }[] => [
  { id: 'google', icon: 'logo-google', color: '#EA4335', label: 'Continue with Google' },
  { id: 'apple', icon: 'logo-apple', color: Colors.ink, label: 'Continue with Apple' },
  { id: 'facebook', icon: 'logo-facebook', color: '#1877F2', label: 'Continue with Facebook' },
]);

export function AuthBrand({ tagline }: { tagline: string }) {
  return (
    <View style={styles.brand}>
      <Logo size={66} shadow={5} />
      <Text style={styles.brandName}>RoomLink</Text>
      <Text style={styles.tagline}>{tagline}</Text>
    </View>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.divLine} />
      <Text style={styles.divText}>{label}</Text>
      <View style={styles.divLine} />
    </View>
  );
}

export function SocialButtons({ onPress, busy }: { onPress: (p: OAuthProvider) => void; busy?: string }) {
  return (
    <View style={styles.socialRow}>
      {PROVIDERS.map(p => (
        <IconButton
          key={p.id}
          icon={p.icon}
          iconColor={p.color}
          size={54}
          iconSize={24}
          style={[styles.social, busy === p.id && styles.socialBusy]}
          accessibilityLabel={p.label}
          onPress={busy ? undefined : () => onPress(p.id)}
        />
      ))}
    </View>
  );
}

// Clerk's bot protection renders its CAPTCHA into #clerk-captcha during web
// sign-ups (react-native-web turns nativeID into the DOM id). Native apps skip it.
export function CaptchaSlot() {
  if (Platform.OS !== 'web') return null;
  return <View nativeID="clerk-captcha" style={styles.captcha} />;
}

export function ErrorBanner({ message, action, onAction }: { message: string; action?: string; onAction?: () => void }) {
  return (
    <View style={[styles.error, hardShadow(2)]}>
      <Icon name="alert-circle" size={18} color={Colors.ink} />
      <View style={styles.errorBody}>
        <Text style={styles.errorText}>{message}</Text>
        {action ? (
          <Pressable onPress={onAction} hitSlop={8} style={styles.errorAction} accessibilityRole="button">
            <Text style={styles.errorActionText}>{action}</Text>
            <Icon name="arrow-forward" size={14} color={Colors.ink} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  brand: { alignItems: 'center', marginTop: 4, marginBottom: 22 },
  brandName: { fontFamily: Fonts.display, fontSize: 30, color: Colors.ink, marginTop: 16 },
  tagline: { fontSize: 14, fontWeight: '600', color: Colors.ink, marginTop: 2 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 26, marginBottom: 16 },
  divLine: { flex: 1, height: BorderWidth.thin, backgroundColor: Colors.ink },
  divText: { color: Colors.ink, fontSize: 13, fontWeight: '700' },

  socialRow: { flexDirection: 'row', gap: 14 },
  social: { flex: 1 },
  socialBusy: { opacity: 0.5 },

  error: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.coralSoft, padding: 12, borderRadius: 12, marginBottom: 16,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  captcha: { alignItems: 'center', marginBottom: 12 },
  errorBody: { flex: 1, gap: 6 },
  errorText: { color: Colors.ink, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  errorAction: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  errorActionText: { color: Colors.ink, fontSize: 13.5, fontWeight: '700', textDecorationLine: 'underline' },

  roleRow: { flexDirection: 'row', gap: 12 },
  roleTile: {
    flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 14,
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  roleIcon: {
    width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    backgroundColor: Colors.surface, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  roleLabel: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  roleHint: { fontSize: 11.5, fontWeight: '500', color: Colors.ink, marginTop: 1 },
}));
