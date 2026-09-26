import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Icon } from '../../components/neo/Icon';
import { BorderWidth, Colors, themed } from '../../constants/Colors';
import { Avatar, NeoButton, NeoCard, PageTitle, Tag, Text } from '../../components/neo';
import { BOOKING_REQUESTS, type BookingRequest } from '../../services/landlordData';

const tzs = (n: number) => `TZS ${n.toLocaleString()}`;

export default function LandlordBookings() {
  const [items, setItems] = useState<BookingRequest[]>(BOOKING_REQUESTS);

  const decide = (id: string, decision: 'accepted' | 'rejected') => {
    setItems(prev => prev.map(b => (b.id === id ? { ...b, status: decision } : b)));
    Alert.alert(
      decision === 'accepted' ? 'Booking accepted' : 'Booking rejected',
      decision === 'accepted'
        ? 'RoomLink will connect you with the student to arrange a visit.'
        : 'The student will be notified. No charge is made to you.',
    );
  };

  return (
    <View style={styles.container}>
      <PageTitle overline="Requests" title="Bookings" />
      <View style={styles.privacyNote}>
        <Icon name="lock-closed" size={15} color={Colors.ink} />
        <Text style={styles.privacyText}>Student contacts stay private until RoomLink connects you.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {items.map(b => (
          <NeoCard key={b.id} shadow={4} radius={20} style={styles.card}>
            <View style={styles.row}>
              <Avatar name={b.studentName} size={50} />
              <View style={styles.flex}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{b.studentName}</Text>
                  {b.studentVerified
                    ? <Tag label="Verified" icon="checkmark-circle" color={Colors.green} />
                    : <Tag label="Unverified" color={Colors.orange} />}
                </View>
                <Text style={styles.room}>{b.roomName}</Text>
                <Text style={styles.date}>{b.date}</Text>
              </View>
            </View>

            <View style={styles.feeRow}>
              <Icon name="shield-checkmark" size={16} color={Colors.ink} />
              <Text style={styles.feeText}>Service fee paid to RoomLink: <Text style={styles.feeStrong}>{tzs(b.serviceFeePaid)}</Text></Text>
            </View>

            <View style={styles.hidden}>
              <View style={styles.hiddenItem}>
                <Icon name="phone-slash" size={14} color={Colors.ink} />
                <Text style={styles.hiddenText}>Phone hidden</Text>
              </View>
              <View style={styles.hiddenItem}>
                <Icon name="envelope-ban" size={14} color={Colors.ink} />
                <Text style={styles.hiddenText}>Email hidden</Text>
              </View>
            </View>

            {b.status === 'pending' ? (
              <View style={styles.actions}>
                <NeoButton title="Reject" variant="secondary" style={styles.flex} onPress={() => decide(b.id, 'rejected')} />
                <NeoButton title="Accept" variant="purple" icon="checkmark" style={styles.flex} onPress={() => decide(b.id, 'accepted')} />
              </View>
            ) : (
              <View style={[styles.statusBanner, { backgroundColor: b.status === 'accepted' ? Colors.green : Colors.coral }]}>
                <Icon name={b.status === 'accepted' ? 'checkmark-circle' : 'close-circle'} size={17} color={Colors.ink} />
                <Text style={styles.statusBannerText}>
                  {b.status === 'accepted' ? 'Accepted — RoomLink will connect you' : 'Rejected'}
                </Text>
              </View>
            )}
          </NeoCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  privacyNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 6,
    backgroundColor: Colors.purpleSoft, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  privacyText: { flex: 1, color: Colors.ink, fontSize: 13, fontWeight: '500' },
  list: { padding: 20, paddingBottom: 130 },
  card: { padding: 16, marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  name: { color: Colors.ink, fontSize: 16, fontWeight: '700' },
  room: { color: Colors.ink, fontSize: 13.5, fontWeight: '500', marginTop: 4 },
  date: { color: Colors.textSecondary, fontSize: 12.5, marginTop: 2 },
  feeRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 },
  feeText: { flex: 1, color: Colors.ink, fontSize: 13 },
  feeStrong: { fontWeight: '700' },
  hidden: {
    flexDirection: 'row', gap: 18, marginTop: 10, backgroundColor: Colors.bg, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1.5, borderColor: Colors.ink, borderStyle: 'dashed',
  },
  hiddenItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hiddenText: { color: Colors.ink, fontSize: 12.5, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 16, borderRadius: 12, paddingVertical: 11, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  statusBannerText: { fontSize: 13.5, fontWeight: '700', color: Colors.ink },
}));
