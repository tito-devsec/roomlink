// Roommate compatibility — turns two students' preferences into a 0–100% match.
//
// The score is a weighted sum of independent factors. Each factor returns a
// 0..1 sub-score; weights sum to 1 so the result is always a clean percentage.
// Same-university is required (students only match within their own community),
// so it is a gate, not a weighted factor.

import type { StudentProfile, RoommatePrefs } from '../types';
import type { MyProfile } from './profile';
import { Colors } from '../constants/Colors';

export interface MatchBreakdownItem {
  label: string;
  score: number;   // 0..1
  weight: number;  // 0..1
}

export interface RoommateMatch {
  student: StudentProfile;
  percent: number;                 // 0..100
  breakdown: MatchBreakdownItem[];
  headline: string;                // e.g. "Great match"
}

const WEIGHTS = {
  budget: 0.30,
  sleep: 0.16,
  cleanliness: 0.20,
  study: 0.16,
  smoking: 0.10,
  guests: 0.08,
};

// Budget overlap as a fraction of the smaller range (0 = no overlap, 1 = full).
function budgetScore(a?: [number?, number?], b?: [number?, number?]): number {
  const [aMin, aMax] = a || [];
  const [bMin, bMax] = b || [];
  if (aMin == null || aMax == null || bMin == null || bMax == null) return 0.5; // unknown → neutral
  const lo = Math.max(aMin, bMin);
  const hi = Math.min(aMax, bMax);
  const overlap = Math.max(0, hi - lo);
  const smaller = Math.min(aMax - aMin, bMax - bMin) || 1;
  return Math.max(0, Math.min(1, overlap / smaller));
}

// Ordinal closeness for scaled prefs (exact = 1, one step off = 0.5, else 0).
function ordinalScore<T extends string>(order: T[], a?: T, b?: T): number {
  if (!a || !b) return 0.5;
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  if (ia < 0 || ib < 0) return 0.5;
  const dist = Math.abs(ia - ib);
  if (dist === 0) return 1;
  if (dist === 1) return 0.5;
  return 0.1;
}

function smokingScore(a?: RoommatePrefs['smoking'], b?: RoommatePrefs['smoking']): number {
  if (!a || !b) return 0.5;
  if (a === b) return 1;
  const tolerant = (x: string) => x === 'ok_with_it';
  // A non-smoker who is "ok_with_it" pairs fine with a smoker, and vice-versa.
  if (tolerant(a) || tolerant(b)) return 0.75;
  // strict "no" vs "yes"
  return 0.15;
}

export function scoreMatch(me: MyProfile, other: StudentProfile): RoommateMatch {
  const mine = me.roommate;
  const theirs = other.roommate;

  const breakdown: MatchBreakdownItem[] = [
    {
      label: 'Budget overlap',
      weight: WEIGHTS.budget,
      score: budgetScore([me.budget_min, me.budget_max], [other.budget_min, other.budget_max]),
    },
    {
      label: 'Sleep schedule',
      weight: WEIGHTS.sleep,
      score: ordinalScore(['early', 'flexible', 'late'], mine?.sleep, theirs?.sleep),
    },
    {
      label: 'Cleanliness',
      weight: WEIGHTS.cleanliness,
      score: ordinalScore(['very_tidy', 'tidy', 'relaxed'], mine?.cleanliness, theirs?.cleanliness),
    },
    {
      label: 'Study style',
      weight: WEIGHTS.study,
      score: ordinalScore(['quiet', 'mixed', 'social'], mine?.study, theirs?.study),
    },
    {
      label: 'Smoking',
      weight: WEIGHTS.smoking,
      score: smokingScore(mine?.smoking, theirs?.smoking),
    },
    {
      label: 'Guests',
      weight: WEIGHTS.guests,
      score: ordinalScore(['rarely', 'sometimes', 'often'], mine?.guests, theirs?.guests),
    },
  ];

  const raw = breakdown.reduce((sum, b) => sum + b.score * b.weight, 0);
  const percent = Math.round(raw * 100);

  const headline =
    percent >= 85 ? 'Excellent match' :
    percent >= 70 ? 'Great match' :
    percent >= 55 ? 'Good match' :
    percent >= 40 ? 'Fair match' :
    'Low match';

  return { student: other, percent, breakdown, headline };
}

// Rank everyone in the same university by match %. Same-university is enforced
// by the caller (it only passes in community members), keeping communities
// separate.
export function rankRoommates(me: MyProfile, candidates: StudentProfile[]): RoommateMatch[] {
  return candidates
    .filter(c => c.university_id === me.university_id)
    .filter(c => c.looking_for_roommate !== false)
    .map(c => scoreMatch(me, c))
    .sort((a, b) => b.percent - a.percent);
}

// Fill colours for match badges/bars; always paired with ink text.
export function matchColor(percent: number): string {
  if (percent >= 85) return Colors.green;
  if (percent >= 70) return Colors.cyan;
  if (percent >= 55) return Colors.yellow;
  return Colors.coral;
}
