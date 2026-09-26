// RoomLink data layer.
//
// Every function tries Supabase first and falls back to local mock data if
// Supabase isn't configured, the table is empty, or the request fails. This
// means the app keeps working while you populate your database, and switches
// to live data automatically once rows exist — no screen changes required.
//
// The `hostels` table columns map 1:1 to the Hostel type, so rows come back
// already in the shape the UI expects.

import { supabase, isSupabaseConfigured } from './supabase';
import { MOCK_HOSTELS, MOCK_UNIVERSITIES } from './mockData';
import type { Hostel } from '../types';

const log = (where: string, e: any) =>
  console.warn(`[data] ${where} → using mock data (${e?.message || e})`);

// ── Hostels ─────────────────────────────────────────────
export async function listHostels(category: string = 'all'): Promise<Hostel[]> {
  if (!isSupabaseConfigured) return filterByCategory(MOCK_HOSTELS, category);
  try {
    let q = supabase.from('hostels').select('*').eq('is_active', true);
    if (category !== 'all') q = q.eq('type', mapCategory(category));
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    if (!data || data.length === 0) return filterByCategory(MOCK_HOSTELS, category); // empty table → demo
    return data as Hostel[];
  } catch (e) {
    log('listHostels', e);
    return filterByCategory(MOCK_HOSTELS, category);
  }
}

export async function getHostel(id: string): Promise<Hostel | null> {
  const fallback = MOCK_HOSTELS.find(h => h.id === id) || MOCK_HOSTELS[0] || null;
  if (!isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await supabase.from('hostels').select('*').eq('id', id).single();
    if (error) throw error;
    return (data as Hostel) || fallback;
  } catch (e) {
    log('getHostel', e);
    return fallback;
  }
}

export async function listUniversities() {
  if (!isSupabaseConfigured) return MOCK_UNIVERSITIES;
  try {
    const { data, error } = await supabase.from('universities').select('*').order('name');
    if (error) throw error;
    return data && data.length ? data : MOCK_UNIVERSITIES;
  } catch (e) {
    log('listUniversities', e);
    return MOCK_UNIVERSITIES;
  }
}

// ── Favorites (saved rooms) ─────────────────────────────
export async function listFavorites(userId?: string): Promise<Hostel[]> {
  if (!isSupabaseConfigured || !userId) return MOCK_HOSTELS.slice(0, 4);
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('hostel:hostels(*)')
      .eq('user_id', userId);
    if (error) throw error;
    const hostels = (data || []).map((r: any) => r.hostel).filter(Boolean);
    return hostels.length ? (hostels as Hostel[]) : [];
  } catch (e) {
    log('listFavorites', e);
    return MOCK_HOSTELS.slice(0, 4);
  }
}

export async function toggleFavorite(userId: string, hostelId: string, makeSaved: boolean) {
  if (!isSupabaseConfigured || !userId) return makeSaved; // optimistic in demo
  try {
    if (makeSaved) {
      const { error } = await supabase.from('favorites').upsert(
        { user_id: userId, hostel_id: hostelId },
        { onConflict: 'user_id,hostel_id' },
      );
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('hostel_id', hostelId);
      if (error) throw error;
    }
    return makeSaved;
  } catch (e) {
    log('toggleFavorite', e);
    return makeSaved;
  }
}

// ── Bookings ────────────────────────────────────────────
export interface NewBooking {
  userId: string;
  hostelId: string;
  checkInDate: string;     // YYYY-MM-DD
  durationMonths: number;
  totalAmount: number;     // service fee paid through RoomLink
}

export async function createBooking(b: NewBooking) {
  if (!isSupabaseConfigured) return { id: `bk_${Date.now()}`, ...b, status: 'pending' };
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: b.userId,
        hostel_id: b.hostelId,
        check_in_date: b.checkInDate,
        duration_months: b.durationMonths,
        total_amount: b.totalAmount,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    log('createBooking', e);
    return { id: `bk_${Date.now()}`, ...b, status: 'pending' };
  }
}

export async function listBookings(userId?: string) {
  if (!isSupabaseConfigured || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, hostel:hostels(name, images, address)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    log('listBookings', e);
    return [];
  }
}

// ── helpers ─────────────────────────────────────────────
function mapCategory(category: string) {
  return category === 'private' ? 'private_room'
    : category === 'shared' ? 'shared_room'
    : category; // hostel | apartment
}
function filterByCategory(list: Hostel[], category: string) {
  if (category === 'all') return list;
  const t = mapCategory(category);
  return list.filter(h => h.type === t);
}
