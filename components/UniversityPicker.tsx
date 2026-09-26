// UniversityPicker — a search-as-you-type university selector.
//
// Behaviour required by the product:
//  • The student types their university name and the list filters to names that
//    contain those letters (fuzzy-ish "similar letters" match).
//  • The FEATURED university (admin-added; Config.FEATURED_UNIVERSITY_ID) is
//    always shown first and badged, so the popular default leads the list.
//  • Selecting one closes the dropdown and reports the university id upward.

import { useMemo, useState } from 'react';
import {
  View, StyleSheet, TextInput, TouchableOpacity, FlatList, Pressable, Platform, type TextStyle,
} from 'react-native';
import { Icon } from './neo/Icon';
import { BorderRadius, BorderWidth, Colors, Fonts, hardShadow, themed } from '../constants/Colors';
import { Config } from '../constants/Config';
import { MOCK_UNIVERSITIES } from '../services/mockData';
import type { University } from '../types';
import { Text } from './neo';

interface Props {
  value?: string;                       // selected university id
  onChange: (id: string) => void;
  universities?: University[];
  placeholder?: string;
}

// Rank matches: featured first, then names that START with the query, then names
// that merely contain it, then a loose "shares most letters" fallback.
function rankUniversities(all: University[], query: string): University[] {
  const featuredId = Config.FEATURED_UNIVERSITY_ID;
  const q = query.trim().toLowerCase();

  const withFeaturedFirst = [...all].sort((a, b) => {
    const af = a.id === featuredId || a.is_featured ? 1 : 0;
    const bf = b.id === featuredId || b.is_featured ? 1 : 0;
    if (af !== bf) return bf - af;
    return a.name.localeCompare(b.name);
  });

  if (!q) return withFeaturedFirst;

  const score = (u: University): number => {
    const name = u.name.toLowerCase();
    const short = (u.short_name || '').toLowerCase();
    let s = 0;
    if (u.id === featuredId || u.is_featured) s += 0.5;      // keep admin pick sticky
    if (name.startsWith(q) || short.startsWith(q)) s += 100;
    else if (name.includes(q) || short.includes(q)) s += 60;
    else {
      // loose: fraction of query letters present in the name
      const present = q.split('').filter(ch => name.includes(ch)).length;
      s += (present / q.length) * 30;
    }
    return s;
  };

  return withFeaturedFirst
    .map(u => ({ u, s: score(u) }))
    .filter(x => x.s > 5)
    .sort((a, b) => b.s - a.s)
    .map(x => x.u);
}

const webReset = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

export default function UniversityPicker({ value, onChange, universities = MOCK_UNIVERSITIES, placeholder = 'Type your university…' }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selected = universities.find(u => u.id === value);
  const results = useMemo(() => rankUniversities(universities, query), [universities, query]);
  const featuredId = Config.FEATURED_UNIVERSITY_ID;

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[styles.field, open && styles.fieldOpen, hardShadow(open ? 4 : 3)]}
        activeOpacity={0.85}
        onPress={() => setOpen(o => !o)}
        accessibilityRole="button"
        accessibilityLabel={selected ? `University: ${selected.name}` : 'Select your university'}
      >
        <Icon name="school" size={18} color={Colors.ink} />
        <Text style={[styles.fieldText, !selected && styles.fieldPlaceholder]} numberOfLines={1}>
          {selected ? selected.name : 'Select your university'}
        </Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.ink} />
      </TouchableOpacity>

      {open && (
        <View style={[styles.dropdown, hardShadow(4)]}>
          <View style={styles.searchRow}>
            <Icon name="search" size={16} color={Colors.ink} />
            <TextInput
              style={[styles.searchInput, webReset]}
              placeholder={placeholder}
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              autoCorrect={false}
              selectionColor={Colors.blue}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                <Icon name="close-circle" size={18} color={Colors.ink} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={results}
            keyExtractor={u => u.id}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>No university matches “{query}”.</Text>}
            renderItem={({ item, index }) => {
              const isFeatured = item.id === featuredId || item.is_featured;
              const isSelected = item.id === value;
              return (
                <TouchableOpacity
                  style={[styles.item, index > 0 && styles.itemDivider, isSelected && styles.itemSelected]}
                  onPress={() => { onChange(item.id); setOpen(false); setQuery(''); }}
                >
                  <View style={styles.itemMain}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemMeta} numberOfLines={1}>
                      {item.short_name ? item.short_name + ' • ' : ''}{item.city}
                    </Text>
                  </View>
                  {isFeatured && (
                    <View style={styles.badge}>
                      <Icon name="star" variant="solid" size={10} color={Colors.yellow} />
                      <Text style={styles.badgeText}>Featured</Text>
                    </View>
                  )}
                  {isSelected && <Icon name="checkmark-circle" size={20} color={Colors.ink} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { position: 'relative', zIndex: 20 },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: 14, height: 54,
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  fieldOpen: { backgroundColor: Colors.highlight },
  fieldText: { flex: 1, color: Colors.ink, fontSize: 15, fontWeight: '600' },
  fieldPlaceholder: { color: Colors.textMuted, fontWeight: '500' },
  dropdown: {
    marginTop: 12, backgroundColor: Colors.surface, borderRadius: BorderRadius.md + 2,
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
    maxHeight: 330,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, height: 48,
    borderBottomWidth: BorderWidth.base, borderBottomColor: Colors.ink,
  },
  searchInput: { flex: 1, color: Colors.ink, fontSize: 14, fontFamily: Fonts.medium },
  list: { maxHeight: 276, borderBottomLeftRadius: BorderRadius.md, borderBottomRightRadius: BorderRadius.md },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  itemDivider: { borderTopWidth: 1.5, borderTopColor: Colors.divider },
  itemSelected: { backgroundColor: Colors.yellow },
  itemMain: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  itemMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.ink, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.yellow },
  empty: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', padding: 18 },
}));
