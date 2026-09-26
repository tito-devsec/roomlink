// RoomLink student directory.
//
// Students are searched and contacted BY NAME only — no phone numbers are ever
// stored or shown here. Every student belongs to exactly one university, which
// is how the app keeps each university community separate.
//
// Like the hostel data layer, this reads from Supabase when configured and
// falls back to the seed list below so the app works out of the box.

import { supabase, isSupabaseConfigured } from './supabase';
import { Colors, colorFor, themed } from '../constants/Colors';
import type { StudentProfile, RoommatePrefs } from '../types';

const G = themed(() => ({
  yellow: Colors.yellow,
  purple: Colors.purple,
  green: Colors.green,
  coral: Colors.coral,
  orange: Colors.orange,
  cyan: Colors.cyan,
  pink: Colors.pink,
}));

const rp = (p: RoommatePrefs) => p;

// Seed directory. university_id maps to MOCK_UNIVERSITIES ids.
export const MOCK_STUDENTS = themed((): StudentProfile[] => [
  { id: 'u1', full_name: 'Amina Hassan', university_id: '1', gender: 'female', year_of_study: 3, budget_min: 120000, budget_max: 200000, bio: 'Third-year Law student. Tidy, early riser, love quiet study nights.', avatar_color: G.yellow, is_online: true, looking_for_roommate: true, roommate: rp({ sleep: 'early', cleanliness: 'very_tidy', study: 'quiet', smoking: 'no', guests: 'rarely' }) },
  { id: 'u2', full_name: 'John Mwangi', university_id: '1', gender: 'male', year_of_study: 2, budget_min: 100000, budget_max: 180000, bio: 'Engineering. Chill, flexible schedule, happy to split a 2-in-1.', avatar_color: G.purple, is_online: true, looking_for_roommate: true, roommate: rp({ sleep: 'flexible', cleanliness: 'tidy', study: 'mixed', smoking: 'no', guests: 'sometimes' }) },
  { id: 'u3', full_name: 'Fatuma Salim', university_id: '2', gender: 'female', year_of_study: 4, budget_min: 90000, budget_max: 150000, bio: 'Architecture finalist at ARU. Neat and focused.', avatar_color: G.green, is_online: false, looking_for_roommate: true, roommate: rp({ sleep: 'early', cleanliness: 'very_tidy', study: 'quiet', smoking: 'no', guests: 'rarely' }) },
  { id: 'u4', full_name: 'David Ochieng', university_id: '1', gender: 'male', year_of_study: 1, budget_min: 80000, budget_max: 140000, bio: 'Freshman, easy-going, into football and gaming.', avatar_color: G.coral, is_online: true, looking_for_roommate: true, roommate: rp({ sleep: 'late', cleanliness: 'relaxed', study: 'social', smoking: 'no', guests: 'often' }) },
  { id: 'u5', full_name: 'Grace Mwamba', university_id: '3', gender: 'female', year_of_study: 5, budget_min: 150000, budget_max: 260000, bio: 'Medical student at MUHAS. Long study hours, need calm space.', avatar_color: G.orange, is_online: false, looking_for_roommate: true, roommate: rp({ sleep: 'late', cleanliness: 'tidy', study: 'quiet', smoking: 'no', guests: 'rarely' }) },
  { id: 'u6', full_name: 'Brian Kimaro', university_id: '1', gender: 'male', year_of_study: 3, budget_min: 110000, budget_max: 190000, bio: 'CS student. Tidy-ish, night owl, quiet coder.', avatar_color: G.cyan, is_online: true, looking_for_roommate: true, roommate: rp({ sleep: 'late', cleanliness: 'tidy', study: 'quiet', smoking: 'no', guests: 'sometimes' }) },
  { id: 'u7', full_name: 'Neema Joseph', university_id: '1', gender: 'female', year_of_study: 2, budget_min: 100000, budget_max: 170000, bio: 'Economics. Friendly, clean, early to bed.', avatar_color: G.pink, is_online: true, looking_for_roommate: true, roommate: rp({ sleep: 'early', cleanliness: 'very_tidy', study: 'mixed', smoking: 'no', guests: 'rarely' }) },
  { id: 'u8', full_name: 'Hamisi Juma', university_id: '1', gender: 'male', year_of_study: 4, budget_min: 90000, budget_max: 160000, bio: 'Statistics finalist. Relaxed, sociable, weekend guests.', avatar_color: G.yellow, is_online: false, looking_for_roommate: true, roommate: rp({ sleep: 'flexible', cleanliness: 'relaxed', study: 'social', smoking: 'ok_with_it', guests: 'often' }) },
  { id: 'u9', full_name: 'Zawadi Mushi', university_id: '7', gender: 'female', year_of_study: 3, budget_min: 80000, budget_max: 130000, bio: 'UDOM. Tidy and studious.', avatar_color: G.green, is_online: true, looking_for_roommate: true, roommate: rp({ sleep: 'early', cleanliness: 'very_tidy', study: 'quiet', smoking: 'no', guests: 'rarely' }) },
  { id: 'u10', full_name: 'Peter Lyimo', university_id: '1', gender: 'male', year_of_study: 2, budget_min: 120000, budget_max: 210000, bio: 'Business. Balanced schedule, likes a clean place.', avatar_color: G.purple, is_online: true, looking_for_roommate: true, roommate: rp({ sleep: 'flexible', cleanliness: 'tidy', study: 'mixed', smoking: 'no', guests: 'sometimes' }) },
]);

function fromRow(r: any): StudentProfile {
  return {
    id: r.id,
    full_name: r.full_name,
    university_id: String(r.university_id),
    gender: r.gender,
    year_of_study: r.year_of_study,
    budget_min: r.budget_min,
    budget_max: r.budget_max,
    bio: r.bio,
    is_online: r.is_online,
    looking_for_roommate: r.looking_for_roommate,
    roommate: r.roommate_prefs || undefined,
    avatar_color: colorFor(r.full_name || r.id || ''),
  };
}

// All students in a given university (community members).
export async function listStudentsByUniversity(universityId: string): Promise<StudentProfile[]> {
  const fallback = MOCK_STUDENTS.filter(s => s.university_id === universityId);
  if (!isSupabaseConfigured || !universityId) return fallback;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('university_id', universityId);
    if (error) throw error;
    return data && data.length ? data.map(fromRow) : fallback;
  } catch {
    return fallback;
  }
}

// Search students BY NAME (never by phone). Scoped to a university so results
// stay within the person's own community.
export async function searchStudentsByName(
  query: string,
  universityId: string,
  excludeId?: string,
): Promise<StudentProfile[]> {
  const q = query.trim().toLowerCase();
  const base = await listStudentsByUniversity(universityId);
  return base
    .filter(s => s.id !== excludeId)
    .filter(s => (q ? s.full_name.toLowerCase().includes(q) : true))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function getStudent(id: string): Promise<StudentProfile | null> {
  const fallback = MOCK_STUDENTS.find(s => s.id === id) || null;
  if (!isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return data ? fromRow(data) : fallback;
  } catch {
    return fallback;
  }
}
