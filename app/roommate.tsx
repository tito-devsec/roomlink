import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../components/neo/Icon';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../constants/Colors';
import { Avatar, Chip, EmptyState, NeoButton, NeoCard, ScreenHeader, Tag, Text } from '../components/neo';
import { MOCK_UNIVERSITIES } from '../services/mockData';
import { getMyProfile, saveMyProfile, type MyProfile } from '../services/profile';
import { listStudentsByUniversity } from '../services/students';
import { rankRoommates, matchColor, type RoommateMatch } from '../services/roommate';
import { directThreadId } from '../services/chat';
import type { RoommatePrefs } from '../types';

const PREF_QUESTIONS: { key: keyof RoommatePrefs; label: string; options: { id: string; label: string }[] }[] = [
  { key: 'sleep', label: 'Sleep schedule', options: [{ id: 'early', label: 'Early bird' }, { id: 'flexible', label: 'Flexible' }, { id: 'late', label: 'Night owl' }] },
  { key: 'cleanliness', label: 'Cleanliness', options: [{ id: 'very_tidy', label: 'Very tidy' }, { id: 'tidy', label: 'Tidy' }, { id: 'relaxed', label: 'Relaxed' }] },
  { key: 'study', label: 'Study style', options: [{ id: 'quiet', label: 'Quiet' }, { id: 'mixed', label: 'Mixed' }, { id: 'social', label: 'Social' }] },
  { key: 'smoking', label: 'Smoking', options: [{ id: 'no', label: 'No' }, { id: 'ok_with_it', label: "OK with it" }, { id: 'yes', label: 'Yes' }] },
  { key: 'guests', label: 'Guests', options: [{ id: 'rarely', label: 'Rarely' }, { id: 'sometimes', label: 'Sometimes' }, { id: 'often', label: 'Often' }] },
];

function MatchStamp({ percent }: { percent: number }) {
  return (
    <View style={[styles.stamp, { backgroundColor: matchColor(percent) }, hardShadow(3)]}>
      <Text style={styles.stampPct}>{percent}%</Text>
      <Text style={styles.stampLbl}>match</Text>
    </View>
  );
}

