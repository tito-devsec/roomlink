import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../../components/neo/Icon';
import { useUser } from '@clerk/clerk-expo';
import { BorderWidth, Colors, Fonts, themed } from '../../constants/Colors';
import { Config } from '../../constants/Config';
import {
  EmptyState, NeoButton, NeoCard, ScreenHeader, Segmented, StatTile, Tag, Text, type IconName,
} from '../../components/neo';
import { listBookings } from '../../services/data';
import { MOCK_HOSTELS } from '../../services/mockData';

const MOCK_BOOKINGS = [
  { id: '1', hostel: MOCK_HOSTELS[0], status: 'confirmed', check_in: '2024-02-01', duration: 3, total: 540000, booking_code: 'RL-2024-001' },
  { id: '2', hostel: MOCK_HOSTELS[1], status: 'pending', check_in: '2024-03-15', duration: 6, total: 1500000, booking_code: 'RL-2024-002' },
  { id: '3', hostel: MOCK_HOSTELS[2], status: 'completed', check_in: '2023-09-01', duration: 12, total: 1440000, booking_code: 'RL-2023-089' },
  { id: '4', hostel: MOCK_HOSTELS[3], status: 'cancelled', check_in: '2023-12-01', duration: 1, total: 150000, booking_code: 'RL-2023-200' },
];

const STATUS_CONFIG = themed((): Record<string, { color: string; label: string; icon: IconName }> => ({
  confirmed: { color: Colors.green, label: 'Confirmed', icon: 'checkmark-circle' },
  pending: { color: Colors.orange, label: 'Pending', icon: 'time' },
  completed: { color: Colors.cyan, label: 'Completed', icon: 'archive' },
  cancelled: { color: Colors.coral, label: 'Cancelled', icon: 'close-circle' },
}));

