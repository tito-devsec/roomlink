import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Icon } from './neo/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderWidth, Colors, themed } from '../constants/Colors';
import { useThemeMode } from '../services/theme';
import { IconButton, Text } from './neo';
import { HostelSheet, MapHeader, MapLegend } from './MapParts';
import { MOCK_HOSTELS, MOCK_UNIVERSITIES } from '../services/mockData';
import type { Hostel } from '../types';

// "Paper" map: cream land, white roads with ink edges, yellow highways, blue water.
const MAP_STYLE_LIGHT = [
  { elementType: 'geometry', stylers: [{ color: '#FFF6E6' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#111111' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFF6E6' }, { weight: 3 }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#111111' }, { weight: 1 }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#FFEFC9' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#C9F2DC' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#111111' }, { weight: 0.6 }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#474747' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#FFD23F' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#111111' }, { weight: 1 }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#EDE3CF' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#9DB8FF' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#1A3BE8' }] },
];

// The same map at night: charcoal land, cream road edges, amber highways, deep blue water.
const MAP_STYLE_DARK = [
  { elementType: 'geometry', stylers: [{ color: '#1A1A21' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#F4EDE0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#131318' }, { weight: 3 }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#F4EDE0' }, { weight: 1 }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#24242C' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#173529' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2C2C36' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#F4EDE0' }, { weight: 0.4 }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#BDB6AA' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#7A5C00' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#F4EDE0' }, { weight: 0.8 }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#22222A' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1F2A55' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#8FA2FF' }] },
];

const INITIAL_REGION = { latitude: -6.7714, longitude: 39.2226, latitudeDelta: 0.09, longitudeDelta: 0.09 };

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mode = useThemeMode();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        } catch {
          setLocation({ latitude: -6.7714, longitude: 39.2226 });
        }
      } else {
        setLocation({ latitude: -6.7714, longitude: 39.2226 });
      }
    })();
  }, []);

  const focusUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({ ...location, latitudeDelta: 0.025, longitudeDelta: 0.025 }, 800);
    }
  };

  const handleMarkerPress = (hostel: Hostel) => {
    setSelectedHostel(hostel);
    setModalVisible(true);
    mapRef.current?.animateToRegion({ latitude: hostel.latitude - 0.006, longitude: hostel.longitude, latitudeDelta: 0.028, longitudeDelta: 0.028 }, 600);
  };

  const top = insets.top + 10;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={INITIAL_REGION}
        mapType={mapType}
        customMapStyle={mapType === 'standard' ? (mode === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_LIGHT) : undefined}
        showsUserLocation={permissionGranted}
        showsMyLocationButton={false}
        showsCompass={false}
        showsBuildings={true}
        showsTraffic={false}
        onPress={() => setModalVisible(false)}
      >
        {MOCK_HOSTELS.map(hostel => {
          const selected = selectedHostel?.id === hostel.id;
          return (
            <Marker
              key={hostel.id}
              coordinate={{ latitude: hostel.latitude, longitude: hostel.longitude }}
              onPress={() => handleMarkerPress(hostel)}
            >
              <View style={[styles.markerWrap, selected && styles.markerWrapSelected]}>
                <View>
                  {/* Plain offset block, not boxShadow: markers are snapshotted to bitmaps on Android. */}
                  <View style={styles.markerShadow} />
                  <View style={[styles.markerBubble, selected && styles.markerBubbleSelected]}>
                    <Text style={styles.markerPrice}>{(hostel.price_per_month / 1000).toFixed(0)}k</Text>
                  </View>
                </View>
                <View style={styles.markerTail} />
              </View>
            </Marker>
          );
        })}

        {MOCK_UNIVERSITIES.slice(0, 5).map(uni => (
          <Marker key={uni.id} coordinate={{ latitude: uni.latitude, longitude: uni.longitude }}>
            <View style={styles.uniMarker}>
              <Icon name="school" size={16} color={Colors.ink} />
            </View>
          </Marker>
        ))}

        {location && (
          <Circle
            center={location}
            radius={1200}
            fillColor={mode === 'dark' ? 'rgba(143,162,255,0.12)' : 'rgba(26,59,232,0.08)'}
            strokeColor={mode === 'dark' ? 'rgba(244,237,224,0.6)' : 'rgba(17,17,17,0.6)'}
            strokeWidth={2}
          />
        )}
      </MapView>

      <View style={[styles.headerOverlay, { top }]}>
        <MapHeader count={MOCK_HOSTELS.length} />
      </View>

      <View style={[styles.controls, { top: top + 84 }]}>
        <IconButton icon="locate" onPress={focusUser} accessibilityLabel="Go to my location" />
        <IconButton
          icon={mapType === 'satellite' ? 'map' : 'earth'}
          color={mapType === 'satellite' ? Colors.yellow : Colors.surface}
          onPress={() => setMapType(t => t === 'satellite' ? 'standard' : 'satellite')}
          accessibilityLabel={mapType === 'satellite' ? 'Show street map' : 'Show satellite map'}
        />
      </View>

      <MapLegend style={[styles.legend, { top: top + 84 }]} />

      <HostelSheet
        hostel={selectedHostel}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onViewFull={() => { setModalVisible(false); if (selectedHostel) router.push(`/hostel/${selectedHostel.id}`); }}
      />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  map: { flex: 1 },

  markerWrap: { alignItems: 'center', paddingRight: 3, paddingBottom: 1 },
  markerWrapSelected: { transform: [{ scale: 1.15 }] },
  markerShadow: {
    position: 'absolute', top: 3, left: 3, right: -3, bottom: -3,
    backgroundColor: Colors.ink, borderRadius: 9,
  },
  markerBubble: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9,
    backgroundColor: Colors.surface, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
  markerBubbleSelected: { backgroundColor: Colors.yellow },
  markerPrice: { color: Colors.ink, fontSize: 13, fontWeight: '700' },
  markerTail: {
    width: 0, height: 0, marginTop: 2,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: Colors.ink,
  },
  uniMarker: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },

  headerOverlay: { position: 'absolute', left: 16, right: 16 },
  controls: { position: 'absolute', right: 18, gap: 12 },
  legend: { position: 'absolute', left: 16 },
}));
