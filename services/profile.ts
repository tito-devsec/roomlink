// The signed-in student's own profile.
//
// This is the single source of truth for which university community the student
// belongs to, their budget, and their roommate lifestyle answers. Onboarding and
// the register/edit screens write here; Messages and Roommate Match read here.
//
// Stored in AsyncStorage so the demo works offline; mirror it to Supabase
// (`profiles` table) in production by filling in the TODOs.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/Config';
import type { RoommatePrefs } from '../types';

const KEY = 'roomlink.profile.v1';

export interface MyProfile {
  full_name?: string;
  university_id: string;          // which community the student can access
  gender?: 'male' | 'female' | 'other';
  year_of_study?: number;
  budget_min?: number;
  budget_max?: number;
  roommate?: RoommatePrefs;
  looking_for_roommate?: boolean;
}

export const DEFAULT_ROOMMATE_PREFS: RoommatePrefs = {
  sleep: 'flexible',
  cleanliness: 'tidy',
  study: 'mixed',
  smoking: 'no',
  guests: 'sometimes',
};

const DEFAULTS: MyProfile = {
  // Falls back to the featured (popular) university until the student picks one.
  university_id: Config.FEATURED_UNIVERSITY_ID,
  budget_min: 100000,
  budget_max: 200000,
  roommate: DEFAULT_ROOMMATE_PREFS,
  looking_for_roommate: true,
};

export async function getMyProfile(): Promise<MyProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveMyProfile(patch: Partial<MyProfile>): Promise<MyProfile> {
  const current = await getMyProfile();
  // Never let an undefined/empty field overwrite an existing value.
  const clean: Partial<MyProfile> = {};
  (Object.keys(patch) as (keyof MyProfile)[]).forEach(k => {
    const v = patch[k];
    if (v !== undefined && v !== null && v !== '') (clean as any)[k] = v;
  });
  const next = { ...current, ...clean, roommate: { ...current.roommate, ...patch.roommate } as RoommatePrefs };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    // TODO (production): await supabase.from('profiles').upsert({ id: clerkUserId, ...next });
  } catch {}
  return next;
}

// Convenience: which university community is this student allowed into?
export async function getMyUniversityId(): Promise<string> {
  return (await getMyProfile()).university_id;
}
