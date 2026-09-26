import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../../components/neo/Icon';
import { BorderWidth, Colors, Fonts, themed } from '../../constants/Colors';
import {
  BottomSheet, Chip, EmptyState, IconButton, NeoButton, NeoCard, NeoInput, PageTitle, Text,
} from '../../components/neo';
import HostelCard from '../../components/HostelCard';
import { MOCK_HOSTELS } from '../../services/mockData';
import type { FilterOptions } from '../../types';

const SORT_OPTIONS = [
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Highest Rated' },
  { id: 'distance', label: 'Nearest First' },
];

const AMENITY_FILTERS = ['WiFi', 'Security', 'Parking', 'AC', 'Gym', 'Kitchen', 'Furnished', 'CCTV', 'Water', 'Laundry'];

function FilterSheet({ visible, onClose, filters, onApply }: {
  visible: boolean; onClose: () => void; filters: FilterOptions; onApply: (f: FilterOptions) => void;
}) {
  const [local, setLocal] = useState<FilterOptions>(filters);

  // Start from the applied filters every time the sheet opens.
  useEffect(() => { if (visible) setLocal(filters); }, [visible]);

  const toggleAmenity = (a: string) => {
    const cur = local.amenities || [];
    setLocal(l => ({
      ...l,
      amenities: cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a],
    }));
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>Filters</Text>
        <Pressable onPress={() => setLocal({})} hitSlop={10}>
          <Text style={styles.clearText}>Clear all</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetBody}>
        <Text style={styles.filterLabel}>Budget range (TZS / month)</Text>
        <View style={styles.budgetRow}>
          <NeoInput
            label="Min"
            placeholder="0"
            value={local.budget_min?.toString() || ''}
            onChangeText={v => setLocal(l => ({ ...l, budget_min: parseInt(v) || 0 }))}
            keyboardType="numeric"
            containerStyle={styles.flex}
          />
          <View style={styles.budgetDash} />
          <NeoInput
            label="Max"
            placeholder="500,000"
            value={local.budget_max?.toString() || ''}
            onChangeText={v => setLocal(l => ({ ...l, budget_max: parseInt(v) || 500000 }))}
            keyboardType="numeric"
            containerStyle={styles.flex}
          />
        </View>

        <Text style={styles.filterLabel}>Room type</Text>
        <View style={styles.pillRow}>
          {['hostel', 'private_room', 'shared_room', 'apartment'].map(t => (
            <Chip
              key={t}
              label={t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              active={local.type === t}
              onPress={() => setLocal(l => ({ ...l, type: l.type === t ? undefined : t }))}
            />
          ))}
        </View>

        <Text style={styles.filterLabel}>Gender preference</Text>
        <View style={styles.pillRow}>
          {['mixed', 'male', 'female'].map(g => (
            <Chip
              key={g}
              label={g.charAt(0).toUpperCase() + g.slice(1)}
              active={local.gender === g}
              onPress={() => setLocal(l => ({ ...l, gender: l.gender === g ? undefined : g }))}
            />
          ))}
        </View>

        <Text style={styles.filterLabel}>Amenities</Text>
        <View style={styles.pillRow}>
          {AMENITY_FILTERS.map(a => (
            <Chip key={a} label={a} active={(local.amenities || []).includes(a)} onPress={() => toggleAmenity(a)} />
          ))}
        </View>

        <Text style={styles.filterLabel}>Minimum rating</Text>
        <View style={styles.pillRow}>
          {[3, 3.5, 4, 4.5].map(r => (
            <Chip
              key={r}
              label={`${r}+`}
              icon="star"
              active={local.min_rating === r}
              onPress={() => setLocal(l => ({ ...l, min_rating: l.min_rating === r ? undefined : r }))}
            />
          ))}
        </View>
      </ScrollView>

      <NeoButton title="Apply filters" size="lg" onPress={() => { onApply(local); onClose(); }} style={styles.applyBtn} />
    </BottomSheet>
  );
}

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('rating');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches] = useState(['UDSM Hostels', 'Ubungo cheap rooms', 'Girls hostel Kinondoni']);

  const filtered = MOCK_HOSTELS
    .filter(h => {
      if (search && !h.name.toLowerCase().includes(search.toLowerCase()) && !h.address.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.budget_min && h.price_per_month < filters.budget_min) return false;
      if (filters.budget_max && h.price_per_month > filters.budget_max) return false;
      if (filters.gender && h.gender_preference !== filters.gender) return false;
      if (filters.type && h.type !== filters.type) return false;
      if (filters.min_rating && h.rating < filters.min_rating) return false;
      if (filters.amenities?.length) {
        if (!filters.amenities.every(a => h.amenities.includes(a))) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === 'price_asc') return a.price_per_month - b.price_per_month;
      if (sort === 'price_desc') return b.price_per_month - a.price_per_month;
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'distance') return (a.distance || 99) - (b.distance || 99);
      return 0;
    });

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)).length;

  return (
    <View style={styles.container}>
      <PageTitle overline="Find a place" title="Explore" />

      <View style={styles.searchRow}>
        <NeoInput
          icon="search"
          placeholder="Search hostels, areas..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          containerStyle={styles.flex}
          fieldStyle={styles.searchField}
          right={search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={10} accessibilityLabel="Clear search">
              <Icon name="close-circle" size={20} color={Colors.ink} />
            </Pressable>
          ) : null}
        />
        <IconButton
          icon="options"
          size={54}
          shadow={3}
          color={activeFilterCount > 0 ? Colors.yellow : Colors.surface}
          onPress={() => setShowFilters(true)}
          accessibilityLabel="Filters"
        >
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </IconButton>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          {SORT_OPTIONS.map(opt => (
            <Chip key={opt.id} label={opt.label} active={sort === opt.id} onPress={() => setSort(opt.id)} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <HostelCard hostel={item} onPress={() => router.push(`/hostel/${item.id}`)} />
        )}
        ListHeaderComponent={(
          <>
            {!search && recentSearches.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.recentTitle}>Recent searches</Text>
                <NeoCard shadow={3} radius={14} clip>
                  {recentSearches.map((s, i) => (
                    <Pressable
                      key={s}
                      style={({ pressed }) => [styles.recentItem, i > 0 && styles.recentDivider, pressed && styles.recentPressed]}
                      onPress={() => setSearch(s)}
                    >
                      <Icon name="time" size={17} color={Colors.ink} />
                      <Text style={styles.recentText}>{s}</Text>
                      <Icon name="arrow-up-right" size={15} color={Colors.ink} />
                    </Pressable>
                  ))}
                </NeoCard>
              </View>
            )}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>{filtered.length} hostels found</Text>
              {activeFilterCount > 0 && (
                <Pressable onPress={() => setFilters({})} hitSlop={10}>
                  <Text style={styles.clearFilters}>Clear filters</Text>
                </Pressable>
              )}
            </View>
          </>
        )}
        ListEmptyComponent={(
          <EmptyState
            icon="home"
            title="No hostels found"
            subtitle="Try adjusting your search or filters"
            action={activeFilterCount > 0 ? 'Clear filters' : undefined}
            onAction={() => setFilters({})}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={setFilters}
      />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
  searchField: { height: 54 },
  filterBadge: {
    position: 'absolute', top: -9, right: -9, minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 4,
    backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.bg,
  },
  filterBadgeText: { color: Colors.yellow, fontSize: 11, fontWeight: '700' },
  sortRow: { paddingHorizontal: 20, paddingBottom: 8, gap: 10 },

  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 130 },
  recentSection: { marginBottom: 12, marginTop: 6 },
  recentTitle: { fontFamily: Fonts.display, fontSize: 16, color: Colors.ink, marginBottom: 10 },
  recentItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  recentDivider: { borderTopWidth: 1.5, borderTopColor: Colors.divider },
  recentPressed: { backgroundColor: Colors.yellowSoft },
  recentText: { flex: 1, color: Colors.ink, fontSize: 14, fontWeight: '600' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  resultsCount: { color: Colors.ink, fontSize: 14, fontWeight: '700' },
  clearFilters: { color: Colors.ink, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },

  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { fontFamily: Fonts.display, fontSize: 26, color: Colors.ink },
  clearText: { color: Colors.ink, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  sheetBody: { paddingBottom: 16, paddingRight: 4 },
  filterLabel: { fontSize: 14, fontWeight: '700', color: Colors.ink, marginTop: 18, marginBottom: 12 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  budgetRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  budgetDash: { width: 14, height: BorderWidth.base, backgroundColor: Colors.ink, marginBottom: 26 },
  applyBtn: { marginTop: 8 },
}));
