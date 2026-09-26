// RoomLink chat engine.
//
// One place that owns chat threads and messages. It powers the WhatsApp-style
// UI in app/chat/[id].tsx and the list in app/(tabs)/messages.tsx.
//
// Design rules baked in here:
//  1. A student can only ever see ONE community — their own university's.
//     Community thread ids are `community-<universityId>`; opening any other is
//     blocked by canAccessThread().
//  2. Private chats are 1:1 with another student, found BY NAME (see
//     services/students.ts). Thread ids are `dm-<studentId>`.
//  3. There is no landlord/tenant direct line. The only "official" thread is the
//     RoomLink Admin thread (`admin`), which routes enquiries to the system
//     admin number from Config.
//
// Messages are kept in-memory (seeded) for the demo and mirrored to Supabase
// when configured. Realtime insert subscription lives in the screen.

import { supabase, isSupabaseConfigured } from './supabase';
import { Config } from '../constants/Config';
import { Colors } from '../constants/Colors';
import { MOCK_STUDENTS } from './students';
import { MOCK_UNIVERSITIES } from './mockData';
import type { IconName } from '../components/neo/Icon';

export type ChatKind = 'community' | 'direct' | 'admin';

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;              // 'me' for the current user, 'system' for bot
  sender_name: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'system';
  media_url?: string;
  created_at: string;
  reactions: Record<string, string[]>;
  reply_to?: { id: string; content: string; sender_name: string } | null;
}

export interface ChatThread {
  id: string;
  kind: ChatKind;
  title: string;
  subtitle?: string;
  avatar_icon?: IconName;
  avatar_initials?: string;
  university_id?: string;
  member_count?: number;
  online_count?: number;
}

export const ME = 'me';
const iso = (minsAgo: number) => new Date(Date.now() - minsAgo * 60000).toISOString();

// ── Thread ids ──────────────────────────────────────────
export const communityThreadId = (universityId: string) => `community-${universityId}`;
export const directThreadId = (studentId: string) => `dm-${studentId}`;
export const ADMIN_THREAD_ID = 'admin';

export function parseThreadId(id: string): { kind: ChatKind; ref?: string } {
  if (id === ADMIN_THREAD_ID) return { kind: 'admin' };
  if (id.startsWith('community-')) return { kind: 'community', ref: id.slice('community-'.length) };
  if (id.startsWith('dm-')) return { kind: 'direct', ref: id.slice('dm-'.length) };
  return { kind: 'direct', ref: id };
}

// Enforce rule #1: a student may only open their own university community.
export function canAccessThread(threadId: string, myUniversityId: string): boolean {
  const p = parseThreadId(threadId);
  if (p.kind === 'community') return p.ref === myUniversityId;
  return true; // dm + admin always allowed
}

function uniName(id: string) {
  const u = MOCK_UNIVERSITIES.find(x => x.id === id);
  return u?.short_name || u?.name || 'University';
}

// ── Thread metadata ─────────────────────────────────────
export function getThread(threadId: string, myUniversityId: string): ChatThread {
  const p = parseThreadId(threadId);

  if (p.kind === 'admin') {
    return {
      id: ADMIN_THREAD_ID,
      kind: 'admin',
      title: Config.ADMIN_CONTACT_NAME,
      subtitle: 'Official support',
      avatar_icon: 'shield-checkmark',
    };
  }

  if (p.kind === 'community') {
    const uid = p.ref || myUniversityId;
    const u = MOCK_UNIVERSITIES.find(x => x.id === uid);
    const members = u?.student_count || 1200;
    return {
      id: communityThreadId(uid),
      kind: 'community',
      title: `${uniName(uid)} Community`,
      subtitle: `${members.toLocaleString()} members`,
      avatar_icon: 'school',
      university_id: uid,
      member_count: members,
      online_count: Math.max(20, Math.round(members * 0.12)),
    };
  }

  // direct
  const student = MOCK_STUDENTS.find(s => s.id === p.ref);
  const name = student?.full_name || 'Student';
  return {
    id: directThreadId(p.ref || ''),
    kind: 'direct',
    title: name,
    subtitle: student?.is_online ? 'Online' : 'Offline',
    avatar_initials: name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
    university_id: student?.university_id,
  };
}

// ── Seed messages ───────────────────────────────────────
function seedCommunity(threadId: string, universityId: string): ChatMessage[] {
  const uni = uniName(universityId);
  const mk = (id: string, sid: string, name: string, content: string, mins: number, reactions: Record<string, string[]> = {}, reply?: ChatMessage['reply_to']): ChatMessage => ({
    id, thread_id: threadId, sender_id: sid, sender_name: name, content, type: 'text', created_at: iso(mins), reactions, reply_to: reply || null,
  });
  return [
    mk('c1', 'u1', 'Amina Hassan', `Anyone know a good affordable hostel near ${uni} main gate? 🏠`, 60),
    mk('c2', 'u2', 'John Mwangi', 'Blue Horizon on Mlimani road is really good! Clean rooms and fast WiFi, around 180k/mo', 58, { '👍': ['u1', 'u3'] }),
    mk('c3', 'u3', 'Fatuma Salim', 'I stayed there last semester! Great security and the study room is 💯', 56, { '🔥': ['u1', 'u2'] }, { id: 'c2', content: 'Blue Horizon on Mlimani road is really good!', sender_name: 'John Mwangi' }),
    mk('c4', 'u1', 'Amina Hassan', 'Is it mixed or girls only?', 54),
    mk('c5', 'u2', 'John Mwangi', 'Mixed, but each floor is separated. Very professional management 👌', 52, { '❤️': ['u1'] }),
    mk('c6', 'system', 'RoomLink', 'Reminder: for any booking or landlord enquiry, tap "Contact RoomLink Admin" on a listing — we handle it for you safely.', 30, {}),
  ];
}