function MatchCard({ match, uniName, onMessage }: { match: RoommateMatch; uniName: string; onMessage: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const s = match.student;
  return (
    <NeoCard shadow={4} radius={20} style={styles.card}>
      <Pressable style={styles.cardTop} onPress={() => setExpanded(e => !e)} accessibilityRole="button">
        <Avatar name={s.full_name} color={s.avatar_color} size={54} />
        <View style={styles.flex}>
          <Text style={styles.name}>{s.full_name}</Text>
          <Text style={styles.meta}>{uniName} • {s.year_of_study ? `Year ${s.year_of_study}` : 'Student'}</Text>
          <Tag label={match.headline} color={matchColor(match.percent)} style={styles.headline} />
        </View>
        <MatchStamp percent={match.percent} />
      </Pressable>

      {s.bio ? <Text style={styles.bio}>{s.bio}</Text> : null}

      {expanded && (
        <View style={styles.breakdown}>
          {match.breakdown.map(b => {
            const pct = Math.round(b.score * 100);
            return (
              <View key={b.label} style={styles.brRow}>
                <Text style={styles.brLabel}>{b.label}</Text>
                <View style={styles.brBarTrack}>
                  <View style={[styles.brBarFill, { width: `${pct}%`, backgroundColor: matchColor(pct) }]} />
                </View>
                <Text style={styles.brPct}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.cardActions}>
        <Pressable style={styles.detailsBtn} onPress={() => setExpanded(e => !e)} hitSlop={8}>
          <Text style={styles.detailsBtnText}>{expanded ? 'Hide breakdown' : 'Why we matched'}</Text>
          <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={Colors.ink} />
        </Pressable>
        <NeoButton title="Message" icon="chatbubble" size="sm" onPress={onMessage} />
      </View>
    </NeoCard>
  );
}

export default function RoommateScreen() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [matches, setMatches] = useState<RoommateMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const compute = useCallback(async (p: MyProfile) => {
    const members = await listStudentsByUniversity(p.university_id);
    setMatches(rankRoommates(p, members));
  }, []);

  useEffect(() => {
    (async () => {
      const p = await getMyProfile();
      setProfile(p);
      await compute(p);
      setLoading(false);
    })();
  }, [compute]);

  const setPref = async (key: keyof RoommatePrefs, val: string) => {
    if (!profile) return;
    const next = await saveMyProfile({ roommate: { ...profile.roommate, [key]: val } as RoommatePrefs });
    setProfile(next);
    await compute(next);
  };

  const uni = MOCK_UNIVERSITIES.find(u => u.id === profile?.university_id);
  const uniName = uni?.short_name || uni?.name || 'Your university';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Roommate Match"
        subtitle={`Within ${uniName}`}
        right={<View style={[styles.headerIcon, hardShadow(2)]}><Icon name="handshake" size={20} color={Colors.ink} /></View>}
      />

      {loading ? (
        <ActivityIndicator style={styles.spinner} color={Colors.ink} />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={m => m.student.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={(
            <View>
              <NeoCard color={Colors.yellowSoft} shadow={4} radius={20} style={styles.prefsCard}>
                <Text style={styles.prefsTitle}>Your preferences</Text>
                <Text style={styles.prefsSub}>Tap to update — matches recalculate instantly.</Text>
                {PREF_QUESTIONS.map(q => (
                  <View key={q.key} style={styles.prefRow}>
                    <Text style={styles.prefLabel}>{q.label}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prefChips}>
                      {q.options.map(opt => (
                        <Chip
                          key={opt.id}
                          label={opt.label}
                          active={profile?.roommate?.[q.key] === opt.id}
                          onPress={() => setPref(q.key, opt.id)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                ))}
              </NeoCard>
              <Text style={styles.resultsHeading}>
                {matches.length} potential roommate{matches.length === 1 ? '' : 's'} in {uniName}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              uniName={uniName}
              onMessage={() => router.push(`/chat/${directThreadId(item.student.id)}`)}
            />
          )}
          ListEmptyComponent={(
            <EmptyState icon="user-slash" color={Colors.purple} title="No matches yet" subtitle={`No students in ${uniName} are looking for a roommate right now.`} />
          )}
        />
      )}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  spinner: { marginTop: 60 },
  headerIcon: {
    width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.yellow, borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  list: { padding: 18, paddingBottom: 48 },

  prefsCard: { padding: 16, marginBottom: 22 },
  prefsTitle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.ink },
  prefsSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, marginBottom: 14 },
  prefRow: { marginBottom: 12 },
  prefLabel: { fontSize: 13, fontWeight: '700', color: Colors.ink, marginBottom: 8 },
  prefChips: { gap: 8, paddingBottom: 4, paddingRight: 4 },
  resultsHeading: { fontFamily: Fonts.display, fontSize: 16, color: Colors.ink, marginBottom: 14 },

  card: { padding: 16, marginBottom: 18 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 16.5, fontWeight: '700', color: Colors.ink },
  meta: { fontSize: 12.5, color: Colors.textSecondary, marginTop: 2 },
  headline: { marginTop: 6 },
  stamp: {
    width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.base, borderColor: Colors.ink, transform: [{ rotate: '4deg' }],
  },
  stampPct: { fontFamily: Fonts.display, fontSize: 18, color: Colors.ink },
  stampLbl: { fontSize: 10, fontWeight: '700', color: Colors.ink, marginTop: -2 },
  bio: { fontSize: 13.5, color: Colors.textSecondary, lineHeight: 19, marginTop: 14 },
  breakdown: {
    marginTop: 14, gap: 9, padding: 12, borderRadius: 14,
    backgroundColor: Colors.bg, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  brRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brLabel: { width: 100, fontSize: 12, fontWeight: '600', color: Colors.ink },
  brBarTrack: {
    flex: 1, height: 12, borderRadius: 6, backgroundColor: Colors.surface, overflow: 'hidden',
    borderWidth: 1.5, borderColor: Colors.ink,
  },
  brBarFill: { height: '100%' },
  brPct: { width: 36, textAlign: 'right', fontSize: 12, color: Colors.ink, fontWeight: '700' },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailsBtnText: { color: Colors.ink, fontSize: 13.5, fontWeight: '700', textDecorationLine: 'underline' },
}));