type Tab = 'all' | 'active' | 'past';

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const { user } = useUser();
  const [bookings, setBookings] = useState<any[]>(MOCK_BOOKINGS);
  useEffect(() => {
    let alive = true;
    listBookings(user?.id).then(rows => {
      if (!alive || !rows.length) return;
      setBookings(rows.map((r: any) => ({
        id: r.id, status: r.status,
        check_in: r.check_in_date, duration: r.duration_months,
        total: r.total_amount, booking_code: r.booking_code,
        hostel: { id: r.hostel_id, name: r.hostel?.name || 'Hostel', address: r.hostel?.address || '', images: r.hostel?.images || [] },
      })));
    }).catch(() => {});
    return () => { alive = false; };
  }, [user?.id]);

  const filtered = bookings.filter((b: any) => {
    if (activeTab === 'active') return ['confirmed', 'pending'].includes(b.status);
    if (activeTab === 'past') return ['completed', 'cancelled'].includes(b.status);
    return true;
  });

  // All booking support goes through the RoomLink admin, never the landlord.
  const contactAdmin = (hostel: any) => {
    const code = bookings.find((b: any) => b.hostel.id === hostel.id)?.booking_code;
    if (Config.ADMIN_CONTACT_READY) {
      const msg = encodeURIComponent(`Hello RoomLink! I need help with booking ${code} at ${hostel.name}.`);
      const url = `https://wa.me/${Config.ADMIN_CONTACT_NUMBER.replace('+', '')}?text=${msg}`;
      Linking.openURL(url).catch(() => Alert.alert('Contact RoomLink', `Please reach us on ${Config.ADMIN_CONTACT_NUMBER}.`));
    } else {
      Alert.alert('Contact RoomLink Admin', `Send us a message about booking ${code || ''} and we'll assist. Our direct line will be added soon.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Admin Chat', onPress: () => router.push('/chat/admin') },
      ]);
    }
  };

  const activeCount = bookings.filter((b: any) => ['confirmed', 'pending'].includes(b.status)).length;
  const completedCount = bookings.filter((b: any) => b.status === 'completed').length;

  return (
    <View style={styles.container}>
      <ScreenHeader title="My bookings" />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListHeaderComponent={(
          <View style={styles.headerBlock}>
            <View style={styles.statsRow}>
              <StatTile value={bookings.length} label="Total" icon="albums" color={Colors.cyan} />
              <StatTile value={activeCount} label="Active" icon="flash" color={Colors.green} />
              <StatTile value={completedCount} label="Completed" icon="archive" color={Colors.purple} />
            </View>
            <Segmented
              options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'past', label: 'Past' }]}
              value={activeTab}
              onChange={setActiveTab}
            />
          </View>
        )}
        ListEmptyComponent={(
          <EmptyState icon="clipboard" color={Colors.cyan} title="No bookings" subtitle="Your booking history will appear here" />
        )}
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
          const active = ['confirmed', 'pending'].includes(item.status);
          return (
            <NeoCard shadow={4} radius={20} clip>
              <View style={styles.cardImgWrap}>
                {item.hostel.images[0] ? (
                  <Image source={{ uri: item.hostel.images[0] }} style={styles.cardImg} resizeMode="cover" />
                ) : null}
                <Tag label={cfg.label} icon={cfg.icon} color={cfg.color} size="md" shadow={2} style={styles.statusBadge} />
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>{item.hostel.name}</Text>
                <View style={styles.cardLocRow}>
                  <Icon name="location" size={13} color={Colors.ink} />
                  <Text style={styles.cardLoc} numberOfLines={1}>{item.hostel.address}</Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Icon name="calendar" size={14} color={Colors.ink} />
                    <Text style={styles.detailText}>Check-in: {item.check_in}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Icon name="time" size={14} color={Colors.ink} />
                    <Text style={styles.detailText}>{item.duration} month{item.duration > 1 ? 's' : ''}</Text>
                  </View>
                </View>

                <View style={styles.codeRow}>
                  <Icon name="barcode" size={15} color={Colors.ink} />
                  <Text style={styles.codeText}>{item.booking_code}</Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total paid</Text>
                  <Text style={styles.totalVal}>TZS {item.total.toLocaleString()}</Text>
                </View>
                <View style={styles.cardActions}>
                  {active && (
                    <NeoButton
                      title="Contact admin"
                      icon="shield-checkmark"
                      size="sm"
                      variant="success"
                      style={styles.flex}
                      onPress={() => contactAdmin(item.hostel)}
                    />
                  )}
                  <NeoButton
                    title="View hostel"
                    iconRight="chevron-forward"
                    size="sm"
                    variant="secondary"
                    style={styles.flex}
                    onPress={() => router.push(`/hostel/${item.hostel.id}`)}
                  />
                </View>
              </View>
            </NeoCard>
          );
        }}
      />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: 20, paddingBottom: 60 },
  sep: { height: 18 },
  headerBlock: { gap: 18, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12 },

  cardImgWrap: { height: 130, backgroundColor: Colors.yellowSoft, borderBottomWidth: BorderWidth.base, borderBottomColor: Colors.ink },
  cardImg: { width: '100%', height: '100%' },
  statusBadge: { position: 'absolute', top: 10, right: 10 },
  cardBody: { padding: 14 },
  cardName: { fontSize: 17, fontWeight: '700', color: Colors.ink, marginBottom: 4 },
  cardLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  cardLoc: { color: Colors.textSecondary, fontSize: 13, flex: 1 },
  detailRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 10 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: Colors.ink, fontSize: 13, fontWeight: '500' },
  codeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 14,
    backgroundColor: Colors.bg, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1.5, borderColor: Colors.ink,
  },
  codeText: { color: Colors.ink, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, marginBottom: 14, borderTopWidth: 1.5, borderTopColor: Colors.ink,
  },
  totalLabel: { fontSize: 13, color: Colors.ink, fontWeight: '700' },
  totalVal: { fontFamily: Fonts.display, fontSize: 18, color: Colors.blue },
  cardActions: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
}));
