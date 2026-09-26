import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../../components/neo/Icon';
import { useUser } from '@clerk/clerk-expo';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import {
  Avatar, NeoButton, NeoCard, PageTitle, SectionHeader, StatTile, Tag, Text,
} from '../../components/neo';
import RoomStatusTag from '../../components/RoomStatusTag';
import { LANDLORD_ROOMS, BOOKING_REQUESTS, LANDLORD_STATS } from '../../services/landlordData';
import { useDemoSession } from '../../services/demoAuth';

const tzs = (n: number) => `TZS ${n.toLocaleString()}`;

export default function LandlordDashboard() {
  const { user } = useUser();
  const demo = useDemoSession();
  const pending = BOOKING_REQUESTS.filter(b => b.status === 'pending');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <PageTitle overline="Welcome back" title={user?.firstName || demo?.firstName || 'Landlord'} />
      <Tag label="Verification pending" icon="time" color={Colors.orange} size="md" style={styles.verifyTag} />

      {/* Revenue card */}
      <NeoCard color={Colors.blue} shadow={6} radius={24} style={styles.revenueCard}>
        <View style={[styles.revenueSticker, hardShadow(2)]}>
          <Text style={styles.revenueStickerText}>MONTHLY</Text>
        </View>
        <Text style={styles.revenueLabel}>Expected monthly revenue</Text>
        <Text style={styles.revenueValue}>{tzs(LANDLORD_STATS.expectedRevenue)}</Text>
        <Text style={styles.revenueSub}>from accepted bookings • rent collected directly</Text>
      </NeoCard>

      <View style={styles.statsRow}>
        <StatTile icon="bed" label="Active rooms" value={LANDLORD_STATS.activeRooms} color={Colors.green} />
        <StatTile icon="hourglass" label="Pending" value={LANDLORD_STATS.pendingRooms} color={Colors.orange} />
        <StatTile icon="document-text" label="Bookings" value={LANDLORD_STATS.totalBookings} color={Colors.cyan} />
      </View>

      <NeoButton
        title="Add a new room"
        icon="add-circle"
        variant="purple"
        size="lg"
        onPress={() => router.push('/landlord/add-room')}
        style={styles.addBtn}
      />

      <SectionHeader title="Booking requests" action="See all" onAction={() => router.push('/(landlord)/bookings')} style={styles.sectionHead} />

      {pending.length === 0 && <Text style={styles.empty}>No pending requests right now.</Text>}
      {pending.map(b => (
        <NeoCard key={b.id} shadow={3} radius={18} style={styles.reqCard} onPress={() => router.push('/(landlord)/bookings')}>
          <Avatar name={b.studentName} size={48} />
          <View style={styles.flex}>
            <View style={styles.reqNameRow}>
              <Text style={styles.reqName}>{b.studentName}</Text>
              {b.studentVerified && <Icon name="checkmark-circle" size={16} color={Colors.successInk} />}
            </View>
            <Text style={styles.reqRoom} numberOfLines={1}>{b.roomName} • {b.date}</Text>
            <Tag label={`Fee paid: ${tzs(b.serviceFeePaid)}`} icon="shield-checkmark" color={Colors.greenSoft} style={styles.reqPaid} />
          </View>
          <Icon name="chevron-forward" size={18} color={Colors.ink} />
        </NeoCard>
      ))}

      <SectionHeader title="Your rooms" action="Manage" onAction={() => router.push('/(landlord)/rooms')} style={styles.sectionHead} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roomsRow}>
        {LANDLORD_ROOMS.slice(0, 3).map(r => (
          <NeoCard key={r.id} shadow={4} radius={18} style={styles.roomCard} onPress={() => router.push('/(landlord)/rooms')}>
            <View style={styles.roomImgFrame}>
              <Image source={{ uri: r.image }} style={styles.roomImg} />
            </View>
            <Text style={styles.roomName} numberOfLines={1}>{r.name}</Text>
            <Text style={styles.roomPrice}>{tzs(r.price_per_month)}/mo</Text>
            <RoomStatusTag status={r.status} />
          </NeoCard>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 130 },
  flex: { flex: 1 },
  verifyTag: { marginLeft: 20, marginBottom: 18 },

  revenueCard: { marginHorizontal: 20, padding: 22 },
  revenueSticker: {
    position: 'absolute', top: -12, right: 18, paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: Colors.yellow, borderRadius: 8, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
    transform: [{ rotate: '5deg' }],
  },
  revenueStickerText: { fontFamily: Fonts.display, fontSize: 11, letterSpacing: 1.2, color: Colors.ink },
  revenueLabel: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  revenueValue: { fontFamily: Fonts.display, color: Colors.white, fontSize: 32, marginTop: 6 },
  revenueSub: { color: Colors.blueSoft, fontSize: 12.5, marginTop: 6, fontWeight: '500' },

  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 20 },
  addBtn: { marginHorizontal: 20, marginTop: 20 },

  sectionHead: { paddingHorizontal: 20, marginTop: 30, marginBottom: 14 },
  empty: { color: Colors.textSecondary, paddingHorizontal: 20, fontSize: 14 },
  reqCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, padding: 12, marginBottom: 14 },
  reqNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reqName: { color: Colors.ink, fontSize: 15.5, fontWeight: '700' },
  reqRoom: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  reqPaid: { marginTop: 7 },

  roomsRow: { gap: 14, paddingHorizontal: 20, paddingBottom: 8 },
  roomCard: { width: 168, padding: 10 },
  roomImgFrame: { borderRadius: 12, borderWidth: BorderWidth.thin, borderColor: Colors.ink, marginBottom: 10 },
  roomImg: { width: '100%', height: 92, borderRadius: 10 },
  roomName: { color: Colors.ink, fontSize: 14, fontWeight: '700' },
  roomPrice: { fontFamily: Fonts.display, color: Colors.blue, fontSize: 13, marginTop: 2, marginBottom: 10 },
}));
