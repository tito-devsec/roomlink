import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/Config';

// True when a real Supabase URL + key are present (not blank placeholders).
export const isSupabaseConfigured =
  !!Config.SUPABASE_URL &&
  Config.SUPABASE_URL.startsWith('https://') &&
  !!Config.SUPABASE_ANON_KEY &&
  Config.SUPABASE_ANON_KEY.length > 20;

// Web static rendering runs in Node, where AsyncStorage has no window/localStorage.
const isServerRender = typeof window === 'undefined';

export const supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY, {
  auth: {
    storage: isServerRender ? undefined : AsyncStorage,
    autoRefreshToken: !isServerRender,
    persistSession: !isServerRender,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper: sync Clerk user to Supabase users table
export async function syncUserToSupabase(clerkUser: {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddresses: { emailAddress: string }[];
  imageUrl?: string;
}) {
  const { error } = await supabase.from('users').upsert({
    id: clerkUser.id,
    full_name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    avatar_url: clerkUser.imageUrl,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (error) console.warn('Supabase user sync error:', error.message);
}

// Helper: get user's university group chat
export async function getUserUniversityChat(userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('university_id')
    .eq('id', userId)
    .single();

  if (!user?.university_id) return null;

  const { data: chat } = await supabase
    .from('chats')
    .select('*')
    .eq('university_id', user.university_id)
    .eq('type', 'group')
    .single();

  return chat;
}

// Helper: send a message
export async function sendMessage(chatId: string, senderId: string, content: string, type: string = 'text', mediaUrl?: string, replyToId?: string) {
  const { data, error } = await supabase.from('messages').insert({
    chat_id: chatId,
    sender_id: senderId,
    content,
    type,
    media_url: mediaUrl,
    reply_to_id: replyToId,
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) throw error;
  return data;
}

// Helper: submit verification
export async function submitVerification(userId: string, idFrontUrl: string, idBackUrl: string, selfieUrl: string) {
  // Update user status
  await supabase.from('users').update({
    verification_status: 'pending',
    verification_id_front: idFrontUrl,
    verification_id_back: idBackUrl,
    verification_selfie: selfieUrl,
    verification_submitted_at: new Date().toISOString(),
  }).eq('id', userId);

  // Create verification record
  const { data, error } = await supabase.from('verifications').insert({
    user_id: userId,
    status: 'pending',
    id_front_url: idFrontUrl,
    id_back_url: idBackUrl,
    selfie_url: selfieUrl,
  }).select().single();

  if (error) throw error;
  return data;
}
