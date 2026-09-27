import { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Animated, Alert, Image,
  type ImageSourcePropType,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Icon } from '../components/neo/Icon';
import { useUser } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderWidth, Colors, Fonts, hardShadow, themed } from '../constants/Colors';
import { Config, computeServiceFee, brokerEquivalent } from '../constants/Config';
import {
  DashedLine, NeoButton, NeoCard, NeoInput, NeoPressable, ScreenHeader, Tag, Text, KeyboardSafeView,
  useKeyboardVisible,
} from '../components/neo';
import {
  createServiceCharge, pollUntilResolved, isValidTzPhone,
  type PaymentNetwork, type PaymentStatus,
} from '../services/payments';
import { createBooking } from '../services/data';

const tzs = (n: number) => `TZS ${n.toLocaleString()}`;

// Official logos, keyed by Config.PAYMENT_NETWORKS ids.
const NETWORK_LOGOS: Record<string, ImageSourcePropType> = {
  mpesa: require('../assets/images/networks/mpesa.png'),
  tigo: require('../assets/images/networks/mixx.png'),
  airtel: require('../assets/images/networks/airtel.png'),
  halopesa: require('../assets/images/networks/halopesa.png'),
};

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardVisible();
  const { user } = useUser();
  const params = useLocalSearchParams<{
    bookingId?: string; hostelId?: string; hostelName?: string;
    monthlyRent?: string; duration?: string;
  }>();

  const monthlyRent = Number(params.monthlyRent || 0);
  const duration = Number(params.duration || 1);
  const serviceFee = computeServiceFee(monthlyRent);
  const savings = Math.max(0, brokerEquivalent(monthlyRent) - serviceFee);

  const [network, setNetwork] = useState<PaymentNetwork>('mpesa');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<'form' | 'pending' | 'done'>('form');
  const [result, setResult] = useState<PaymentStatus | null>(null);
  const [statusLine, setStatusLine] = useState('');

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (stage !== 'pending') return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.1, duration: 650, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [stage]);

  const pay = async () => {
    if (!isValidTzPhone(phone)) {
      Alert.alert('Check the number', 'Enter a valid Tanzanian mobile-money number, e.g. 0712 345 678.');
      return;
    }
    setStage('pending');
    setStatusLine('Sending a payment request to your phone…');
    try {
      const charge = await createServiceCharge({
        bookingId: params.bookingId || `bk_${Date.now()}`,
        hostelId: params.hostelId || '',
        monthlyRent, phone, network, userId: user?.id,
      });
      setStatusLine('Enter your mobile-money PIN on your phone to approve.');
      const final = await pollUntilResolved(charge.paymentId, (s) => {
        if (s === 'pending') setStatusLine('Waiting for you to approve on your phone…');
      });
      if (final === 'completed' && user?.id && params.hostelId) {
        // Persist the booking request to Supabase (best-effort).
        createBooking({
          userId: user.id,
          hostelId: params.hostelId,
          checkInDate: new Date().toISOString().slice(0, 10),
          durationMonths: duration,
          totalAmount: serviceFee,
        }).catch(() => {});
      }
      setResult(final);
      setStage('done');
    } catch (e: any) {
      setResult('failed');
      setStatusLine(e?.message || 'Could not start the payment.');
      setStage('done');
    }
  };

  if (stage === 'pending') {
    return (
      <View style={styles.center}>
        <Animated.View style={[styles.pulseTile, hardShadow(6), { transform: [{ scale: pulse }, { rotate: '-4deg' }] }]}>
          <Icon name="phone-portrait" size={42} color={Colors.ink} />
        </Animated.View>
        <Text style={styles.bigTitle}>Approve on your phone</Text>
        <Text style={styles.sub}>{statusLine}</Text>
        <ActivityIndicator color={Colors.ink} style={styles.pendingSpinner} />
        <Tag label={`Paying ${tzs(serviceFee)} service fee`} icon="lock-closed" color={Colors.surface} size="md" shadow={2} style={styles.pendingTag} />
      </View>
    );
  }

  if (stage === 'done') {
    const ok = result === 'completed';
    const pending = result === 'pending';
    const tone = ok ? Colors.green : pending ? Colors.orange : Colors.coral;
    return (
      <View style={styles.center}>
        <View style={[styles.resultTile, { backgroundColor: tone }, hardShadow(6)]}>
          <Icon name={ok ? 'checkmark' : pending ? 'time' : 'close'} size={56} color={Colors.ink} />
        </View>
        <Text style={styles.bigTitle}>
          {ok ? 'Payment received' : pending ? 'Still processing' : 'Payment not completed'}
        </Text>
        <Text style={styles.sub}>
          {ok ? `Your ${tzs(serviceFee)} service fee is paid. Your booking request has been sent — RoomLink will verify and connect you with the owner.`
            : pending ? 'We haven’t heard back from the network yet. If money left your account, your booking will update automatically within a few minutes.'
            : statusLine || 'No money was taken. You can try again.'}
        </Text>
        <NeoButton title={ok ? 'Done' : 'Back to home'} size="lg" onPress={() => router.replace('/(tabs)')} style={styles.doneBtn} />
        {!ok && !pending && (
          <Pressable style={styles.ghostBtn} onPress={() => { setResult(null); setStage('form'); }} hitSlop={8}>
            <Text style={styles.ghostBtnText}>Try again</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <KeyboardSafeView style={styles.container}>
      <ScreenHeader title="Pay service fee" modal />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!!params.hostelName && (
          <>
            <Text style={styles.overline}>Booking</Text>
            <Text style={styles.hostelName}>{params.hostelName}</Text>
          </>
        )}

        <NeoCard shadow={4} radius={18} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Monthly rent</Text>
            <Text style={styles.rowValue}>{tzs(monthlyRent)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Booking duration</Text>
            <Text style={styles.rowValue}>{duration} {duration === 1 ? 'month' : 'months'}</Text>
          </View>
          <DashedLine style={styles.dash} />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.feeLabel}>RoomLink service fee</Text>
              <Text style={styles.feeHint}>{Math.round(Config.SERVICE_FEE_RATE * 100)}% of one month’s rent — paid once</Text>
            </View>
            <Text style={styles.feeValue}>{tzs(serviceFee)}</Text>
          </View>
        </NeoCard>

        {savings > 0 && (
          <Tag label={`You save about ${tzs(savings)} vs a typical broker`} icon="pricetag" color={Colors.green} size="md" style={styles.savings} />
        )}

        <View style={styles.noteBox}>
          <Icon name="shield-checkmark" size={18} color={Colors.ink} />
          <Text style={styles.noteText}>
            Rent is paid to the owner separately after you move in. This one-time fee covers verification, safe matching and support.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Pay with</Text>
        <View style={styles.networks}>
          {Config.PAYMENT_NETWORKS.map(n => {
            const active = network === n.id;
            return (
              <NeoPressable
                key={n.id}
                onPress={() => setNetwork(n.id as PaymentNetwork)}
                shadow={active ? 4 : 3}
                haptic="selection"
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={n.label}
                style={[styles.network, active && styles.networkActive]}
              >
                <View style={styles.logoTile}>
                  <Image source={NETWORK_LOGOS[n.id]} style={styles.logo} resizeMode="contain" />
                </View>
                <Text style={styles.networkText}>{n.label}</Text>
                <View style={[styles.radio, active && styles.radioOn]}>
                  {active && <Icon name="checkmark" size={14} color={Colors.yellow} />}
                </View>
              </NeoPressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Mobile money number</Text>
        <NeoInput
          value={phone}
          onChangeText={setPhone}
          placeholder="712 345 678"
          keyboardType="phone-pad"
          maxLength={13}
          inputStyle={styles.phoneInput}
          left={<View style={styles.prefix}><Text style={styles.prefixText}>TZ +255</Text></View>}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: keyboardOpen ? 12 : Math.max(insets.bottom, 12) + 8 }]}>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Total to pay now</Text>
          <Text style={styles.footerAmount}>{tzs(serviceFee)}</Text>
        </View>
        <NeoButton title={`Pay ${tzs(serviceFee)}`} icon="lock-closed" size="lg" haptic="medium" onPress={pay} />
      </View>
    </KeyboardSafeView>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  center: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  content: { padding: 20, paddingBottom: 40 },
  overline: { fontSize: 12, fontWeight: '700', color: Colors.blue, textTransform: 'uppercase', letterSpacing: 1.4 },
  hostelName: { fontFamily: Fonts.display, fontSize: 24, color: Colors.ink, marginBottom: 16, marginTop: 2 },

  card: { padding: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, gap: 10 },
  rowLabel: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  rowValue: { color: Colors.ink, fontSize: 14, fontWeight: '700' },
  dash: { marginVertical: 10 },
  feeLabel: { color: Colors.ink, fontSize: 15, fontWeight: '700' },
  feeHint: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  feeValue: { fontFamily: Fonts.display, color: Colors.blue, fontSize: 20 },
  savings: { marginTop: 16 },
  noteBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 16, padding: 14, borderRadius: 14,
    backgroundColor: Colors.blueSoft, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  noteText: { flex: 1, color: Colors.ink, fontSize: 13, lineHeight: 19 },

  sectionLabel: { fontFamily: Fonts.display, color: Colors.ink, fontSize: 17, marginTop: 28, marginBottom: 14 },
  networks: { gap: 12 },
  network: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15,
    backgroundColor: Colors.surface, borderRadius: 14, borderWidth: BorderWidth.base, borderColor: Colors.ink,
  },
  networkActive: { backgroundColor: Colors.yellow },
  // Brand logos are drawn for a white background, so the tile stays white in dark mode too.
  logoTile: {
    width: 76, height: 44, padding: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  logo: { width: '100%', height: '100%' },
  networkText: { flex: 1, color: Colors.ink, fontSize: 15, fontWeight: '700' },
  radio: {
    width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  radioOn: { backgroundColor: Colors.ink },
  prefix: { paddingRight: 10, marginRight: 2, borderRightWidth: BorderWidth.thin, borderRightColor: Colors.ink },
  prefixText: { color: Colors.ink, fontSize: 16, fontWeight: '700' },
  phoneInput: { fontSize: 17, letterSpacing: 1 },

  footer: {
    paddingHorizontal: 20, paddingTop: 16,
    backgroundColor: Colors.bg, borderTopWidth: BorderWidth.thick, borderTopColor: Colors.ink,
  },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  footerLabel: { color: Colors.ink, fontSize: 14, fontWeight: '600' },
  footerAmount: { fontFamily: Fonts.display, color: Colors.ink, fontSize: 24 },

  pulseTile: {
    width: 110, height: 110, borderRadius: 30, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.yellow, borderWidth: BorderWidth.thick, borderColor: Colors.ink,
  },
  pendingSpinner: { marginTop: 24 },
  pendingTag: { alignSelf: 'center', marginTop: 24 },
  resultTile: {
    width: 116, height: 116, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.thick, borderColor: Colors.ink, transform: [{ rotate: '-4deg' }],
  },
  bigTitle: { fontFamily: Fonts.display, color: Colors.ink, fontSize: 26, marginTop: 30, textAlign: 'center' },
  sub: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10 },
  doneBtn: { alignSelf: 'stretch', marginTop: 30 },
  ghostBtn: { marginTop: 18, paddingVertical: 8 },
  ghostBtnText: { color: Colors.ink, fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },
}));
