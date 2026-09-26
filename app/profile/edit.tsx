import { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable,
  Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import { Chip, IconButton, NeoButton, NeoInput, ScreenHeader, Text } from '../../components/neo';
import UniversityPicker from '../../components/UniversityPicker';
import { saveMyProfile, getMyProfile } from '../../services/profile';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year+', 'Postgraduate'];

export default function EditProfileScreen() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(user?.imageUrl || null);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: '',
    whatsapp: '',
    gender: '',
    university: '1',
    yearOfStudy: '',
    budgetMin: '80000',
    budgetMax: '300000',
    bio: '',
  });

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  // Reflect the student's saved university/budget so edits start from the truth.
  useEffect(() => {
    getMyProfile().then(p => setForm(f => ({
      ...f,
      university: p.university_id || f.university,
      budgetMin: p.budget_min ? String(p.budget_min) : f.budgetMin,
      budgetMax: p.budget_max ? String(p.budget_max) : f.budgetMax,
    })));
  }, []);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!form.firstName.trim()) { Alert.alert('Error', 'First name is required'); return; }
    setLoading(true);
    try {
      await user?.update({ firstName: form.firstName, lastName: form.lastName });
      await saveMyProfile({
        full_name: `${form.firstName} ${form.lastName}`.trim(),
        university_id: form.university || undefined as any,
        gender: (form.gender?.toLowerCase().includes('male') ? (form.gender.toLowerCase().startsWith('fe') ? 'female' : 'male') : undefined) as any,
        budget_min: parseInt(form.budgetMin) || undefined,
        budget_max: parseInt(form.budgetMax) || undefined,
      });
      // In real app: update Supabase users table with all fields
      Alert.alert('Success', 'Profile updated!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Update failed');
    } finally { setLoading(false); }
  };

  const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase() || 'RL';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Edit profile"
        right={<NeoButton title={loading ? 'Saving…' : 'Save'} size="sm" onPress={handleSave} disabled={loading} />}
      />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarSection}>
            <Pressable onPress={pickAvatar} accessibilityRole="button" accessibilityLabel="Change photo">
              <View style={[styles.avatar, hardShadow(5)]}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitials}>{initials}</Text>
                )}
              </View>
              <IconButton
                icon="camera"
                size={34}
                iconSize={16}
                round
                shadow={2}
                color={Colors.ink}
                iconColor={Colors.white}
                onPress={pickAvatar}
                style={styles.cameraBtn}
                accessibilityLabel="Change photo"
              />
            </Pressable>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          <Text style={styles.sectionLabel}>Personal information</Text>
          <NeoInput label="First name" icon="person" value={form.firstName} onChangeText={v => update('firstName', v)} placeholder="First name" containerStyle={styles.field} />
          <NeoInput label="Last name" icon="person" value={form.lastName} onChangeText={v => update('lastName', v)} placeholder="Last name" containerStyle={styles.field} />
          <NeoInput label="Phone" icon="call" value={form.phone} onChangeText={v => update('phone', v)} placeholder="+255 7XX XXX XXX" keyboardType="phone-pad" containerStyle={styles.field} />
          <NeoInput label="WhatsApp" icon="logo-whatsapp" value={form.whatsapp} onChangeText={v => update('whatsapp', v)} placeholder="+255 7XX XXX XXX" keyboardType="phone-pad" containerStyle={styles.field} />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.pillRow}>
              {GENDER_OPTIONS.map(g => (
                <Chip key={g} label={g} active={form.gender === g} onPress={() => update('gender', g)} />
              ))}
            </View>
          </View>

          <NeoInput
            label="Bio"
            value={form.bio}
            onChangeText={v => update('bio', v)}
            placeholder="Tell others about yourself..."
            multiline
            maxLength={200}
            hint={`${form.bio.length}/200`}
            containerStyle={styles.field}
          />

          <Text style={styles.sectionLabel}>Academic information</Text>
          <View style={[styles.field, styles.pickerField]}>
            <Text style={styles.fieldLabel}>University</Text>
            <UniversityPicker value={form.university} onChange={(id) => update('university', id)} />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Year of study</Text>
            <View style={styles.pillRow}>
              {YEAR_OPTIONS.map(y => (
                <Chip key={y} label={y} active={form.yearOfStudy === y} onPress={() => update('yearOfStudy', y)} />
              ))}
            </View>
          </View>

          <Text style={styles.sectionLabel}>Accommodation preferences</Text>
          <Text style={styles.fieldLabel}>Monthly budget range (TZS)</Text>
          <View style={styles.budgetRow}>
            <NeoInput value={form.budgetMin} onChangeText={v => update('budgetMin', v)} placeholder="Min" keyboardType="numeric" containerStyle={styles.flex} />
            <View style={styles.budgetDash} />
            <NeoInput value={form.budgetMax} onChangeText={v => update('budgetMax', v)} placeholder="Max" keyboardType="numeric" containerStyle={styles.flex} />
          </View>

          <NeoButton
            title={loading ? 'Saving…' : 'Save changes'}
            icon="checkmark-circle"
            size="lg"
            loading={loading}
            onPress={handleSave}
            style={styles.bigSaveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 60 },
  avatarSection: { alignItems: 'center', marginBottom: 26 },
  avatar: {
    width: 104, height: 104, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.pink, borderWidth: BorderWidth.thick, borderColor: Colors.ink,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 28 - BorderWidth.thick },
  avatarInitials: { fontFamily: Fonts.display, fontSize: 36, color: Colors.ink },
  cameraBtn: { position: 'absolute', bottom: -8, right: -10 },
  avatarHint: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginTop: 16 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.blue, textTransform: 'uppercase',
    letterSpacing: 1.4, marginBottom: 14, marginTop: 10,
  },
  field: { marginBottom: 18 },
  pickerField: { zIndex: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.ink, marginBottom: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  budgetDash: { width: 14, height: BorderWidth.base, backgroundColor: Colors.ink },
  bigSaveBtn: { marginTop: 28 },
}));
