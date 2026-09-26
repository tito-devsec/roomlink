// Whether the signed-in person is a tenant (student) or a landlord.
//
// The role is written onto the Clerk account at sign-up (unsafeMetadata.role),
// so it follows the person to any device and any sign-in method. AsyncStorage
// only caches it for the splash screen. unsafeMetadata is user-editable, so
// enforce landlord-only actions on the server rather than with this value.

import AsyncStorage from '@react-native-async-storage/async-storage';

export type Role = 'student' | 'landlord';
const KEY = 'roomlink.role';

export const HOME = {
  student: '/(tabs)',
  landlord: '/(landlord)/dashboard',
} as const;

export async function setRole(role: Role) {
  try { await AsyncStorage.setItem(KEY, role); } catch {}
}

export async function getRole(): Promise<Role | null> {
  try { return (await AsyncStorage.getItem(KEY)) as Role | null; } catch { return null; }
}

export async function clearRole() {
  try { await AsyncStorage.removeItem(KEY); } catch {}
}

/** Metadata to attach when creating an account. */
export const roleMetadata = (role: Role) => ({ role });

export function accountRole(user?: { unsafeMetadata?: Record<string, unknown> } | null): Role | null {
  const r = user?.unsafeMetadata?.role;
  return r === 'student' || r === 'landlord' ? r : null;
}

// The account's own role always wins. Accounts created before roles were stored
// on the account fall back to the role picked on the login screen, then to the
// last role used on this device.
export async function resolveRole(
  user: { unsafeMetadata?: Record<string, unknown> } | null | undefined,
  picked?: Role,
): Promise<Role> {
  const role = accountRole(user) ?? picked ?? (await getRole()) ?? 'student';
  await setRole(role);
  return role;
}
