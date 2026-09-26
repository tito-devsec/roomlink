import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Icon } from '../../components/neo/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import {
  Chip, IconButton, NeoButton, NeoCard, NeoPressable, SectionHeader, StatTile, Tag, Text,
  type IconName,
} from '../../components/neo';
import HostelCard from '../../components/HostelCard';
import { MOCK_HOSTELS } from '../../services/mockData';
import { listHostels } from '../../services/data';
import type { Hostel } from '../../types';
import { useDemoSession } from '../../services/demoAuth';

const CATEGORIES: { id: string; label: string; icon: IconName }[] = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'hostel', label: 'Hostel', icon: 'bed' },
  { id: 'private', label: 'Private', icon: 'home' },
  { id: 'shared', label: 'Shared', icon: 'people' },
  { id: 'apartment', label: 'Apartment', icon: 'business' },
];

const STATS = themed((): { icon: IconName; value: string; label: string; color: string }[] => [
  { icon: 'home', value: '2K+', label: 'Hostels', color: Colors.pink },
  { icon: 'people', value: '15K+', label: 'Students', color: Colors.cyan },
  { icon: 'school', value: '25+', label: 'Universities', color: Colors.green },
  { icon: 'star', value: '4.8', label: 'Avg rating', color: Colors.purple },
]);

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width * 0.72, 320); // phones: 72% of the screen
  const { user } = useUser();
  const demo = useDemoSession();
  const [activeCategory, setActiveCategory] = useState('all');

  // Live data from Supabase (falls back to mock instantly while loading / if empty).
  const [hostels, setHostels] = useState<Hostel[]>(MOCK_HOSTELS);
  useEffect(() => {
    let alive = true;
    listHostels('all').then(rows => { if (alive) setHostels(rows); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const filtered = activeCategory === 'all'
    ? hostels
    : hostels.filter(h =>
        activeCategory === 'private' ? h.type === 'private_room' :
        activeCategory === 'shared' ? h.type === 'shared_room' :
        h.type === activeCategory
      );

  const featured = hostels.slice(0, 4);
  const firstName = user?.firstName || demo?.firstName || 'Student';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Yellow header block */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <View style={styles.greetingRow}>
              <Text style={styles.greeting}>{greeting()}, {firstName}</Text>
              <Icon name="hand-wave" size={15} color={Colors.ink} />
            </View>
            <Text style={styles.headline}>Find your{'\n'}next room</Text>
          </View>
          <View style={styles.headerRight}>
            <IconButton icon="notifications" size={44} accessibilityLabel="Notifications">
              <View style={styles.notifDot} />
            </IconButton>
            <NeoPressable
              onPress={() => router.push('/(tabs)/profile')}
              shadow={3}
              accessibilityLabel="Your profile"
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{firstName[0].toUpperCase()}</Text>
            </NeoPressable>
          </View>
        </View>

        <NeoPressable
          onPress={() => router.push('/(tabs)/explore')}
          shadow={4}
          accessibilityLabel="Search hostels"
          style={styles.searchBar}
        >
          <Icon name="search" size={20} color={Colors.ink} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>Search hostels, universities...</Text>
          <View style={styles.filterTile}>
            <Icon name="options" size={18} color={Colors.yellow} />
          </View>
        </NeoPressable>
      </View>

      {/* Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
        {STATS.map(s => (
          <StatTile key={s.label} icon={s.icon} value={s.value} label={s.label} color={s.color} width={118} />
        ))}
      </ScrollView>

      {/* Featured hostels */}
      <SectionHeader title="Featured Hostels" action="See all" onAction={() => router.push('/(tabs)/explore')} style={styles.sectionHead} />
      <FlatList
        data={featured}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuredRow}
        renderItem={({ item }) => (
          <HostelCard hostel={item} variant="featured" width={cardWidth} onPress={() => router.push(`/hostel/${item.id}`)} />
        )}
        keyExtractor={item => item.id}
      />

      {/* Roommate promo */}
      <NeoCard color={Colors.coral} shadow={5} style={styles.promo}>
        <View style={styles.promoIcon}><Icon name="handshake" size={24} color={Colors.ink} /></View>
        <View style={styles.promoText}>
          <Text style={styles.promoTitle}>Need a roommate?</Text>
          <Text style={styles.promoSub}>Match with students at your university</Text>
        </View>
        <NeoButton title="Match" size="sm" onPress={() => router.push('/roommate')} />
      </NeoCard>

      {/* Categories */}
      <SectionHeader title="Browse by Type" style={styles.sectionHead} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {CATEGORIES.map(cat => (
          <Chip
            key={cat.id}
            label={cat.label}
            icon={cat.icon}
            active={activeCategory === cat.id}
            onPress={() => setActiveCategory(cat.id)}
          />
        ))}
      </ScrollView>

      {/* All listings */}
      <View style={styles.nearbyHead}>
        <SectionHeader title="Nearby Hostels" style={styles.flex} />
        <Tag label={`${filtered.length} found`} color={Colors.surface} size="md" />
      </View>
      <View style={styles.list}>
        {filtered.map(hostel => (
          <HostelCard key={hostel.id} hostel={hostel} onPress={() => router.push(`/hostel/${hostel.id}`)} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 130 },
  flex: { flex: 1 },

  header: {
    backgroundColor: Colors.yellow, paddingHorizontal: 20, paddingBottom: 24,
    borderBottomWidth: BorderWidth.thick, borderColor: Colors.ink,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  headerText: { flex: 1 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greeting: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  headline: { fontFamily: Fonts.display, fontSize: 34, lineHeight: 40, color: Colors.ink, marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifDot: {
    position: 'absolute', top: 7, right: 8, width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.coral, borderWidth: 1.5, borderColor: Colors.ink,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.pink, borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  avatarText: { fontFamily: Fonts.display, fontSize: 18, color: Colors.ink },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 56, paddingLeft: 16, paddingRight: 7,
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  searchPlaceholder: { flex: 1, color: Colors.textMuted, fontSize: 15, fontWeight: '500' },
  filterTile: {
    width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.ink,
  },

  statsRow: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8, gap: 12 },

  sectionHead: { paddingHorizontal: 20, marginTop: 22, marginBottom: 14 },
  featuredRow: { paddingHorizontal: 20, paddingBottom: 8, gap: 16 },

  promo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 22, padding: 14 },
  promoIcon: {
    width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: BorderWidth.base, borderColor: Colors.ink,
    ...hardShadow(2),
  },
  promoText: { flex: 1 },
  promoTitle: { fontFamily: Fonts.display, fontSize: 16, color: Colors.ink },
  promoSub: { fontSize: 13, color: Colors.ink, fontWeight: '500', marginTop: 2 },

  chipRow: { paddingHorizontal: 20, paddingBottom: 6, gap: 10 },
  nearbyHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginTop: 22, marginBottom: 14 },
  list: { paddingHorizontal: 20 },
}));
