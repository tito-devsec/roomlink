import { View, StyleSheet, FlatList, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../../components/neo/Icon';
import { BorderWidth, Colors, Fonts, themed } from '../../constants/Colors';
import { EmptyState, NeoCard, ScreenHeader, Tag, Text } from '../../components/neo';
import { MOCK_HOSTELS } from '../../services/mockData';

const MY_REVIEWS = [
  { id: '1', hostel: MOCK_HOSTELS[0], rating: 5, comment: 'Amazing place! Fast WiFi, great security, and a wonderful study room. Highly recommend to any student.', date: '2024-01-15' },
  { id: '2', hostel: MOCK_HOSTELS[2], rating: 4, comment: 'Good hostel overall. Clean rooms and close to campus. The water supply could be more reliable.', date: '2023-10-08' },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={styles.star}>
          {i <= rating && <Icon name="star" variant="solid" size={15} color={Colors.yellow} style={StyleSheet.absoluteFill} />}
          <Icon name="star" size={15} color={Colors.ink} style={StyleSheet.absoluteFill} />
        </View>
      ))}
    </View>
  );
}

export default function ReviewsScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My reviews"
        right={<Tag label={String(MY_REVIEWS.length)} color={Colors.yellow} size="md" style={styles.countTag} />}
      />

      <FlatList
        data={MY_REVIEWS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={(
          <EmptyState icon="star" title="No reviews yet" subtitle="Book a hostel and share your experience to help other students" />
        )}
        renderItem={({ item }) => (
          <NeoCard shadow={4} radius={20} style={styles.card} onPress={() => router.push(`/hostel/${item.hostel.id}`)}>
            <View style={styles.cardHeader}>
              <View style={styles.cardImgFrame}>
                <Image source={{ uri: item.hostel.images[0] }} style={styles.cardImg} resizeMode="cover" />
              </View>
              <View style={styles.cardMeta}>
                <Text style={styles.cardName} numberOfLines={2}>{item.hostel.name}</Text>
                <View style={styles.locRow}>
                  <Icon name="location" size={12} color={Colors.ink} />
                  <Text style={styles.locText} numberOfLines={1}>{item.hostel.address}</Text>
                </View>
              </View>
            </View>
            <View style={styles.ratingRow}>
              <StarRow rating={item.rating} />
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
            <Text style={styles.comment}>{item.comment}</Text>
            <Pressable style={styles.editBtn} hitSlop={8} accessibilityRole="button">
              <Icon name="pencil" size={14} color={Colors.ink} />
              <Text style={styles.editBtnText}>Edit review</Text>
            </Pressable>
          </NeoCard>
        )}
      />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  countTag: { alignSelf: 'center', minWidth: 42, justifyContent: 'center' },
  list: { padding: 20, paddingBottom: 60 },
  sep: { height: 18 },
  card: { padding: 16 },
  cardHeader: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  cardImgFrame: { borderRadius: 14, borderWidth: BorderWidth.base, borderColor: Colors.ink },
  cardImg: { width: 64, height: 64, borderRadius: 14 - BorderWidth.base },
  cardMeta: { flex: 1, justifyContent: 'center' },
  cardName: { fontFamily: Fonts.display, fontSize: 16, color: Colors.ink, marginBottom: 5 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { color: Colors.textSecondary, fontSize: 12.5, flex: 1 },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  stars: { flexDirection: 'row', gap: 3 },
  star: { width: 15, height: 15 },
  dateText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  comment: { fontSize: 14, color: Colors.ink, lineHeight: 21, marginBottom: 14 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  editBtnText: { color: Colors.ink, fontSize: 13.5, fontWeight: '700', textDecorationLine: 'underline' },
}));