function seedDirect(threadId: string, studentId: string): ChatMessage[] {
  const student = MOCK_STUDENTS.find(s => s.id === studentId);
  const name = student?.full_name || 'Student';
  return [
    { id: 'd1', thread_id: threadId, sender_id: studentId, sender_name: name, content: `Hey! Saw you're also looking near campus — want to split a place? 🙂`, type: 'text', created_at: iso(40), reactions: {}, reply_to: null },
    { id: 'd2', thread_id: threadId, sender_id: ME, sender_name: 'You', content: `Yeah! What's your budget?`, type: 'text', created_at: iso(38), reactions: {}, reply_to: null },
    { id: 'd3', thread_id: threadId, sender_id: studentId, sender_name: name, content: `Around ${(student?.budget_max || 180000).toLocaleString()} max. I'm pretty tidy and quiet at night.`, type: 'text', created_at: iso(36), reactions: { '👍': [ME] }, reply_to: null },
  ];
}

function seedAdmin(threadId: string): ChatMessage[] {
  const ready = Config.ADMIN_CONTACT_READY;
  return [
    { id: 'a1', thread_id: threadId, sender_id: 'system', sender_name: Config.ADMIN_CONTACT_NAME, content: 'Welcome to RoomLink support! We connect you to rooms directly — you never contact a landlord yourself, we do it for you.', type: 'text', created_at: iso(120), reactions: {}, reply_to: null },
    { id: 'a2', thread_id: threadId, sender_id: 'system', sender_name: Config.ADMIN_CONTACT_NAME, content: ready
        ? `To enquire about a room, send us the listing name here or call ${Config.ADMIN_CONTACT_NUMBER}.`
        : 'To enquire about a room, send us the listing name here. Our direct line will be added shortly.', type: 'system', created_at: iso(119), reactions: {}, reply_to: null },
  ];
}

// In-memory store keyed by thread id (per app session).
const store: Record<string, ChatMessage[]> = {};

export function loadMessages(threadId: string, myUniversityId: string): ChatMessage[] {
  if (store[threadId]) return store[threadId];
  const p = parseThreadId(threadId);
  let seed: ChatMessage[] = [];
  if (p.kind === 'community') seed = seedCommunity(threadId, p.ref || myUniversityId);
  else if (p.kind === 'admin') seed = seedAdmin(threadId);
  else seed = seedDirect(threadId, p.ref || '');
  store[threadId] = seed;
  return seed;
}

export function appendMessage(threadId: string, msg: ChatMessage) {
  store[threadId] = [...(store[threadId] || []), msg];
  if (isSupabaseConfigured) {
    // Fire-and-forget mirror; UI is optimistic.
    supabase.from('messages').insert({
      thread_id: threadId,
      sender_id: msg.sender_id,
      content: msg.content,
      type: msg.type,
      media_url: msg.media_url,
      reply_to_id: msg.reply_to?.id,
    }).then(() => {}, () => {});
  }
}

export function newMessage(partial: Partial<ChatMessage> & { thread_id: string; content: string; sender_name: string }): ChatMessage {
  return {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender_id: ME,
    type: 'text',
    created_at: new Date().toISOString(),
    reactions: {},
    reply_to: null,
    ...partial,
  } as ChatMessage;
}

// ── Chat list for the Messages tab ──────────────────────
// Only the student's OWN community + the admin thread + any active DMs.
export interface ChatListItem {
  id: string;
  kind: ChatKind;
  title: string;
  subtitle: string;
  time: string;
  unread: number;
  avatar_icon?: IconName;
  avatar_initials?: string;
  color: string;
  member_count?: number;
  online_count?: number;
}

export function buildChatList(myUniversityId: string): ChatListItem[] {
  const community = getThread(communityThreadId(myUniversityId), myUniversityId);
  const items: ChatListItem[] = [
    {
      id: community.id, kind: 'community',
      title: community.title, subtitle: 'Anyone know a good hostel near campus?',
      time: '2m', unread: 12, avatar_icon: 'school',
      color: Colors.cyan,
      member_count: community.member_count, online_count: community.online_count,
    },
    {
      id: ADMIN_THREAD_ID, kind: 'admin',
      title: Config.ADMIN_CONTACT_NAME, subtitle: 'We handle all landlord enquiries for you',
      time: '1h', unread: 1, avatar_icon: 'shield-checkmark',
      color: Colors.green,
    },
  ];

  // Seeded DMs with two community members (found earlier by name).
  const dmMembers = MOCK_STUDENTS.filter(s => s.university_id === myUniversityId).slice(0, 2);
  dmMembers.forEach((s, i) => {
    items.push({
      id: directThreadId(s.id), kind: 'direct',
      title: s.full_name,
      subtitle: i === 0 ? 'Around 180,000 max. Tidy and quiet 🙂' : 'Thanks for the recommendation! 🙏',
      time: i === 0 ? '10m' : '3h', unread: i === 0 ? 2 : 0,
      avatar_initials: s.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
      color: s.avatar_color || Colors.purple,
    });
  });

  return items;
}
