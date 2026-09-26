import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Icon } from '../../components/neo/Icon';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import {
  Avatar, EmptyState, IconButton, NeoInput, NeoPressable, PageTitle, Segmented, Text,
} from '../../components/neo';
import { MOCK_UNIVERSITIES } from '../../services/mockData';
import { getMyUniversityId } from '../../services/profile';
import { buildChatList, communityThreadId, type ChatListItem } from '../../services/chat';

type ChatTab = 'all' | 'community' | 'direct';

function ChatItem({ chat, onPress }: { chat: ChatListItem; onPress: () => void }) {
  const isGroup = chat.kind === 'community';
  const hasUnread = chat.unread > 0;
  return (
    <NeoPressable onPress={onPress} shadow={3} accessibilityLabel={chat.title} style={[styles.chatItem, hasUnread && styles.chatItemUnread]}>
      <View>
        <Avatar
          name={chat.title}
          icon={chat.avatar_icon}
          color={chat.color}
          square={chat.kind !== 'direct'}
          size={52}
        />
        {chat.online_count ? <View style={styles.onlineDot} /> : null}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatTopRow}>
          <View style={styles.chatNameRow}>
            {isGroup && <Icon name="people" size={13} color={Colors.ink} />}
            {chat.kind === 'admin' && <Icon name="shield-checkmark" size={13} color={Colors.ink} />}
            <Text style={styles.chatName} numberOfLines={1}>{chat.title}</Text>
          </View>
          <Text style={[styles.chatTime, hasUnread && styles.chatTimeUnread]}>{chat.time}</Text>
        </View>
        <View style={styles.chatBottomRow}>
          <Text style={[styles.chatMsg, hasUnread && styles.chatMsgUnread]} numberOfLines={1}>{chat.subtitle}</Text>
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{chat.unread > 99 ? '99+' : chat.unread}</Text>
            </View>
          )}
        </View>
        {isGroup && (
          <Text style={styles.participantCount}>{chat.member_count?.toLocaleString()} members • {chat.online_count} online</Text>
        )}
      </View>
    </NeoPressable>
  );
}

export default function MessagesScreen() {
  const [activeTab, setActiveTab] = useState<ChatTab>('all');
  const [search, setSearch] = useState('');
  const [uniId, setUniId] = useState<string>('');
  const [chats, setChats] = useState<ChatListItem[]>([]);

  const refresh = useCallback(async () => {
    const uid = await getMyUniversityId();
    setUniId(uid);
    setChats(buildChatList(uid));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const uni = MOCK_UNIVERSITIES.find(u => u.id === uniId);

  const filtered = chats.filter(c => {
    if (activeTab === 'community' && c.kind !== 'community') return false;
    if (activeTab === 'direct' && c.kind !== 'direct') return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalUnread = chats.reduce((sum, c) => sum + (c.unread || 0), 0);
  const showBanner = (activeTab === 'all' || activeTab === 'community') && !search;

  return (
    <View style={styles.container}>
      <PageTitle
        overline={totalUnread > 0 ? `${totalUnread} unread` : 'Chats & community'}
        title="Messages"
        right={<IconButton icon="create" color={Colors.yellow} size={48} onPress={() => router.push('/chat/new')} accessibilityLabel="New message" />}
      />

      <View style={styles.controls}>
        <NeoInput
          icon="search"
          placeholder="Search chats..."
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.search}
          right={search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={10} accessibilityLabel="Clear search">
              <Icon name="close-circle" size={20} color={Colors.ink} />
            </Pressable>
          ) : null}
        />
        <Segmented
          options={[
            { value: 'all', label: 'All' },
            { value: 'community', label: 'Community' },
            { value: 'direct', label: 'Direct' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ChatItem chat={item} onPress={() => router.push(`/chat/${item.id}`)} />}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListHeaderComponent={showBanner ? (
          <View style={[styles.communityBanner, hardShadow(4)]}>
            <View style={styles.bannerIcon}><Icon name="school" size={22} color={Colors.ink} /></View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Your University Community</Text>
              <Text style={styles.bannerSubtitle} numberOfLines={1}>
                {uni?.short_name || uni?.name || 'Your university'} • {uni?.student_count?.toLocaleString() || ''} members
              </Text>
            </View>
            <NeoPressable
              onPress={() => router.push(`/chat/${communityThreadId(uniId)}`)}
              shadow={2}
              accessibilityLabel="Open community chat"
              style={styles.openBtn}
            >
              <Text style={styles.openText}>Open</Text>
              <Icon name="arrow-forward" size={14} color={Colors.yellow} />
            </NeoPressable>
          </View>
        ) : null}
        ListEmptyComponent={(
          <EmptyState
            icon="chatbubbles"
            color={Colors.cyan}
            title="No conversations yet"
            subtitle="Open your university community or start a private chat"
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  controls: { paddingHorizontal: 20, gap: 14, paddingBottom: 6 },
  search: {},
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 130, flexGrow: 1 },
  sep: { height: 14 },

  communityBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, padding: 14,
    backgroundColor: Colors.yellow, borderRadius: 18, borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  bannerIcon: {
    width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontFamily: Fonts.display, fontSize: 15, color: Colors.ink, marginBottom: 2 },
  bannerSubtitle: { fontSize: 12.5, fontWeight: '600', color: Colors.ink },
  openBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.ink, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  openText: { color: Colors.yellow, fontSize: 13, fontWeight: '700' },

  chatItem: {
    flexDirection: 'row', alignItems: 'center', gap: 13, padding: 12,
    backgroundColor: Colors.surface, borderRadius: 18, borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  chatItemUnread: { backgroundColor: Colors.highlight },
  onlineDot: {
    position: 'absolute', bottom: -2, right: -2, width: 15, height: 15, borderRadius: 8,
    backgroundColor: Colors.green, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  chatInfo: { flex: 1 },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3, gap: 8 },
  chatNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  chatName: { fontSize: 15.5, fontWeight: '700', color: Colors.ink, flex: 1 },
  chatTime: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  chatTimeUnread: { color: Colors.ink, fontWeight: '700' },
  chatBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  chatMsg: { fontSize: 13.5, color: Colors.textSecondary, flex: 1 },
  chatMsgUnread: { color: Colors.ink, fontWeight: '600' },
  unreadBadge: {
    backgroundColor: Colors.coral, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 1,
    minWidth: 24, alignItems: 'center', borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  unreadText: { color: Colors.ink, fontSize: 11.5, fontWeight: '700' },
  participantCount: { fontSize: 11.5, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' },
}));
