import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../../components/neo/Icon';
import { BorderWidth, Colors, Fonts, themed } from '../../constants/Colors';
import { Chip, EmptyState, IconButton, NeoCard, PageTitle, Tag, Text, type IconName } from '../../components/neo';
import RoomStatusTag from '../../components/RoomStatusTag';
import { LANDLORD_ROOMS, type LandlordRoom } from '../../services/landlordData';

const tzs = (n: number) => `TZS ${n.toLocaleString()}`;
const FILTERS = ['all', 'published', 'pending', 'occupied'] as const;

function Action({ icon, label, onPress, danger }: { icon: IconName; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon name={icon} size={16} color={danger ? Colors.errorInk : Colors.ink} />
      <Text style={[styles.actionText, danger && styles.actionDanger]}>{label}</Text>
    </Pressable>
  );
}

export default function LandlordRooms() {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all');
  const rooms = LANDLORD_ROOMS.filter(r => filter === 'all' || r.status === filter);

  const act = (room: LandlordRoom, action: string) =>
    Alert.alert(room.name, `${action} — connect this to your backend to take effect.`);

  return (
    <View style={styles.container}>
      <PageTitle
        overline="Manage listings"
        title="Your rooms"
        right={<IconButton icon="add" color={Colors.purple} size={48} onPress={() => router.push('/landlord/add-room')} accessibilityLabel="Add a room" />}
      />

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map(f => (
            <Chip key={f} label={f[0].toUpperCase() + f.slice(1)} active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {rooms.length === 0 && (
          <EmptyState icon="bed" color={Colors.purple} title="No rooms here" subtitle="Rooms with this status will show up here." />
        )}
        {rooms.map(r => (
          <NeoCard key={r.id} shadow={4} radius={20} clip style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.imgFrame}>
                <Image source={{ uri: r.image }} style={styles.img} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>{r.name}</Text>
                <Text style={styles.price}>{tzs(r.price_per_month)}<Text style={styles.pricePer}>/mo</Text></Text>
                <Text style={styles.uni}>{r.university}</Text>
                <View style={styles.metaRow}>
                  <RoomStatusTag status={r.status} />
                  {r.is_featured && <Tag label="Featured" icon="star" color={Colors.yellow} />}
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Icon name="eye" size={14} color={Colors.ink} />
                <Text style={styles.statText}>{r.views.toLocaleString()} views</Text>
              </View>
              <View style={styles.stat}>
                <Icon name="heart" size={14} color={Colors.ink} />
                <Text style={styles.statText}>{r.saves} saves</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Action icon="create" label="Edit" onPress={() => act(r, 'Edit room')} />
              <View style={styles.actionSep} />
              <Action
                icon={r.status === 'paused' ? 'play' : 'pause'}
                label={r.status === 'paused' ? 'Resume' : 'Pause'}
                onPress={() => act(r, 'Toggle listing')}
              />
              <View style={styles.actionSep} />
              <Action icon="trash" label="Delete" danger onPress={() => act(r, 'Delete room')} />
            </View>
          </NeoCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  filters: { gap: 10, paddingHorizontal: 20, paddingBottom: 8 },
  list: { padding: 20, paddingTop: 12, paddingBottom: 130 },
  card: { marginBottom: 20 },
  cardTop: { flexDirection: 'row', gap: 12, padding: 12 },
  imgFrame: { borderRadius: 14, borderWidth: BorderWidth.base, borderColor: Colors.ink, alignSelf: 'flex-start' },
  img: { width: 96, height: 96, borderRadius: 14 - BorderWidth.base },
  info: { flex: 1 },
  name: { color: Colors.ink, fontSize: 15.5, fontWeight: '700' },
  price: { fontFamily: Fonts.display, color: Colors.blue, fontSize: 15, marginTop: 4 },
  pricePer: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textSecondary },
  uni: { color: Colors.textSecondary, fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 18, paddingHorizontal: 14, paddingBottom: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { color: Colors.ink, fontSize: 12.5, fontWeight: '600' },
  actions: {
    flexDirection: 'row', borderTopWidth: BorderWidth.thin, borderTopColor: Colors.ink,
  },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  actionPressed: { backgroundColor: Colors.yellowSoft },
  actionSep: { width: BorderWidth.thin, backgroundColor: Colors.ink },
  actionText: { color: Colors.ink, fontSize: 13, fontWeight: '700' },
  actionDanger: { color: Colors.errorInk },
}));
