import { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../../components/neo/Icon';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import { NeoButton, NeoCard, ProgressBar, ScreenHeader, Tag, Text, type IconName } from '../../components/neo';

type VerStep = 'intro' | 'id_front' | 'id_back' | 'selfie' | 'review' | 'submitted';

const FLOW: VerStep[] = ['intro', 'id_front', 'id_back', 'selfie', 'review'];

const STEPS_INFO = themed((): Record<VerStep, { icon: IconName; title: string; subtitle: string; color: string }> => ({
  intro: { icon: 'school', title: 'Student Verification', subtitle: 'Verify your student status with your university ID card', color: Colors.yellow },
  id_front: { icon: 'card', title: 'ID Card - Front', subtitle: 'Take or upload a photo of the front of your student ID', color: Colors.cyan },
  id_back: { icon: 'refresh', title: 'ID Card - Back', subtitle: 'Now capture the back of your student ID card', color: Colors.purple },
  selfie: { icon: 'portrait', title: 'Selfie with ID', subtitle: 'Take a selfie holding your student ID card', color: Colors.pink },
  review: { icon: 'checkmark-circle', title: 'Review & Submit', subtitle: 'Check your photos before submitting for verification', color: Colors.green },
  submitted: { icon: 'party', title: 'Submitted!', subtitle: 'Your verification is under review. We\'ll notify you within 24 hours.', color: Colors.green },
}));

const REQUIREMENTS = themed((): { icon: IconName; text: string; color: string }[] => [
  { icon: 'card', text: 'Valid university student ID card', color: Colors.cyan },
  { icon: 'camera', text: 'Clear photos (no blur or glare)', color: Colors.yellow },
  { icon: 'person', text: 'Selfie holding your ID card', color: Colors.pink },
  { icon: 'time', text: 'Review takes up to 24 hours', color: Colors.purple },
]);

function Corners() {
  return (
    <>
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
    </>
  );
}

export default function VerificationScreen() {
  const [step, setStep] = useState<VerStep>('intro');
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (type: 'front' | 'back' | 'selfie') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo access to continue');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: type === 'selfie' ? [1, 1] : [16, 10],
    });

    if (!result.canceled) {
      if (type === 'front') { setIdFront(result.assets[0].uri); setStep('id_back'); }
      else if (type === 'back') { setIdBack(result.assets[0].uri); setStep('selfie'); }
      else { setSelfie(result.assets[0].uri); setStep('review'); }
    }
  };

  const takePhoto = async (type: 'front' | 'back' | 'selfie') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: type === 'selfie' ? [1, 1] : [16, 10],
    });
    if (!result.canceled) {
      if (type === 'front') { setIdFront(result.assets[0].uri); setStep('id_back'); }
      else if (type === 'back') { setIdBack(result.assets[0].uri); setStep('selfie'); }
      else { setSelfie(result.assets[0].uri); setStep('review'); }
    }
  };

  const submitVerification = async () => {
    setLoading(true);
    try {
      // In real app: upload images to Supabase Storage, then insert verification record
      // await supabase.from('verifications').insert({ user_id: user?.id, status: 'pending', ... })
      await new Promise(r => setTimeout(r, 1500)); // simulate upload
      setStep('submitted');
    } catch (err) {
      Alert.alert('Error', 'Submission failed. Please try again.');
    } finally { setLoading(false); }
  };

  const info = STEPS_INFO[step];
  const captureType = step === 'id_front' ? 'front' : step === 'id_back' ? 'back' : 'selfie';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Student verification"
        backIcon={step === 'intro' ? 'arrow-back' : 'close'}
        onBack={() => (step === 'intro' ? router.back() : setStep('intro'))}
      />

      {step !== 'submitted' && (
        <ProgressBar progress={(FLOW.indexOf(step) + 1) / FLOW.length} style={styles.progress} />
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step !== 'submitted' && (
          <>
            <View style={[styles.iconTile, { backgroundColor: info.color }, hardShadow(5)]}>
              <Icon name={info.icon} size={38} color={Colors.ink} />
            </View>
            <Text style={styles.title}>{info.title}</Text>
            <Text style={styles.subtitle}>{info.subtitle}</Text>
          </>
        )}

        {step === 'intro' && (
          <View style={styles.fullWidth}>
            <View style={styles.requirementsList}>
              {REQUIREMENTS.map(req => (
                <NeoCard key={req.text} shadow={3} radius={14} style={styles.reqItem}>
                  <View style={[styles.reqIcon, { backgroundColor: req.color }]}>
                    <Icon name={req.icon} size={18} color={Colors.ink} />
                  </View>
                  <Text style={styles.reqText}>{req.text}</Text>
                </NeoCard>
              ))}
            </View>

            <View style={styles.privacyNote}>
              <Icon name="shield-checkmark" size={18} color={Colors.ink} />
              <Text style={styles.privacyText}>
                Your ID photos are encrypted and only used for verification. We never share them with third parties.
              </Text>
            </View>

            <Pressable style={styles.termsLink} onPress={() => router.push('/legal/privacy')} hitSlop={8}>
              <Text style={styles.termsLinkText}>Read our Privacy Policy</Text>
              <Icon name="arrow-forward" size={14} color={Colors.ink} />
            </Pressable>

            <NeoButton title="Start verification" iconRight="arrow-forward" size="lg" onPress={() => setStep('id_front')} />
          </View>
        )}

        {(step === 'id_front' || step === 'id_back' || step === 'selfie') && (
          <View style={styles.fullWidth}>
            <View style={styles.imagePlaceholder}>
              <Corners />
              <Icon
                name={step === 'selfie' ? 'person-circle' : 'card'}
                size={step === 'selfie' ? 76 : 60}
                color={Colors.ink}
              />
              <Text style={styles.placeholderHint}>
                {step === 'selfie' ? 'Face the camera\nholding your ID' : `Student ID • ${step === 'id_front' ? 'Front' : 'Back'}`}
              </Text>
            </View>

            <View style={styles.captureActions}>
              <NeoButton title="Take photo" icon="camera" size="lg" onPress={() => takePhoto(captureType)} />
              <NeoButton title="From gallery" icon="images" size="lg" variant="secondary" onPress={() => pickImage(captureType)} />
            </View>
          </View>
        )}

        {step === 'review' && (
          <View style={styles.fullWidth}>
            <View style={styles.reviewGrid}>
              {([
                { label: 'ID front', uri: idFront, retake: 'id_front' },
                { label: 'ID back', uri: idBack, retake: 'id_back' },
              ] as const).map(p => (
                <View key={p.label} style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>{p.label}</Text>
                  <View style={[styles.reviewImgWrap, hardShadow(3)]}>
                    <View style={styles.reviewClip}>
                      {p.uri
                        ? <Image source={{ uri: p.uri }} style={styles.reviewImg} resizeMode="cover" />
                        : <Icon name="card" size={30} color={Colors.ink} />}
                    </View>
                  </View>
                  <Pressable onPress={() => setStep(p.retake)} hitSlop={8}><Text style={styles.retakeText}>Retake</Text></Pressable>
                </View>
              ))}
            </View>
            <View style={styles.reviewSelfieWrap}>
              <Text style={styles.reviewLabel}>Selfie with ID</Text>
              <View style={[styles.reviewSelfie, hardShadow(3)]}>
                {selfie
                  ? <Image source={{ uri: selfie }} style={styles.reviewSelfieImg} resizeMode="cover" />
                  : <Icon name="person-circle" size={44} color={Colors.ink} />}
              </View>
              <Pressable onPress={() => setStep('selfie')} hitSlop={8}><Text style={styles.retakeText}>Retake</Text></Pressable>
            </View>

            <NeoButton
              title={loading ? 'Submitting…' : 'Submit for verification'}
              icon="checkmark-circle"
              size="lg"
              loading={loading}
              onPress={submitVerification}
            />
          </View>
        )}

        {step === 'submitted' && (
          <View style={styles.submittedContent}>
            <View style={[styles.successTile, hardShadow(6)]}>
              <Icon name="checkmark" size={56} color={Colors.ink} />
            </View>
            <Text style={styles.successTitle}>Application submitted!</Text>
            <Text style={styles.successDesc}>
              We're reviewing your student ID. You'll receive a notification within 24 hours once verified.
            </Text>
            <Tag label="Verification pending review" icon="time" color={Colors.orange} size="md" shadow={2} style={styles.statusTag} />
            <NeoButton title="Back to profile" size="lg" onPress={() => router.replace('/(tabs)/profile')} style={styles.doneBtn} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const CORNER = 26;

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  progress: { marginHorizontal: 20, marginTop: 16 },
  content: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 60, alignItems: 'center' },
  fullWidth: { width: '100%' },
  iconTile: {
    width: 88, height: 88, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.thick, borderColor: Colors.ink, marginBottom: 20, transform: [{ rotate: '-4deg' }],
  },
  title: { fontFamily: Fonts.display, fontSize: 26, color: Colors.ink, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 26, paddingHorizontal: 10 },

  requirementsList: { gap: 12, marginBottom: 20 },
  reqItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  reqIcon: {
    width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  reqText: { fontSize: 14, fontWeight: '600', color: Colors.ink, flex: 1 },
  privacyNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, marginBottom: 14,
    backgroundColor: Colors.greenSoft, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  privacyText: { fontSize: 13, color: Colors.ink, lineHeight: 19, flex: 1 },
  termsLink: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center', marginBottom: 24 },
  termsLinkText: { color: Colors.ink, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },

  imagePlaceholder: {
    width: '100%', height: 210, borderRadius: 18, marginBottom: 24,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', gap: 12,
    borderWidth: BorderWidth.base, borderColor: Colors.ink, borderStyle: 'dashed',
  },
  placeholderHint: { color: Colors.ink, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: Colors.ink },
  cornerTL: { top: 14, left: 14, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  cornerTR: { top: 14, right: 14, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  cornerBL: { bottom: 14, left: 14, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 14, right: 14, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
  captureActions: { gap: 14 },

  reviewGrid: { flexDirection: 'row', gap: 14, marginBottom: 18 },
  reviewItem: { flex: 1, alignItems: 'center', gap: 8 },
  reviewLabel: { fontSize: 13, fontWeight: '700', color: Colors.ink, textAlign: 'center' },
  reviewImgWrap: {
    width: '100%', height: 120, borderRadius: 14, backgroundColor: Colors.surface,
    borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  reviewClip: { flex: 1, borderRadius: 14 - BorderWidth.base, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  reviewImg: { width: '100%', height: '100%' },
  retakeText: { color: Colors.ink, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  reviewSelfieWrap: { alignItems: 'center', gap: 8, marginBottom: 26 },
  reviewSelfie: {
    width: 136, height: 136, borderRadius: 68, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  reviewSelfieImg: { width: '100%', height: '100%', borderRadius: 68 },

  submittedContent: { alignItems: 'center', width: '100%', paddingTop: 20 },
  successTile: {
    width: 116, height: 116, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.green, borderWidth: BorderWidth.thick, borderColor: Colors.ink,
    marginBottom: 28, transform: [{ rotate: '-4deg' }],
  },
  successTitle: { fontFamily: Fonts.display, fontSize: 26, color: Colors.ink, marginBottom: 12, textAlign: 'center' },
  successDesc: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10, marginBottom: 22 },
  statusTag: { alignSelf: 'center', marginBottom: 30 },
  doneBtn: { alignSelf: 'stretch' },
}));
