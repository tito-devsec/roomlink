import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../../components/neo/Icon';
import { BorderWidth, Colors, themed } from '../../constants/Colors';
import { Avatar, EmptyState, NeoInput, NeoPressable, ScreenHeader, Text } from '../../components/neo';
import { MOCK_UNIVERSITIES } from '../../services/mockData';
import { getMyUniversityId } from '../../services/profile';
import { searchStudentsByName } from '../../services/students';
import { directThreadId } from '../../services/chat';
import type { StudentProfile } from '../../types';

const YEAR = (n?: number) => n ? `${n}${['st','nd','rd'][n-1] || 'th'} Year` : 'Student';

export default function NewChatScreen() {
  const [search, setSearch] = useState('');
  const [uniId, setUniId] = useState<string>('');
  const [results, setResults] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const uid = await getMyUniversityId();
      setUniId(uid);
      const list = await searchStudentsByName('', uid);
      setResults(list);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!uniId) return;
    let active = true;
    (async () => {
      const list = await searchStudentsByName(search, uniId);
      if (active) setResults(list);
    })();
    return () => { active = false; };
  }, [search, uniId]);

  const uni = MOCK_UNIVERSITIES.find(u => u.id === uniId);

  return (
    <View style={styles.container}>
      <ScreenHeader title="New message" />

      <View style={styles.top}>
        <NeoInput
          icon="search"
          placeholder="Search students by name…"
          value={search}
          onChangeText={setSearch}
          autoFocus
          autoCorrect={false}
          right={search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={10} accessibilityLabel="Clear search">
              <Icon name="close-circle" size={20} color={Colors.ink} />
            </Pressable>
          ) : null}
        />
        <View style={styles.scopeNote}>
          <Icon name="people" size={16} color={Colors.ink} />
          <Text style={styles.scopeText}>
            Showing students in <Text style={styles.scopeStrong}>{uni?.short_name || uni?.name || 'your university'}</Text>. People are found by name — no phone numbers.
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.spinner} color={Colors.ink} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={(
            <EmptyState icon="search" color={Colors.cyan} title="No one found" subtitle={`No student named “${search}” in your community.`} />
          )}
          renderItem={({ item }) => (
            <NeoPressable
              onPress={() => router.push(`/chat/${directThreadId(item.id)}`)}
              shadow={3}
              accessibilityLabel={`Message ${item.full_name}`}
              style={styles.userRow}
            >
              <View>
                <Avatar name={item.full_name} color={item.avatar_color} size={50} />
                {item.is_online && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.full_name}</Text>
                <Text style={styles.userSub}>{uni?.short_name || 'University'} • {YEAR(item.year_of_study)}</Text>
              </View>
              <View style={styles.msgBtn}>
                <Icon name="chatbubble" size={16} color={Colors.yellow} />
              </View>
            </NeoPressable>
          )}
        />
      )}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  top: { padding: 20, paddingBottom: 6, gap: 14 },
  scopeNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.blueSoft, padding: 12, borderRadius: 12,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  scopeText: { flex: 1, fontSize: 12.5, color: Colors.ink, lineHeight: 18 },
  scopeStrong: { fontWeight: '700' },
  spinner: { marginTop: 40 },
  list: { padding: 20, paddingBottom: 60 },
  sep: { height: 12 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13, padding: 12,
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  onlineDot: {
    position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.green, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 15.5, fontWeight: '700', color: Colors.ink, marginBottom: 2 },
  userSub: { fontSize: 12.5, color: Colors.textSecondary, fontWeight: '500' },
  msgBtn: {
    width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.ink,
  },
}));
