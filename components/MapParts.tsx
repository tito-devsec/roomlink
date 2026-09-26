// Pieces shared by the native map (react-native-maps) and the web map
// (Leaflet): the header card, the legend, and the sheet that opens when a
// hostel pin is tapped.

import { View, StyleSheet, ScrollView, Image, Linking, type StyleProp, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../constants/Colors';
import { Config } from '../constants/Config';
import { BottomSheet, Icon, IconButton, Logo, NeoButton, NeoCard, Tag, Text } from './neo';
import { HOSTEL_TYPE_LABEL } from './HostelCard';
import type { Hostel } from '../types';

const GENDER_LABEL: Record<Hostel['gender_preference'], string> = {
  male: 'Male only', female: 'Female only', mixed: 'Mixed',
};

export function MapHeader({ count, style }: { count: number; style?: StyleProp<ViewStyle> }) {
  return (
    <NeoCard shadow={4} style={[styles.mapHeader, style]}>
      <View style={styles.mapTitleRow}>
        <Logo size={34} shadow={0} />
        <Text style={styles.mapTitle}>Map</Text>
      </View>
      <View style={styles.mapPill}>
        <View style={styles.liveDot} />
        <Text style={styles.mapPillText}>{count} hostels</Text>
      </View>
    </NeoCard>
  );
}

export function MapLegend({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <NeoCard shadow={3} radius={12} style={[styles.legend, style]}>
      <View style={styles.legendItem}>
        <View style={styles.legendSwatch} />
        <Text style={styles.legendText}>Hostel</Text>
      </View>
      <View style={styles.legendItem}>
        <Icon name="school" size={12} color={Colors.ink} />
        <Text style={styles.legendText}>University</Text>
      </View>
    </NeoCard>
  );
}

// Enquiries go to the RoomLink admin, who contacts the landlord (see hostel/[id]).
function askAboutHostel(hostel: Hostel) {
  if (!Config.ADMIN_CONTACT_READY) { router.push('/chat/admin'); return; }
  const msg = encodeURIComponent(`Hello RoomLink! I'm interested in "${hostel.name}". Is a room available?`);
  Linking.openURL(`https://wa.me/${Config.ADMIN_CONTACT_NUMBER.replace('+', '')}?text=${msg}`)
    .catch(() => router.push('/chat/admin'));
}

export function HostelSheet({ hostel, visible, onClose, onViewFull }: {
  hostel: Hostel | null; visible: boolean; onClose: () => void; onViewFull: () => void;
}) {
  if (!hostel) return null;
  const available = hostel.available_rooms > 0;
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={[styles.detailImgFrame, hardShadow(4)]}>
        <View style={styles.detailImgClip}>
          <Image source={{ uri: hostel.images[0] }} style={styles.detailImg} resizeMode="cover" />
        </View>
        <View style={[styles.detailPrice, hardShadow(2)]}>
          <Text style={styles.detailPriceText}>TZS {(hostel.price_per_month / 1000).toFixed(0)}k</Text>
          <Text style={styles.detailPricePer}>/mo</Text>
        </View>
        <IconButton icon="close" size={36} shadow={2} round onPress={onClose} style={styles.detailClose} accessibilityLabel="Close" />
      </View>

      <View style={styles.detailTitleRow}>
        <View style={styles.flex}>
          <Text style={styles.detailName} numberOfLines={1}>{hostel.name}</Text>
          <View style={styles.detailLocationRow}>
            <Icon name="location" size={14} color={Colors.ink} />
            <Text style={styles.detailAddr} numberOfLines={1}>{hostel.address}</Text>
          </View>
        </View>
        {hostel.is_verified && <Tag label="Verified" icon="shield-checkmark" color={Colors.green} />}
      </View>

      <View style={styles.detailStats}>
        <View style={[styles.detailStat, { backgroundColor: Colors.yellowSoft }]}>
          <Icon name="star" size={15} color={Colors.ink} />
          <Text style={styles.detailStatVal}>{hostel.rating}</Text>
          <Text style={styles.detailStatLbl}>({hostel.review_count})</Text>
        </View>
        <View style={[styles.detailStat, { backgroundColor: Colors.blueSoft }]}>
          <Icon name="navigate" size={15} color={Colors.ink} />
          <Text style={styles.detailStatVal}>{hostel.distance}km</Text>
        </View>
        <View style={[styles.detailStat, { backgroundColor: available ? Colors.greenSoft : Colors.coralSoft }]}>
          <Icon name="bed" size={15} color={Colors.ink} />
          <Text style={styles.detailStatVal}>{hostel.available_rooms}/{hostel.total_rooms} free</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={styles.chipScroll}>
        <Tag label={HOSTEL_TYPE_LABEL[hostel.type]} icon="home" color={Colors.purpleSoft} size="md" />
        <Tag label={GENDER_LABEL[hostel.gender_preference]} icon="people" color={Colors.pinkSoft} size="md" />
        {hostel.amenities.slice(0, 4).map(a => (
          <Tag key={a} label={a} color={Colors.surface} size="md" />
        ))}
      </ScrollView>

      <View style={styles.detailActions}>
        <NeoButton title="Ask" icon="logo-whatsapp" variant="success" style={styles.flex} onPress={() => askAboutHostel(hostel)} />
        <NeoButton title="View details" iconRight="arrow-forward" style={styles.flexWide} onPress={onViewFull} />
      </View>
    </BottomSheet>
  );
}

const styles = themed(() => StyleSheet.create({
  flex: { flex: 1 },
  flexWide: { flex: 1.6 },

  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, paddingRight: 12 },
  mapTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapTitle: { fontFamily: Fonts.display, fontSize: 22, color: Colors.ink },
  mapPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.yellow, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green, borderWidth: 1.5, borderColor: Colors.ink },
  mapPillText: { color: Colors.ink, fontSize: 12, fontWeight: '700' },

  legend: { padding: 10, gap: 7 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendSwatch: { width: 14, height: 10, borderRadius: 3, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.ink },
  legendText: { color: Colors.ink, fontSize: 12, fontWeight: '600' },

  detailImgFrame: {
    height: 176, borderRadius: 18, backgroundColor: Colors.surface,
    borderWidth: BorderWidth.base, borderColor: Colors.ink, marginBottom: 16,
  },
  detailImgClip: { flex: 1, borderRadius: 18 - BorderWidth.base, overflow: 'hidden' },
  detailImg: { width: '100%', height: '100%' },
  detailClose: { position: 'absolute', top: 10, right: 12 },
  detailPrice: {
    position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'baseline', gap: 2,
    backgroundColor: Colors.yellow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  detailPriceText: { fontFamily: Fonts.display, fontSize: 15, color: Colors.ink },
  detailPricePer: { fontSize: 12, fontWeight: '700', color: Colors.ink },
  detailTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  detailName: { fontFamily: Fonts.display, fontSize: 21, color: Colors.ink, marginBottom: 4 },
  detailLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailAddr: { color: Colors.textSecondary, fontSize: 13, flex: 1 },
  detailStats: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  detailStat: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 10, borderRadius: 12, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  detailStatVal: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  detailStatLbl: { fontSize: 11, color: Colors.textSecondary },
  chipScroll: { marginBottom: 18, flexGrow: 0 },
  chipRow: { gap: 8 },
  detailActions: { flexDirection: 'row', gap: 12 },
}));
