import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform, Modal, Image,
  Animated, Alert, Pressable, ImageBackground, Linking, useWindowDimensions,
  type TextStyle,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Icon } from '../../components/neo/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { BorderWidth, Colors, Fonts, colorFor, hardShadow, themed } from '../../constants/Colors';
import { Config } from '../../constants/Config';
import {
  Avatar, IconButton, NeoButton, Text, haptic, KeyboardSafeView, useKeyboardVisible, type IconName,
} from '../../components/neo';
import { supabase } from '../../services/supabase';
import { getMyUniversityId } from '../../services/profile';
import SwipeableMessage from '../../components/SwipeableMessage';
import {
  ME, getThread, loadMessages, appendMessage, newMessage,
  canAccessThread, parseThreadId, type ChatMessage, type ChatThread,
} from '../../services/chat';

const EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '👎', '🔥', '🎉'];
const PICKER_W = EMOJIS.length * 38 + 16;
const webReset = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDate(iso: string) {
  const d = new Date(iso); const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString();
}

function ReactionPicker({ visible, onSelect, onClose, anchor }: {
  visible: boolean; onSelect: (e: string) => void; onClose: () => void; anchor: { x: number; y: number };
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  if (!visible) return null;
  const left = Math.max(12, Math.min(anchor.x, width - PICKER_W - 12));
  const top = Math.max(insets.top + 8, anchor.y - 72);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.reactionOverlay} onPress={onClose}>
        <View style={[styles.reactionPicker, hardShadow(4), { top, left }]}>
          {EMOJIS.map(e => (
            <TouchableOpacity key={e} onPress={() => { haptic('selection'); onSelect(e); }} style={styles.reactionEmojiBtn}>
              <Text style={styles.reactionEmoji}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

function MessageBubble({ msg, isOwn, isGroup, onReact, onReply, onLongPress }: {
  msg: ChatMessage; isOwn: boolean; isGroup: boolean;
  onReact: (emoji: string) => void; onReply: (m: ChatMessage) => void;
  onLongPress: (m: ChatMessage, anchor: { x: number; y: number }) => void;
}) {
  const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
  const { width } = useWindowDimensions();

  if (msg.type === 'system') {
    return (
      <View style={styles.systemWrap}>
        <View style={[styles.systemBox, { maxWidth: Math.min(width * 0.86, 640) }]}>
          <Icon name="information-circle" size={15} color={Colors.ink} />
          <Text style={styles.systemText}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  const bubble = (
    <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
      {!isOwn && isGroup && (
        <Avatar name={msg.sender_name} size={30} color={colorFor(msg.sender_name || '?')} />
      )}
      <View style={[{ maxWidth: Math.min(width * 0.74, 560) }, isOwn && styles.bubbleWrapperOwn]}>
        {!isOwn && isGroup && <Text style={styles.senderName}>{msg.sender_name}</Text>}

        {msg.reply_to && (
          <View style={[styles.replyPreview, isOwn && styles.replyPreviewOwn]}>
            <View style={styles.replyBar} />
            <View style={styles.flex}>
              <Text style={styles.replyName}>{msg.reply_to.sender_name}</Text>
              <Text style={styles.replyContent} numberOfLines={1}>{msg.reply_to.content}</Text>
            </View>
          </View>
        )}

        <Pressable onLongPress={(e) => onLongPress(msg, { x: e.nativeEvent.pageX - 140, y: e.nativeEvent.pageY })}>
          {msg.type === 'image' ? (
            <View style={[styles.imageFrame, hardShadow(2)]}>
              <Image source={{ uri: msg.media_url }} style={styles.messageImage} resizeMode="cover" />
            </View>
          ) : msg.type === 'voice' ? (
            <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther, styles.voiceBubble, hardShadow(2)]}>
              <View style={styles.voicePlayBtn}>
                <Icon name="play" size={14} color={isOwn ? Colors.yellow : Colors.white} />
              </View>
              <View style={styles.voiceWave}>
                {[...Array(18)].map((_, i) => (
                  <View key={i} style={[styles.voiceBar, { height: 4 + ((i * 7) % 16) }]} />
                ))}
              </View>
              <Text style={styles.voiceDuration}>0:12</Text>
            </View>
          ) : (
            <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther, hardShadow(2)]}>
              <Text style={styles.bubbleText}>{msg.content}</Text>
            </View>
          )}
        </Pressable>

        <View style={[styles.msgFooter, isOwn && styles.msgFooterOwn]}>
          <Text style={styles.msgTime}>{formatTime(msg.created_at)}</Text>
          {isOwn && <Icon name="checkmark-done" size={14} color={Colors.blue} />}
        </View>

        {hasReactions && (
          <View style={[styles.reactionsRow, isOwn && styles.reactionsRowOwn]}>
            {Object.entries(msg.reactions).map(([emoji, users]) => (
              <TouchableOpacity key={emoji} style={styles.reactionBubble} onPress={() => onReact(emoji)}>
                <Text style={styles.reactionBubbleEmoji}>{emoji}</Text>
                <Text style={styles.reactionBubbleCount}>{users.length}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return <SwipeableMessage onReply={() => onReply(msg)} isOwn={isOwn}>{bubble}</SwipeableMessage>;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardVisible();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionTarget, setReactionTarget] = useState<ChatMessage | null>(null);
  const [reactionAnchor, setReactionAnchor] = useState({ x: 0, y: 0 });
  const [attachMenuVisible, setAttachMenuVisible] = useState(false);
  const listRef = useRef<FlatList>(null);
  const recordingAnim = useRef(new Animated.Value(1)).current;

  const p = parseThreadId(id || '');
  const isGroup = p.kind === 'community';
  const isAdmin = p.kind === 'admin';

  // Resolve access + load thread once we know the student's university.
  useEffect(() => {
    (async () => {
      const myUni = await getMyUniversityId();
      const ok = canAccessThread(id || '', myUni);
      setAllowed(ok);
      if (ok) {
        setThread(getThread(id || '', myUni));
        setMessages(loadMessages(id || '', myUni));
      }
    })();
  }, [id]);

  // Realtime subscription (Supabase) — inserts land in this thread.
  useEffect(() => {
    if (!allowed) return;
    const channel = supabase
      .channel(`chat:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${id}` },
        (payload: any) => {
          const row = payload.new;
          if (row.sender_id === ME) return; // ignore our own echo
          setMessages(prev => [...prev, {
            id: row.id, thread_id: id!, sender_id: row.sender_id, sender_name: row.sender_name || 'Member',
            content: row.content, type: row.type || 'text', media_url: row.media_url,
            created_at: row.created_at || new Date().toISOString(), reactions: {}, reply_to: null,
          }]);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, allowed]);

  const sendMessage = useCallback((type: ChatMessage['type'] = 'text', mediaUrl?: string) => {
    const content = inputText.trim();
    if (!content && type === 'text') return;
    const myName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'You';
    const msg = newMessage({
      thread_id: id!, content: content || '', type, media_url: mediaUrl,
      sender_name: myName,
      reply_to: replyTo ? { id: replyTo.id, content: replyTo.content, sender_name: replyTo.sender_name } : null,
    });
    setMessages(prev => [...prev, msg]);
    appendMessage(id!, msg);
    setInputText('');
    setReplyTo(null);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    // Admin auto-acknowledge so the thread feels alive.
    if (isAdmin && type === 'text') {
      setTimeout(() => {
        const ack = newMessage({
          thread_id: id!, sender_id: 'system', sender_name: Config.ADMIN_CONTACT_NAME,
          content: Config.ADMIN_CONTACT_READY
            ? 'Got it! An agent will follow up shortly. You can also call us on ' + Config.ADMIN_CONTACT_NUMBER + '.'
            : 'Got it! An agent will follow up shortly. Our direct line will be shared here soon.',
          type: 'text',
        });
        setMessages(prev => [...prev, ack]);
      }, 1200);
    }
  }, [inputText, replyTo, user, id, isAdmin]);

  const handlePickImage = async () => {
    setAttachMenuVisible(false);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) sendMessage('image', result.assets[0].uri);
  };

  const handleReact = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const reactions = { ...m.reactions };
      const users = reactions[emoji] || [];
      if (users.includes(ME)) {
        reactions[emoji] = users.filter(u => u !== ME);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else reactions[emoji] = [...users, ME];
      return { ...m, reactions };
    }));
    setReactionTarget(null);
  };

  const startRecording = () => {
    setIsRecording(true);
    haptic('medium');
    Animated.loop(Animated.sequence([
      Animated.timing(recordingAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
      Animated.timing(recordingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ])).start();
  };
  const stopRecording = () => {
    setIsRecording(false);
    recordingAnim.stopAnimation();
    recordingAnim.setValue(1);
    sendMessage('voice');
  };

  const callAdmin = () => {
    if (!Config.ADMIN_CONTACT_READY) {
      Alert.alert('Admin line coming soon', 'The RoomLink admin phone number will be added shortly. For now, send your enquiry here in the chat and our team will respond.');
      return;
    }
    Linking.openURL(`tel:${Config.ADMIN_CONTACT_NUMBER}`).catch(() =>
      Alert.alert('Could not start call', `Please dial ${Config.ADMIN_CONTACT_NUMBER} manually.`));
  };

  const grouped = useMemo(() => messages.reduce((groups: any[], msg, i) => {
    const prev = messages[i - 1];
    if (!prev || formatDate(msg.created_at) !== formatDate(prev.created_at)) {
      groups.push({ __date: formatDate(msg.created_at), id: `date-${i}` });
    }
    groups.push(msg);
    return groups;
  }, []), [messages]);

  // ── Access-denied guard: student tried to open another university's community.
  if (allowed === false) {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={[styles.lockIcon, hardShadow(5)]}><Icon name="lock-closed" size={32} color={Colors.ink} /></View>
        <Text style={styles.lockTitle}>This community isn't yours</Text>
        <Text style={styles.lockSub}>You can only access your own university's community. Change your university in your profile to switch communities.</Text>
        <NeoButton title="Go back" icon="arrow-back" onPress={() => router.back()} />
      </View>
    );
  }

  if (allowed === null || !thread) {
    return <View style={[styles.container, styles.center]}><Text style={styles.loading}>Loading…</Text></View>;
  }

  const headerColor = isAdmin ? Colors.green : isGroup ? Colors.cyan : colorFor(thread.title);
  const hasText = inputText.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <IconButton icon="arrow-back" size={42} onPress={() => router.back()} accessibilityLabel="Go back" />
        <View style={styles.headerInfo}>
          <Avatar
            name={thread.title}
            icon={thread.avatar_icon}
            color={headerColor}
            square={isGroup || isAdmin}
            size={42}
          />
          <View style={styles.flex}>
            <Text style={styles.headerName} numberOfLines={1}>{thread.title}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {isGroup ? `${thread.member_count?.toLocaleString()} members • ${thread.online_count} online` : thread.subtitle}
            </Text>
          </View>
        </View>
        {isAdmin && (
          <IconButton icon="call" size={40} color={Colors.green} onPress={callAdmin} accessibilityLabel="Call RoomLink admin" />
        )}
        <IconButton icon="information-circle" size={40} accessibilityLabel="Chat info" />
      </View>

      {isAdmin && (
        <View style={styles.adminBanner}>
          <Icon name="shield-checkmark" size={16} color={Colors.ink} />
          <Text style={styles.adminBannerText}>
            RoomLink handles all landlord enquiries for you. You never contact a landlord directly.
          </Text>
        </View>
      )}

      <ImageBackground
        source={require('../../assets/images/chat-pattern.png')}
        resizeMode="repeat"
        imageStyle={styles.patternImg}
        style={styles.flex}
      >
        <FlatList
          ref={listRef}
          data={grouped}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }: { item: any }) => {
            if (item.__date) {
              return (
                <View style={styles.dateSeparator}>
                  <Text style={styles.dateText}>{item.__date}</Text>
                </View>
              );
            }
            return (
              <MessageBubble
                msg={item}
                isOwn={item.sender_id === ME}
                isGroup={isGroup}
                onReact={(emoji: string) => handleReact(item.id, emoji)}
                onReply={(m: ChatMessage) => setReplyTo(m)}
                onLongPress={(m, anchor) => { setReactionTarget(m); setReactionAnchor(anchor); }}
              />
            );
          }}
        />
      </ImageBackground>

      {reactionTarget && (
        <ReactionPicker
          visible={!!reactionTarget}
          anchor={reactionAnchor}
          onSelect={(emoji: string) => handleReact(reactionTarget.id, emoji)}
          onClose={() => setReactionTarget(null)}
        />
      )}

      <KeyboardSafeView>
        {replyTo && (
          <View style={styles.replyPreviewBar}>
            <View style={styles.replyPreviewBarBar} />
            <View style={styles.flex}>
              <Text style={styles.replyPreviewName}>Replying to {replyTo.sender_name}</Text>
              <Text style={styles.replyPreviewText} numberOfLines={1}>{replyTo.content}</Text>
            </View>
            <Pressable onPress={() => setReplyTo(null)} hitSlop={10} accessibilityLabel="Cancel reply">
              <Icon name="close" size={20} color={Colors.ink} />
            </Pressable>
          </View>
        )}

        <View style={[styles.inputBar, { paddingBottom: keyboardOpen ? 10 : Math.max(insets.bottom, 10) }]}>
          <IconButton
            icon={attachMenuVisible ? 'close' : 'add'}
            size={44}
            color={attachMenuVisible ? Colors.yellow : Colors.surface}
            onPress={() => { setShowEmojiPicker(false); setAttachMenuVisible(!attachMenuVisible); }}
            accessibilityLabel="Attach"
          />
          <View style={styles.inputWrap}>
            <TextInput
              style={[styles.textInput, webReset]}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              selectionColor={Colors.blue}
            />
            <Pressable
              style={styles.emojiBtn}
              onPress={() => { setAttachMenuVisible(false); setShowEmojiPicker(!showEmojiPicker); }}
              hitSlop={8}
              accessibilityLabel="Emoji"
            >
              <Icon name="happy" variant={showEmojiPicker ? 'solid' : 'bold'} size={21} color={Colors.ink} />
            </Pressable>
          </View>
          {hasText ? (
            <IconButton icon="send" size={44} color={Colors.yellow} onPress={() => sendMessage('text')} haptic="light" accessibilityLabel="Send" />
          ) : (
            <Animated.View style={{ transform: [{ scale: isRecording ? recordingAnim : 1 }] }}>
              <Pressable
                onPressIn={startRecording}
                onPressOut={stopRecording}
                accessibilityLabel="Hold to record a voice note"
                style={[styles.micBtn, { backgroundColor: isRecording ? Colors.coral : Colors.ink }, hardShadow(3)]}
              >
                <Icon name={isRecording ? 'stop' : 'mic'} size={20} color={isRecording ? Colors.ink : Colors.yellow} />
              </Pressable>
            </Animated.View>
          )}
        </View>

        {showEmojiPicker && (
          <View style={styles.emojiQuickPick}>
            {['😊','😂','❤️','👍','🙏','🔥','😢','😮','🎉','😅','💯','🥰','😍','🤔','😎'].map(e => (
              <TouchableOpacity key={e} style={styles.emojiPickBtn} onPress={() => { setInputText(t => t + e); setShowEmojiPicker(false); }}>
                <Text style={styles.emojiPick}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {attachMenuVisible && (
          <View style={styles.attachMenu}>
            {([
              { icon: 'image', label: 'Photo', action: handlePickImage, color: Colors.purple },
              { icon: 'camera', label: 'Camera', action: () => setAttachMenuVisible(false), color: Colors.green },
              { icon: 'document', label: 'File', action: () => setAttachMenuVisible(false), color: Colors.orange },
              { icon: 'location', label: 'Location', action: () => setAttachMenuVisible(false), color: Colors.cyan },
            ] as { icon: IconName; label: string; action: () => void; color: string }[]).map(item => (
              <Pressable key={item.label} style={styles.attachItem} onPress={item.action}>
                <View style={[styles.attachItemIcon, { backgroundColor: item.color }, hardShadow(3)]}>
                  <Icon name={item.icon} size={22} color={Colors.ink} />
                </View>
                <Text style={styles.attachItemLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </KeyboardSafeView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 30 },
  loading: { color: Colors.ink, fontSize: 15, fontWeight: '700' },
  patternImg: { opacity: 0.55 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingBottom: 12, paddingHorizontal: 14,
    backgroundColor: Colors.bg, borderBottomWidth: BorderWidth.base, borderBottomColor: Colors.ink,
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerName: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  headerSub: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginTop: 1 },
  adminBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.greenSoft, borderBottomWidth: BorderWidth.thin, borderBottomColor: Colors.ink,
  },
  adminBannerText: { flex: 1, color: Colors.ink, fontSize: 12.5, fontWeight: '500', lineHeight: 17 },

  messageList: { paddingHorizontal: 14, paddingVertical: 14, paddingBottom: 20 },
  dateSeparator: { alignItems: 'center', marginVertical: 14 },
  dateText: {
    color: Colors.ink, fontSize: 11.5, fontWeight: '700',
    backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink, overflow: 'hidden',
  },
  systemWrap: { alignItems: 'center', marginVertical: 8 },
  systemBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: Colors.purpleSoft, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  systemText: { flexShrink: 1, color: Colors.ink, fontSize: 12.5, lineHeight: 17 },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  messageRowOwn: { flexDirection: 'row-reverse' },
  bubbleWrapperOwn: { alignItems: 'flex-end' },
  senderName: { fontSize: 12, fontWeight: '700', color: Colors.ink, marginBottom: 4, marginLeft: 4 },
  replyPreview: {
    flexDirection: 'row', gap: 8, alignItems: 'stretch',
    backgroundColor: Colors.surface, borderRadius: 10, padding: 8, marginBottom: 6,
    borderWidth: 1.5, borderColor: Colors.ink,
  },
  replyPreviewOwn: { backgroundColor: Colors.yellowSoft },
  replyBar: { width: 3, backgroundColor: Colors.ink, borderRadius: 2 },
  replyName: { fontSize: 11.5, fontWeight: '700', color: Colors.ink, marginBottom: 2 },
  replyContent: { fontSize: 12, color: Colors.textSecondary },
  bubble: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  bubbleOwn: { backgroundColor: Colors.yellow, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: Colors.ink, lineHeight: 21 },
  imageFrame: { borderRadius: 14, borderWidth: BorderWidth.thin, borderColor: Colors.ink, backgroundColor: Colors.surface },
  messageImage: { width: 200, height: 150, borderRadius: 12 },
  voiceBubble: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  voicePlayBtn: {
    width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.ink,
  },
  voiceWave: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  voiceBar: { width: 3, borderRadius: 2, backgroundColor: Colors.ink },
  voiceDuration: { fontSize: 11.5, fontWeight: '700', color: Colors.ink },
  msgFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, paddingHorizontal: 2 },
  msgFooterOwn: { flexDirection: 'row-reverse' },
  msgTime: { fontSize: 10.5, fontWeight: '600', color: Colors.textSecondary },
  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4 },
  reactionsRowOwn: { justifyContent: 'flex-end' },
  reactionBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.surface, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1.5, borderColor: Colors.ink,
  },
  reactionBubbleEmoji: { fontSize: 13 },
  reactionBubbleCount: { fontSize: 11.5, color: Colors.ink, fontWeight: '700' },

  reactionOverlay: { flex: 1 },
  reactionPicker: {
    position: 'absolute', flexDirection: 'row', padding: 8,
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  reactionEmojiBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  reactionEmoji: { fontSize: 23 },

  replyPreviewBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.yellowSoft, borderTopWidth: BorderWidth.base, borderTopColor: Colors.ink,
  },
  replyPreviewBarBar: { width: 4, alignSelf: 'stretch', backgroundColor: Colors.ink, borderRadius: 2 },
  replyPreviewName: { fontSize: 12, fontWeight: '700', color: Colors.ink },
  replyPreviewText: { fontSize: 12.5, color: Colors.textSecondary },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 10,
    backgroundColor: Colors.bg, borderTopWidth: BorderWidth.base, borderTopColor: Colors.ink,
  },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-end', minHeight: 44, maxHeight: 110,
    backgroundColor: Colors.surface, borderRadius: 22, paddingLeft: 16, paddingRight: 10, paddingVertical: 4,
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  textInput: {
    flex: 1, color: Colors.ink, fontSize: 15, fontFamily: Fonts.medium, maxHeight: 96,
    paddingTop: Platform.OS === 'ios' ? 9 : 6, paddingBottom: Platform.OS === 'ios' ? 9 : 6,
  },
  emojiBtn: { paddingLeft: 6, paddingBottom: 7 },
  micBtn: {
    width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  emojiQuickPick: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 12,
    backgroundColor: Colors.surface, borderTopWidth: BorderWidth.thin, borderTopColor: Colors.ink,
  },
  emojiPickBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  emojiPick: { fontSize: 24 },
  attachMenu: {
    flexDirection: 'row', justifyContent: 'space-around', padding: 18,
    backgroundColor: Colors.surface, borderTopWidth: BorderWidth.thin, borderTopColor: Colors.ink,
  },
  attachItem: { alignItems: 'center', gap: 8 },
  attachItemIcon: {
    width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  attachItemLabel: { fontSize: 12.5, fontWeight: '700', color: Colors.ink },

  lockIcon: {
    width: 76, height: 76, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.yellow, borderWidth: BorderWidth.thick, borderColor: Colors.ink, marginBottom: 22,
    transform: [{ rotate: '-4deg' }],
  },
  lockTitle: { fontFamily: Fonts.display, fontSize: 22, color: Colors.ink, marginBottom: 10, textAlign: 'center' },
  lockSub: { fontSize: 14.5, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 26 },
}));
