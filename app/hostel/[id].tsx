import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, StyleSheet, Image, FlatList, Linking, Alert, Animated, Platform, Pressable, useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Icon } from '../../components/neo/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderWidth, Colors, Fonts, colorFor, hardShadow, themed } from '../../constants/Colors';
import { computeServiceFee, brokerEquivalent, Config } from '../../constants/Config';
import {
  Avatar, BottomSheet, DashedLine, IconButton, NeoButton, NeoCard, NeoPressable, ProgressBar,
  SectionHeader, Segmented, Tag, Text, type IconName,
} from '../../components/neo';
import { HOSTEL_TYPE_LABEL } from '../../components/HostelCard';
import { MOCK_HOSTELS, MOCK_REVIEWS, AMENITY_ICONS } from '../../services/mockData';
import { getHostel } from '../../services/data';
import type { Hostel } from '../../types';

const AMENITY_COLORS = themed((): Record<string, string> => ({
  WiFi: Colors.cyan, Security: Colors.green, CCTV: Colors.purple,
  Water: Colors.blueSoft, Parking: Colors.orange, AC: Colors.cyanSoft,
  Gym: Colors.coral, Pool: Colors.cyan, Kitchen: Colors.orange,
  Cafeteria: Colors.purple, Furnished: Colors.green, Laundry: Colors.pink,
  'Study Room': Colors.yellow,
}));

const tzs = (n: number) => `TZS ${n.toLocaleString()}`;

// Yellow fill under an ink outline reads as a star on any background.
// Solid yellow star (clipped for halves) under the bold ink outline.
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map(i => {
        const fill = i <= Math.floor(rating) ? 1 : i - 0.5 <= rating ? 0.5 : 0;
        return (
          <View key={i} style={{ width: size, height: size }}>
            {fill > 0 && (
              <View style={[StyleSheet.absoluteFill, { width: size * fill, overflow: 'hidden' }]}>
                <Icon name="star" variant="solid" size={size} color={Colors.yellow} />
              </View>
            )}
            <Icon name="star" size={size} color={Colors.ink} style={StyleSheet.absoluteFill} />
          </View>
        );
      })}
    </View>
  );
}

const DURATIONS = ['1', '3', '6', '12'] as const;

function BookingSheet({ hostel, visible, onClose }: { hostel: Hostel; visible: boolean; onClose: () => void }) {
  const [duration, setDuration] = useState<typeof DURATIONS[number]>('1');
  const serviceFee = computeServiceFee(hostel.price_per_month);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.bookingTitle} numberOfLines={2}>Book {hostel.name}</Text>

      <View style={styles.bookingPriceRow}>
        <Text style={styles.bookingPriceLabel}>Price per month</Text>
        <Text style={styles.bookingPrice}>{tzs(hostel.price_per_month)}</Text>
      </View>

      <Text style={styles.bookingSubLabel}>Duration (months)</Text>
      <Segmented
        options={DURATIONS.map(d => ({ value: d, label: `${d} mo` }))}
        value={duration}
        onChange={setDuration}
        height={48}
        style={styles.durationRow}
      />

      <NeoCard color={Colors.yellowSoft} shadow={3} radius={16} style={styles.bookingSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Monthly rent (to owner)</Text>
          <Text style={styles.summaryValue}>{tzs(hostel.price_per_month)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>RoomLink service fee (40%)</Text>
          <Text style={styles.summaryValue}>{tzs(serviceFee)}</Text>
        </View>
        <DashedLine style={styles.summaryDash} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalLabel}>Pay now (service fee only)</Text>
          <Text style={styles.summaryTotalValue}>{tzs(serviceFee)}</Text>
        </View>
      </NeoCard>

      <NeoButton
        title={`Pay ${tzs(serviceFee)} & book`}
        iconRight="lock-closed"
        size="lg"
        haptic="medium"
        onPress={() => {
          onClose();
          router.push({
            pathname: '/payment',
            params: {
              bookingId: `bk_${hostel.id}_${Date.now()}`,
              hostelId: String(hostel.id),
              hostelName: hostel.name,
              monthlyRent: String(hostel.price_per_month),
              duration,
            },
          });
        }}
      />

      <Pressable style={styles.cancelBookingBtn} onPress={onClose} hitSlop={8}>
        <Text style={styles.cancelBookingText}>Cancel</Text>
      </Pressable>
    </BottomSheet>
  );
}

