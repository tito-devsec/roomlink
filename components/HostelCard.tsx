import { useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { Icon } from './neo/Icon';
import { BorderRadius, BorderWidth, Colors, Fonts, hardShadow, themed } from '../constants/Colors';
import type { Hostel } from '../types';
import { NeoPressable, Tag, Text, haptic } from './neo';

export const HOSTEL_TYPE_LABEL: Record<Hostel['type'], string> = {
  hostel: 'Hostel',
  private_room: 'Private room',
  shared_room: 'Shared room',
  apartment: 'Apartment',
};

export function HeartButton({ saved, onToggle, size = 38 }: { saved: boolean; onToggle: () => void; size?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    haptic('light');
    onToggle();
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, speed: 60, bounciness: 12 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 10 }),
    ]).start();
  };
  return (
    <NeoPressable
      onPress={press}
      shadow={2}
      hitSlop={6}
      accessibilityLabel={saved ? 'Remove from saved' : 'Save hostel'}
      style={[styles.heart, {
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: saved ? Colors.pink : Colors.surface,
      }]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Icon name="heart" variant={saved ? 'solid' : 'bold'} size={Math.round(size * 0.46)} color={Colors.ink} />
      </Animated.View>
    </NeoPressable>
  );
}

interface Props {
  hostel: Hostel;
  onPress: () => void;
  variant?: 'full' | 'featured';
  width?: number;
  /** Controlled save state; omit to let the card keep its own. */
  saved?: boolean;
  onToggleSave?: () => void;
}

export default function HostelCard({ hostel, onPress, variant = 'full', width, saved, onToggleSave }: Props) {
  const [localSaved, setLocalSaved] = useState(false);
  const isSaved = saved ?? localSaved;
  const featured = variant === 'featured';
  const available = hostel.available_rooms > 0;

  return (
    <NeoPressable
      onPress={onPress}
      shadow={4}
      accessibilityLabel={hostel.name}
      style={[styles.card, featured ? { width } : styles.cardFull]}
    >
      <View style={[styles.imageWrap, { height: featured ? 150 : 178 }]}>
        <Image source={{ uri: hostel.images[0] }} style={styles.image} resizeMode="cover" />
        {hostel.is_verified && (
          <Tag label="Verified" icon="shield-checkmark" color={Colors.green} style={styles.verified} />
        )}
        <View style={styles.heartPos}>
          <HeartButton saved={isSaved} onToggle={onToggleSave ?? (() => setLocalSaved(s => !s))} />
        </View>
        <View style={[styles.price, hardShadow(2)]}>
          <Text style={styles.priceText}>TZS {(hostel.price_per_month / 1000).toFixed(0)}k</Text>
          <Text style={styles.pricePer}>/mo</Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{hostel.name}</Text>
          <View style={styles.rating}>
            <Icon name="star" variant="solid" size={11} color={Colors.yellow} />
            <Text style={styles.ratingText}>{hostel.rating}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Icon name="location" size={13} color={Colors.ink} />
          <Text style={styles.location} numberOfLines={1}>{hostel.address}</Text>
          {hostel.distance != null && <Text style={styles.distance}>{hostel.distance} km</Text>}
        </View>

        {!featured && (
          <View style={styles.amenityRow}>
            {hostel.amenities.slice(0, 3).map(a => (
              <View key={a} style={styles.amenity}><Text style={styles.amenityText}>{a}</Text></View>
            ))}
            {hostel.amenities.length > 3 && (
              <View style={[styles.amenity, styles.amenityMore]}>
                <Text style={styles.amenityText}>+{hostel.amenities.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <View style={[styles.availDot, { backgroundColor: available ? Colors.green : Colors.coral }]} />
          <Text style={styles.availText} numberOfLines={1}>
            {available ? `${hostel.available_rooms} rooms available` : 'Fully booked'}
          </Text>
          {!featured && <Text style={styles.type}>{HOSTEL_TYPE_LABEL[hostel.type]}</Text>}
        </View>
      </View>
    </NeoPressable>
  );
}

const styles = themed(() => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, overflow: 'hidden',
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  cardFull: { marginBottom: 18 },
  imageWrap: { borderBottomWidth: BorderWidth.base, borderBottomColor: Colors.ink, backgroundColor: Colors.yellowSoft },
  image: { width: '100%', height: '100%' },
  verified: { position: 'absolute', top: 10, left: 10 },
  heartPos: { position: 'absolute', top: 10, right: 12 },
  heart: { alignItems: 'center', justifyContent: 'center', borderWidth: BorderWidth.base, borderColor: Colors.ink },
  price: {
    position: 'absolute', bottom: 10, left: 10,
    flexDirection: 'row', alignItems: 'baseline', gap: 2,
    backgroundColor: Colors.yellow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  priceText: { fontFamily: Fonts.display, fontSize: 15, color: Colors.ink },
  pricePer: { fontSize: 12, fontWeight: '700', color: Colors.ink },

  info: { padding: 14, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.ink },
  rating: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.ink, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full,
  },
  ratingText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { flex: 1, color: Colors.textSecondary, fontSize: 13 },
  distance: { color: Colors.blue, fontSize: 13, fontWeight: '700' },
  amenityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  amenity: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7,
    backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.ink,
  },
  amenityMore: { backgroundColor: Colors.blueSoft },
  amenityText: { color: Colors.ink, fontSize: 11.5, fontWeight: '600' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  availDot: { width: 10, height: 10, borderRadius: 3, borderWidth: 1.5, borderColor: Colors.ink },
  availText: { flex: 1, color: Colors.ink, fontSize: 12.5, fontWeight: '600' },
  type: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
}));
