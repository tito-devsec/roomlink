import { useState } from 'react';
import {
  View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../../components/neo/Icon';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderWidth, Colors, hardShadow, themed } from '../../constants/Colors';
import { computeServiceFee } from '../../constants/Config';
import { Chip, NeoButton, NeoInput, ScreenHeader, Segmented, Text } from '../../components/neo';

const ROOM_TYPES = ['Single', 'Shared', 'Hostel'] as const;
const GENDERS = ['Male', 'Female', 'Mixed'] as const;
const AMENITIES = ['WiFi', 'Water', 'Electricity', 'Security', 'Parking', 'Kitchen', 'Furnished', 'Private Bathroom'];

const tzs = (n: number) => `TZS ${n.toLocaleString()}`;

export default function AddRoom() {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ name: '', description: '', price: '', university: '', address: '' });
  const [roomType, setRoomType] = useState<typeof ROOM_TYPES[number]>('Single');
  const [gender, setGender] = useState<typeof GENDERS[number]>('Mixed');
  const [amenities, setAmenities] = useState<string[]>(['WiFi', 'Water']);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const toggleAmenity = (a: string) => setAmenities(p => (p.includes(a) ? p.filter(x => x !== a) : [...p, a]));
  const price = Number(form.price.replace(/\D/g, '')) || 0;

  const pick = async (kind: 'image' | 'video') => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8, allowsMultipleSelection: kind === 'image',
    });
    if (res.canceled) return;
    const uris = res.assets.map(a => a.uri);
    if (kind === 'image') setImages(p => [...p, ...uris].slice(0, 5));
    else setVideos(p => [...p, ...uris].slice(0, 2));
  };

  const submit = () => {
    if (!form.name.trim()) return Alert.alert('Missing', 'Add a room name.');
    if (price <= 0) return Alert.alert('Missing', 'Add a monthly rent.');
    if (images.length < 1) return Alert.alert('Add photos', 'Add at least one photo (5 recommended).');
    Alert.alert(
      'Submitted for review',
      'Your room has been sent to the RoomLink team. It will publish once approved.',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Add a room" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Photos ({images.length}/5)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaRow}>
          <Pressable style={({ pressed }) => [styles.uploadBox, pressed && styles.uploadPressed]} onPress={() => pick('image')} accessibilityLabel="Add photos">
            <Icon name="camera" size={26} color={Colors.ink} />
            <Text style={styles.uploadText}>Add</Text>
          </Pressable>
          {images.map((uri, i) => (
            <View key={uri + i} style={[styles.thumbWrap, hardShadow(3)]}>
              <Image source={{ uri }} style={styles.thumb} />
              <Pressable style={styles.remove} onPress={() => setImages(p => p.filter((_, x) => x !== i))} hitSlop={6} accessibilityLabel="Remove photo">
                <Icon name="close" size={13} color={Colors.white} />
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <Text style={[styles.label, styles.spaced]}>Videos ({videos.length}/2) — room tour & environment</Text>
        <View style={styles.mediaRowStatic}>
          <Pressable style={({ pressed }) => [styles.videoBox, pressed && styles.uploadPressed]} onPress={() => pick('video')} accessibilityLabel="Add video">
            <Icon name="videocam" size={24} color={Colors.ink} />
            <Text style={styles.uploadText}>Add video</Text>
          </Pressable>
          {videos.map((_, i) => (
            <View key={i} style={[styles.videoAdded, hardShadow(3)]}>
              <Icon name="play" size={24} color={Colors.ink} />
              <Pressable style={styles.remove} onPress={() => setVideos(p => p.filter((_, x) => x !== i))} hitSlop={6} accessibilityLabel="Remove video">
                <Icon name="close" size={13} color={Colors.white} />
              </Pressable>
            </View>
          ))}
        </View>

        <NeoInput label="Room name" value={form.name} onChangeText={v => update('name', v)} placeholder="e.g. Blue Horizon — Room A" containerStyle={styles.spaced} />
        <NeoInput label="Description" value={form.description} onChangeText={v => update('description', v)} placeholder="Describe the room, rules, surroundings…" multiline containerStyle={styles.spaced} />
        <NeoInput label="Monthly rent (TZS)" value={form.price} onChangeText={v => update('price', v)} placeholder="e.g. 180000" keyboardType="numeric" containerStyle={styles.spaced} />

        {price > 0 && (
          <View style={styles.feePreview}>
            <Icon name="information-circle" size={18} color={Colors.ink} />
            <Text style={styles.feePreviewText}>
              Students will pay a one-time RoomLink fee of{' '}
              <Text style={styles.feeStrong}>{tzs(computeServiceFee(price))}</Text> (40%). You collect rent directly.
            </Text>
          </View>
        )}

        <NeoInput label="Nearest university" value={form.university} onChangeText={v => update('university', v)} placeholder="e.g. UDSM" containerStyle={styles.spaced} />
        <NeoInput label="Address" value={form.address} onChangeText={v => update('address', v)} placeholder="Street, area" containerStyle={styles.spaced} />

        <Text style={[styles.label, styles.spaced]}>Room type</Text>
        <Segmented options={ROOM_TYPES.map(t => ({ value: t, label: t }))} value={roomType} onChange={setRoomType} />

        <Text style={[styles.label, styles.spaced]}>Gender allowed</Text>
        <Segmented options={GENDERS.map(g => ({ value: g, label: g }))} value={gender} onChange={setGender} />

        <Text style={[styles.label, styles.spaced]}>Amenities</Text>
        <View style={styles.amenities}>
          {AMENITIES.map(a => (
            <Chip
              key={a}
              label={a}
              icon={amenities.includes(a) ? 'checkmark' : undefined}
              active={amenities.includes(a)}
              onPress={() => toggleAmenity(a)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <NeoButton title="Submit for review" variant="purple" size="lg" iconRight="send" onPress={submit} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  label: { color: Colors.ink, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  spaced: { marginTop: 20 },
  mediaRow: { gap: 12, paddingBottom: 6, paddingRight: 6 },
  mediaRowStatic: { flexDirection: 'row', gap: 12 },
  uploadBox: {
    width: 92, height: 92, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: Colors.yellowSoft, borderWidth: BorderWidth.base, borderColor: Colors.ink, borderStyle: 'dashed',
  },
  uploadPressed: { backgroundColor: Colors.yellow },
  uploadText: { color: Colors.ink, fontSize: 12, fontWeight: '700' },
  thumbWrap: { borderRadius: 16, borderWidth: BorderWidth.base, borderColor: Colors.ink, backgroundColor: Colors.surface },
  thumb: { width: 87, height: 87, borderRadius: 16 - BorderWidth.base },
  remove: {
    position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.thin, borderColor: Colors.bg,
  },
  videoBox: {
    width: 132, height: 76, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3,
    backgroundColor: Colors.yellowSoft, borderWidth: BorderWidth.base, borderColor: Colors.ink, borderStyle: 'dashed',
  },
  videoAdded: {
    width: 76, height: 76, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.purple, borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  feePreview: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 14, padding: 12, borderRadius: 12,
    backgroundColor: Colors.blueSoft, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  feePreviewText: { flex: 1, color: Colors.ink, fontSize: 13, lineHeight: 19 },
  feeStrong: { fontWeight: '700' },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  footer: {
    paddingHorizontal: 20, paddingTop: 16,
    backgroundColor: Colors.bg, borderTopWidth: BorderWidth.thick, borderTopColor: Colors.ink,
  },
}));