export default function HostelDetailScreen() {
  const insets = useSafeAreaInsets();
  // iOS shows this route as a page sheet that already sits below the status bar.
  const topPad = Platform.OS === 'ios' ? 14 : insets.top + 10;
  const { width, height } = useWindowDimensions();
  const carouselH = height * 0.44;

  const { id } = useLocalSearchParams<{ id: string }>();
  const [hostel, setHostel] = useState(() => MOCK_HOSTELS.find(h => h.id === id) || MOCK_HOSTELS[0]);
  const reviews = MOCK_REVIEWS.filter(r => r.hostel_id === id);

  useEffect(() => {
    let alive = true;
    getHostel(String(id)).then(h => { if (alive && h) setHostel(h); }).catch(() => {});
    return () => { alive = false; };
  }, [id]);

  const [saved, setSaved] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [stickyOn, setStickyOn] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, carouselH - 120, carouselH - 60],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const toggleSave = useCallback(() => {
    setSaved(s => !s);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.3, useNativeDriver: true, tension: 120, friction: 6 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 6 }),
    ]).start();
  }, []);

  // RoomLink no longer connects tenants to landlords directly. All enquiries go
  // to the RoomLink system admin, who handles the landlord contact for the user.
  const contactAdmin = () => {
    if (Config.ADMIN_CONTACT_READY) {
      const msg = encodeURIComponent(`Hello RoomLink! I'm interested in "${hostel.name}". Is a room available?`);
      const wa = `https://wa.me/${Config.ADMIN_CONTACT_NUMBER.replace('+', '')}?text=${msg}`;
      Linking.openURL(wa).catch(() =>
        Linking.openURL(`tel:${Config.ADMIN_CONTACT_NUMBER}`).catch(() =>
          Alert.alert('Contact RoomLink', `Please reach us on ${Config.ADMIN_CONTACT_NUMBER}.`)));
    } else {
      // Number not set yet — route the enquiry into the in-app Admin chat instead.
      Alert.alert(
        'Contact RoomLink Admin',
        'Send your enquiry about this room to the RoomLink admin — we contact the landlord for you. Our direct line will be added soon.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Admin Chat', onPress: () => router.push('/chat/admin') },
        ],
      );
    }
  };

  const shareHostel = () => {
    Alert.alert('Share', 'Sharing functionality coming soon!');
  };

  const available = hostel.available_rooms > 0;
  const serviceFee = computeServiceFee(hostel.price_per_month);
  const savings = brokerEquivalent(hostel.price_per_month) - serviceFee;

  const stats: { icon: IconName; value: string; label: string; color: string }[] = [
    { icon: 'star', value: String(hostel.rating), label: 'Rating', color: Colors.yellow },
    { icon: 'bed', value: String(hostel.available_rooms), label: 'Rooms free', color: available ? Colors.green : Colors.coral },
    { icon: 'navigate', value: `${hostel.distance ?? '–'}km`, label: 'To campus', color: Colors.cyan },
    { icon: 'chatbubbles', value: String(hostel.review_count), label: 'Reviews', color: Colors.pink },
  ];

  const saveButton = (
    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
      <IconButton
        icon="heart"
        iconVariant={saved ? 'solid' : 'bold'}
        color={saved ? Colors.pink : Colors.surface}
        size={42}
        onPress={toggleSave}
        haptic="light"
        accessibilityLabel={saved ? 'Remove from saved' : 'Save hostel'}
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Sticky header (fades in once the photos scroll away) */}
      <Animated.View
        pointerEvents={stickyOn ? 'auto' : 'none'}
        style={[styles.stickyHeader, { paddingTop: topPad, opacity: headerOpacity }]}
      >
        <IconButton icon="arrow-back" size={42} onPress={() => router.back()} accessibilityLabel="Go back" />
        <Text style={styles.stickyTitle} numberOfLines={1}>{hostel.name}</Text>
        <IconButton icon="share" size={42} onPress={shareHostel} accessibilityLabel="Share" />
        {saveButton}
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
          listener: (e: any) => {
            const on = e.nativeEvent.contentOffset.y > carouselH - 90;
            setStickyOn(prev => (prev === on ? prev : on));
          },
        })}
        scrollEventThrottle={16}
      >
        {/* Image carousel */}
        <View style={[styles.carousel, { height: carouselH }]}>
          <FlatList
            data={hostel.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            onMomentumScrollEnd={e => setActiveImageIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width, height: carouselH - BorderWidth.thick }} resizeMode="cover" />
            )}
          />

          <View style={[styles.carouselTop, { top: topPad }]}>
            <IconButton icon="arrow-back" size={42} onPress={() => router.back()} accessibilityLabel="Go back" />
            <View style={styles.carouselActions}>
              <IconButton icon="share" size={42} onPress={shareHostel} accessibilityLabel="Share" />
              {saveButton}
            </View>
          </View>

          <View style={styles.imageDots}>
            {hostel.images.map((_, i) => (
              <View key={i} style={[styles.dot, activeImageIdx === i && styles.dotActive]} />
            ))}
          </View>

          <View style={[styles.imageCount, hardShadow(2)]}>
            <Icon name="images" size={12} color={Colors.ink} />
            <Text style={styles.imageCountText}>{activeImageIdx + 1}/{hostel.images.length}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Title + price */}
          <View style={styles.titleRow}>
            <View style={styles.flex}>
              <Text style={styles.hostelName}>{hostel.name}</Text>
              <View style={styles.locationRow}>
                <Icon name="location" size={15} color={Colors.ink} />
                <Text style={styles.locationText}>{hostel.address}, {hostel.city}</Text>
              </View>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.priceBig}>{(hostel.price_per_month / 1000).toFixed(0)}k</Text>
              <Text style={styles.priceSub}>TZS / month</Text>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagRow}>
            {hostel.is_verified && <Tag label="Verified" icon="shield-checkmark" color={Colors.green} size="md" />}
            <Tag label={HOSTEL_TYPE_LABEL[hostel.type]} icon="home" color={Colors.blueSoft} size="md" />
            <Tag
              label={hostel.gender_preference.charAt(0).toUpperCase() + hostel.gender_preference.slice(1)}
              icon="people"
              color={Colors.pinkSoft}
              size="md"
            />
            <Tag label="Negotiable" icon="trending-down" color={Colors.yellow} size="md" />
          </View>

          {/* Stat tiles */}
          <View style={styles.statsRow}>
            {stats.map(s => (
              <View key={s.label} style={[styles.statTile, hardShadow(3)]}>
                <View style={[styles.statIcon, { backgroundColor: s.color }]}>
                  <Icon name={s.icon} size={15} color={Colors.ink} />
                </View>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{s.value}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Availability */}
          <NeoCard shadow={3} radius={16} style={styles.availCard}>
            <View style={styles.availTop}>
              <View style={[styles.availDot, { backgroundColor: available ? Colors.green : Colors.coral }]} />
              <Text style={styles.availText}>{available ? `${hostel.available_rooms} rooms available` : 'Fully booked'}</Text>
              <Text style={styles.availTotal}>of {hostel.total_rooms} total</Text>
            </View>
            <ProgressBar
              progress={hostel.total_rooms ? hostel.available_rooms / hostel.total_rooms : 0}
              color={available ? Colors.green : Colors.coral}
              height={12}
            />
          </NeoCard>

          {/* Rating breakdown */}
          <NeoCard shadow={3} radius={16} style={styles.ratingCard}>
            <View style={styles.ratingMain}>
              <Text style={styles.ratingScore}>{hostel.rating}</Text>
              <StarRating rating={hostel.rating} size={15} />
              <Text style={styles.reviewCount}>{hostel.review_count} reviews</Text>
            </View>
            <View style={styles.ratingBars}>
              {[5, 4, 3, 2, 1].map(star => {
                const pct = star === 5 ? 0.65 : star === 4 ? 0.25 : star === 3 ? 0.07 : star === 2 ? 0.02 : 0.01;
                return (
                  <View key={star} style={styles.ratingBarRow}>
                    <Text style={styles.ratingBarStar}>{star}</Text>
                    <View style={styles.ratingBar}>
                      <View style={[styles.ratingBarFill, { width: `${pct * 100}%` }]} />
                    </View>
                    <Text style={styles.ratingBarPct}>{Math.round(pct * 100)}%</Text>
                  </View>
                );
              })}
            </View>
          </NeoCard>

          {/* Fee breakdown — shown up front, before booking */}
          <NeoCard color={Colors.yellowSoft} shadow={4} radius={18} style={styles.feeCard}>
            <View style={styles.feeCardHead}>
              <View style={styles.feeIcon}><Icon name="receipt" size={16} color={Colors.ink} /></View>
              <Text style={styles.feeCardTitle}>What you pay</Text>
            </View>
            <View style={styles.feeLine}>
              <Text style={styles.feeLineLabel}>Monthly rent (to owner, after move-in)</Text>
              <Text style={styles.feeLineValue}>{tzs(hostel.price_per_month)}</Text>
            </View>
            <View style={styles.feeLine}>
              <Text style={styles.feeLineLabel}>RoomLink service fee (40%, once)</Text>
              <Text style={styles.feeLineValue}>{tzs(serviceFee)}</Text>
            </View>
            <DashedLine style={styles.feeDash} />
            <View style={styles.feeLine}>
              <Text style={styles.feePayNowLabel}>Pay through RoomLink today</Text>
              <Text style={styles.feePayNowValue}>{tzs(serviceFee)}</Text>
            </View>
            {savings > 0 && (
              <Tag
                label={`Save ~${tzs(savings)} vs a typical broker`}
                icon="pricetag"
                color={Colors.green}
                size="md"
                style={styles.feeSave}
              />
            )}
          </NeoCard>

          {/* Description */}
          <View style={styles.section}>
            <SectionHeader title="About this place" style={styles.sectionHead} />
            <Text style={styles.description} numberOfLines={showFullDesc ? undefined : 3}>
              {hostel.description}
            </Text>
            <Pressable onPress={() => setShowFullDesc(s => !s)} hitSlop={8} style={styles.readMoreWrap}>
              <Text style={styles.readMore}>{showFullDesc ? 'Show less' : 'Read more'}</Text>
              <Icon name={showFullDesc ? 'chevron-up' : 'chevron-down'} size={15} color={Colors.ink} />
            </Pressable>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <SectionHeader title="Amenities" style={styles.sectionHead} />
            <View style={styles.amenitiesGrid}>
              {hostel.amenities.map(a => (
                <View key={a} style={[styles.amenityItem, hardShadow(2)]}>
                  <View style={[styles.amenityIconBg, { backgroundColor: AMENITY_COLORS[a] || Colors.yellow }]}>
                    <Icon name={AMENITY_ICONS[a] || 'checkmark'} size={16} color={Colors.ink} />
                  </View>
                  <Text style={styles.amenityLabel}>{a}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Location preview */}
          <View style={styles.section}>
            <SectionHeader title="Location" style={styles.sectionHead} />
            <NeoPressable onPress={() => router.push('/(tabs)/map')} shadow={4} accessibilityLabel="Open map" style={styles.mapPreview}>
              <View style={styles.mapCanvas}>
                <View style={[styles.road, styles.roadH, { top: '38%' }]} />
                <View style={[styles.road, styles.roadV, { left: '28%' }]} />
                <View style={[styles.road, styles.roadV, { left: '72%', backgroundColor: Colors.yellow }]} />
                <View style={[styles.block, { top: 12, left: 16, width: 54, height: 30, backgroundColor: Colors.greenSoft }]} />
                <View style={[styles.block, { bottom: 14, right: 18, width: 64, height: 26, backgroundColor: Colors.blueSoft }]} />
                <View style={styles.mapPinWrap}>
                  <View style={[styles.mapPin, hardShadow(3)]}>
                    <Icon name="home" size={18} color={Colors.ink} />
                  </View>
                  <View style={styles.mapPinTail} />
                </View>
              </View>
              <View style={styles.mapFooter}>
                <Icon name="location" size={15} color={Colors.ink} />
                <Text style={styles.mapFooterText} numberOfLines={1}>{hostel.address}</Text>
                <Text style={styles.mapFooterLink}>Open map</Text>
                <Icon name="arrow-forward" size={15} color={Colors.ink} />
              </View>
            </NeoPressable>
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <SectionHeader title="Reviews" action="See all" style={styles.sectionHead} />
            {reviews.length > 0 ? reviews.map(review => (
              <NeoCard key={review.id} shadow={3} radius={16} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Avatar name={review.user?.full_name} size={38} color={colorFor(review.user?.full_name || '?')} />
                  <View style={styles.flex}>
                    <Text style={styles.reviewName}>{review.user?.full_name}</Text>
                    <StarRating rating={review.rating} size={12} />
                  </View>
                  <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </NeoCard>
            )) : (
              <NeoCard shadow={3} radius={16} color={Colors.bg} style={styles.noReviews}>
                <Text style={styles.noReviewsText}>No reviews yet. Be the first!</Text>
              </NeoCard>
            )}
          </View>

          {/* Contact via RoomLink — landlord is never contacted directly */}
          <View style={styles.section}>
            <SectionHeader title="Book through RoomLink" style={styles.sectionHead} />
            <NeoCard color={Colors.greenSoft} shadow={4} radius={18} style={styles.ownerCard}>
              <View>
                <View style={styles.ownerAvatar}>
                  <Icon name="shield-checkmark" size={22} color={Colors.ink} />
                </View>
                <View style={styles.ownerOnline} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.ownerName}>{Config.ADMIN_CONTACT_NAME}</Text>
                <Text style={styles.ownerResponse}>We contact the landlord for you — safely</Text>
                <View style={styles.ownerRating}>
                  <Icon name="lock-closed" size={11} color={Colors.ink} />
                  <Text style={styles.ownerRatingText}>Verified, secure enquiries</Text>
                </View>
              </View>
              <IconButton
                icon="chatbubble-ellipses"
                color={Colors.ink}
                iconColor={Colors.white}
                onPress={() => router.push('/chat/admin')}
                accessibilityLabel="Chat with RoomLink admin"
              />
            </NeoCard>
          </View>
        </View>

        <View style={{ height: 120 + insets.bottom }} />
      </Animated.ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        <NeoButton title="Enquire" icon="shield-checkmark" variant="secondary" onPress={contactAdmin} style={styles.flex} />
        <NeoButton
          title={available ? 'Book now' : 'Fully booked'}
          iconRight={available ? 'arrow-forward' : undefined}
          onPress={() => setShowBooking(true)}
          disabled={!available}
          haptic="medium"
          style={styles.bookBtn}
        />
      </View>

      <BookingSheet hostel={hostel} visible={showBooking} onClose={() => setShowBooking(false)} />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },

  stickyHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: Colors.bg, borderBottomWidth: BorderWidth.base, borderBottomColor: Colors.ink,
  },
  stickyTitle: { flex: 1, fontFamily: Fonts.display, fontSize: 17, color: Colors.ink },

  carousel: { borderBottomWidth: BorderWidth.thick, borderBottomColor: Colors.ink, backgroundColor: Colors.yellowSoft },
  carouselTop: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  carouselActions: { flexDirection: 'row', gap: 12 },
  imageDots: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: {
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.ink,
  },
  dotActive: { width: 26, backgroundColor: Colors.yellow },
  imageCount: {
    position: 'absolute', bottom: 12, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  imageCountText: { color: Colors.ink, fontSize: 12, fontWeight: '700' },

  content: { paddingHorizontal: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingTop: 22, marginBottom: 12 },
  hostelName: { fontFamily: Fonts.display, fontSize: 28, lineHeight: 33, color: Colors.ink, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  priceCol: { alignItems: 'flex-end' },
  priceBig: { fontFamily: Fonts.display, fontSize: 28, lineHeight: 33, color: Colors.blue },
  priceSub: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statTile: {
    flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4,
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  statIcon: {
    width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.thin, borderColor: Colors.ink, marginBottom: 6,
  },
  statValue: { fontFamily: Fonts.display, fontSize: 16, color: Colors.ink },
  statLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginTop: 1 },

  availCard: { padding: 14, gap: 10, marginBottom: 18 },
  availTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availDot: { width: 12, height: 12, borderRadius: 3, borderWidth: 1.5, borderColor: Colors.ink },
  availText: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.ink },
  availTotal: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },

  ratingCard: { flexDirection: 'row', padding: 16, gap: 18, marginBottom: 18 },
  ratingMain: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  ratingScore: { fontFamily: Fonts.display, fontSize: 42, lineHeight: 46, color: Colors.ink },
  stars: { flexDirection: 'row', gap: 2 },
  reviewCount: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  ratingBars: { flex: 1, gap: 6, justifyContent: 'center' },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingBarStar: { fontSize: 12, fontWeight: '700', color: Colors.ink, width: 10 },
  ratingBar: {
    flex: 1, height: 10, backgroundColor: Colors.surface, borderRadius: 5, overflow: 'hidden',
    borderWidth: 1.5, borderColor: Colors.ink,
  },
  ratingBarFill: { height: '100%', backgroundColor: Colors.yellow },
  ratingBarPct: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', width: 30, textAlign: 'right' },

  feeCard: { padding: 18, marginBottom: 8 },
  feeCardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  feeIcon: {
    width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.yellow, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  feeCardTitle: { fontFamily: Fonts.display, fontSize: 17, color: Colors.ink },
  feeLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  feeLineLabel: { flex: 1, color: Colors.textSecondary, fontSize: 13.5, paddingRight: 10 },
  feeLineValue: { color: Colors.ink, fontSize: 14, fontWeight: '700' },
  feeDash: { marginVertical: 10 },
  feePayNowLabel: { flex: 1, color: Colors.ink, fontSize: 15, fontWeight: '700', paddingRight: 10 },
  feePayNowValue: { fontFamily: Fonts.display, color: Colors.blue, fontSize: 18 },
  feeSave: { marginTop: 12 },

  section: { marginTop: 28 },
  sectionHead: { marginBottom: 14 },
  description: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },
  readMoreWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, alignSelf: 'flex-start' },
  readMore: { color: Colors.ink, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },

  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: 12, paddingLeft: 6, paddingRight: 12, paddingVertical: 6,
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  amenityIconBg: {
    width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.ink,
  },
  amenityLabel: { fontSize: 13, color: Colors.ink, fontWeight: '700' },

  mapPreview: {
    backgroundColor: Colors.surface, borderRadius: 18, overflow: 'hidden',
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  mapCanvas: { height: 140, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  road: { position: 'absolute', backgroundColor: Colors.surface, borderColor: Colors.ink },
  roadH: { left: 0, right: 0, height: 14, borderTopWidth: 1.5, borderBottomWidth: 1.5 },
  roadV: { top: 0, bottom: 0, width: 14, borderLeftWidth: 1.5, borderRightWidth: 1.5 },
  block: { position: 'absolute', borderRadius: 6, borderWidth: 1.5, borderColor: Colors.ink },
  mapPinWrap: { alignItems: 'center' },
  mapPin: {
    width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.yellow, borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  mapPinTail: {
    width: 0, height: 0, marginTop: 1,
    borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 9,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: Colors.ink,
  },
  mapFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12,
    borderTopWidth: BorderWidth.base, borderTopColor: Colors.ink,
  },
  mapFooterText: { flex: 1, color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  mapFooterLink: { color: Colors.ink, fontSize: 13, fontWeight: '700' },

  reviewCard: { padding: 14, marginBottom: 14 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  reviewName: { fontSize: 14, fontWeight: '700', color: Colors.ink, marginBottom: 3 },
  reviewDate: { fontSize: 11.5, color: Colors.textSecondary, fontWeight: '600' },
  reviewComment: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  noReviews: { padding: 20, alignItems: 'center' },
  noReviewsText: { color: Colors.ink, fontSize: 14, fontWeight: '600' },

  ownerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  ownerAvatar: {
    width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.green, borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  ownerOnline: {
    position: 'absolute', bottom: -3, right: -3, width: 15, height: 15, borderRadius: 8,
    backgroundColor: Colors.yellow, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  ownerName: { fontSize: 15.5, fontWeight: '700', color: Colors.ink },
  ownerResponse: { fontSize: 12.5, color: Colors.textSecondary, marginTop: 1, marginBottom: 4 },
  ownerRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ownerRatingText: { fontSize: 12, color: Colors.ink, fontWeight: '600' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 14,
    backgroundColor: Colors.bg, borderTopWidth: BorderWidth.thick, borderTopColor: Colors.ink,
  },
  bookBtn: { flex: 1.5 },

  bookingTitle: { fontFamily: Fonts.display, fontSize: 22, color: Colors.ink, marginBottom: 16 },
  bookingPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  bookingPriceLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  bookingPrice: { fontFamily: Fonts.display, fontSize: 18, color: Colors.blue },
  bookingSubLabel: { fontSize: 13, fontWeight: '700', color: Colors.ink, marginBottom: 10 },
  durationRow: { marginBottom: 22 },
  bookingSummary: { padding: 16, marginBottom: 22 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, gap: 10 },
  summaryLabel: { fontSize: 13.5, color: Colors.textSecondary, flex: 1 },
  summaryValue: { fontSize: 14, color: Colors.ink, fontWeight: '700' },
  summaryDash: { marginVertical: 9 },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700', color: Colors.ink, flex: 1 },
  summaryTotalValue: { fontFamily: Fonts.display, fontSize: 18, color: Colors.blue },
  cancelBookingBtn: { alignItems: 'center', paddingTop: 16, paddingBottom: 4 },
  cancelBookingText: { color: Colors.ink, fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },
}));
