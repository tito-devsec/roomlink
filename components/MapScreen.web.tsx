// Web map: react-native-maps is native-only, so the browser gets Leaflet with
// OpenStreetMap tiles and the same pins, legend and hostel sheet as the app.
// Leaflet touches `window`, so it is required inside an effect — static
// rendering on the server never loads it.
//
// tile.openstreetmap.org suits development and light use only; before launch,
// point TILES.street at a keyed provider (MapTiler, Stadia, Mapbox…).

import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type * as Leaflet from 'leaflet';
import { Colors, Fonts, themed } from '../constants/Colors';
import { useThemeMode } from '../services/theme';
import { IconButton, iconGlyph } from './neo';
import { HostelSheet, MapHeader, MapLegend } from './MapParts';
import { MOCK_HOSTELS, MOCK_UNIVERSITIES } from '../services/mockData';
import type { Hostel } from '../types';

const CAMPUS: [number, number] = [-6.7714, 39.2226]; // UDSM
const TILES = {
  street: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri',
  },
};
const CITY_UNIVERSITIES = MOCK_UNIVERSITIES.filter(u => u.city === 'Dar es Salaam');

const hostelIcon = (L: typeof Leaflet, h: Hostel, on: boolean) => L.divIcon({
  className: 'rl-marker',
  iconSize: [0, 0],
  html: `<div class="rl-pin${on ? ' rl-pin--on' : ''}"><div class="rl-pin-bubble">${(h.price_per_month / 1000).toFixed(0)}k</div><div class="rl-pin-tail"></div></div>`,
});

// Pins are plain DOM inside Leaflet, so they are styled with CSS that is
// rewritten whenever the theme changes.
const mapCss = () => `
#rl-map .leaflet-container { background: ${Colors.bg}; font-family: ${Fonts.medium}, sans-serif; }
#rl-map .rl-tiles-light { filter: saturate(0.85) sepia(0.12); }
#rl-map .rl-tiles-dark { filter: invert(1) hue-rotate(180deg) brightness(0.88) contrast(0.92) saturate(0.7); }
#rl-map .rl-marker { background: none; border: none; }
#rl-map .rl-pin { position: absolute; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 140ms ease; }
#rl-map .rl-pin:hover { transform: translate(-50%, -100%) scale(1.08); }
#rl-map .rl-pin--on, #rl-map .rl-pin--on:hover { transform: translate(-50%, -100%) scale(1.18); }
#rl-map .rl-pin-bubble { padding: 4px 10px; border-radius: 9px; background: ${Colors.surface}; color: ${Colors.ink}; border: 2px solid ${Colors.ink}; box-shadow: 3px 3px 0 ${Colors.ink}; font: 13px ${Fonts.bold}, sans-serif; white-space: nowrap; }
#rl-map .rl-pin--on .rl-pin-bubble { background: ${Colors.yellow}; }
#rl-map .rl-pin-tail { width: 0; height: 0; margin-top: 2px; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${Colors.ink}; }
#rl-map .rl-uni { position: absolute; transform: translate(-50%, -50%); width: 32px; height: 32px; border-radius: 16px; display: flex; align-items: center; justify-content: center; background: ${Colors.surface}; color: ${Colors.ink}; border: 2px solid ${Colors.ink}; font-size: 15px; line-height: 15px; }
#rl-map .leaflet-tooltip { background: ${Colors.surface}; color: ${Colors.ink}; border: 2px solid ${Colors.ink}; border-radius: 8px; box-shadow: 3px 3px 0 ${Colors.ink}; font: 12px ${Fonts.semibold}, sans-serif; }
#rl-map .leaflet-tooltip-top:before { border-top-color: ${Colors.ink}; }
#rl-map .leaflet-control-attribution { margin: 0 12px 112px 0; padding: 2px 8px; border-radius: 8px; border: 2px solid ${Colors.ink}; background: ${Colors.surface}; color: ${Colors.textSecondary}; font: 11px ${Fonts.medium}, sans-serif; }
#rl-map .leaflet-control-attribution a { color: ${Colors.ink}; }
`;

export default function MapScreenWeb() {
  const insets = useSafeAreaInsets();
  const mode = useThemeMode();
  const hostRef = useRef<View>(null);
  const leaflet = useRef<typeof Leaflet | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const tilesRef = useRef<Leaflet.TileLayer | null>(null);
  const meRef = useRef<Leaflet.CircleMarker | null>(null);
  const markers = useRef(new Map<string, Leaflet.Marker>());
  const onPin = useRef<(h: Hostel) => void>(() => {});
  const touched = useRef(false); // the person has moved the map themselves
  const [layer, setLayer] = useState<'street' | 'satellite'>('street');
  const [selected, setSelected] = useState<Hostel | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Build the map once, in the browser.
  useEffect(() => {
    const el = hostRef.current as unknown as HTMLElement | null;
    if (!el) return;
    const L: typeof Leaflet = require('leaflet');
    require('leaflet/dist/leaflet.css');
    leaflet.current = L;

    // Quarter-step zoom lets fitBounds frame the hostels tightly on narrow phones.
    const map = L.map(el, { zoomControl: false, minZoom: 11, maxZoom: 18, zoomSnap: 0.25, zoomDelta: 1 }).setView(CAMPUS, 13);
    mapRef.current = map;
    map.on('click', () => setSheetOpen(false));

    for (const h of MOCK_HOSTELS) {
      const marker = L.marker([h.latitude, h.longitude], { icon: hostelIcon(L, h, false), keyboard: true, title: h.name })
        .on('click', () => onPin.current(h))
        .addTo(map);
      markers.current.set(h.id, marker);
    }
    const { char, fontFamily } = iconGlyph('school');
    for (const u of CITY_UNIVERSITIES) {
      L.marker([u.latitude, u.longitude], {
        icon: L.divIcon({ className: 'rl-marker', iconSize: [0, 0], html: `<div class="rl-uni" style="font-family:${fontFamily}">${char}</div>` }),
      }).bindTooltip(u.short_name || u.name, { direction: 'top', offset: [0, -18] }).addTo(map);
    }

    // Keep tiles filling the box as it resizes, and keep every hostel in view
    // (the page may load hidden or at another size) until the person moves the map.
    const touch = () => { touched.current = true; };
    el.addEventListener('pointerdown', touch);
    el.addEventListener('wheel', touch, { passive: true });
    const frame = () => {
      map.invalidateSize();
      if (touched.current || !el.clientWidth || !el.clientHeight) return;
      map.fitBounds(L.latLngBounds(MOCK_HOSTELS.map(h => [h.latitude, h.longitude] as [number, number])), {
        // Keep pins clear of the header/legend (top-left) and the button column (right).
        paddingTopLeft: [30, 170], paddingBottomRight: [96, 140],
      });
    };
    frame();
    const observer = new ResizeObserver(frame);
    observer.observe(el);

    return () => {
      observer.disconnect();
      el.removeEventListener('pointerdown', touch);
      el.removeEventListener('wheel', touch);
      map.remove();
      mapRef.current = null;
      markers.current.clear();
    };
  }, []);

  // Street tiles are tinted to the theme (inverted at night); satellite is the same in both.
  useEffect(() => {
    const L = leaflet.current, map = mapRef.current;
    if (!L || !map) return;
    const tiles = TILES[layer];
    tilesRef.current?.remove();
    tilesRef.current = L.tileLayer(tiles.url, {
      attribution: tiles.attribution,
      maxZoom: 19,
      className: layer === 'street' ? `rl-tiles-${mode}` : '',
    }).addTo(map);
  }, [mode, layer]);

  useEffect(() => {
    let tag = document.getElementById('rl-map-css') as HTMLStyleElement | null;
    if (!tag) {
      tag = document.createElement('style');
      tag.id = 'rl-map-css';
      document.head.appendChild(tag);
    }
    tag.textContent = mapCss();
  }, [mode]);

  useEffect(() => {
    const L = leaflet.current;
    if (!L) return;
    markers.current.forEach((marker, id) => {
      const h = MOCK_HOSTELS.find(x => x.id === id);
      if (!h) return;
      const on = selected?.id === id;
      marker.setIcon(hostelIcon(L, h, on));
      marker.setZIndexOffset(on ? 1000 : 0);
    });
  }, [selected]);

  onPin.current = (h: Hostel) => {
    touched.current = true;
    setSelected(h);
    setSheetOpen(true);
    const map = mapRef.current;
    if (!map) return;
    // Centre a little below the pin so it stays visible above the sheet.
    const zoom = Math.max(map.getZoom(), 15);
    const point = map.project([h.latitude, h.longitude], zoom).add([0, 150]);
    map.flyTo(map.unproject(point, zoom), zoom, { duration: 0.6 });
  };

  const zoom = (by: 1 | -1) => {
    touched.current = true;
    if (by > 0) mapRef.current?.zoomIn(); else mapRef.current?.zoomOut();
  };

  const locate = () => {
    const L = leaflet.current, map = mapRef.current;
    if (!L || !map) return;
    touched.current = true;
    const campus = () => map.flyTo(CAMPUS, 15, { duration: 0.8 });
    if (!navigator.geolocation) { campus(); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      const here: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      meRef.current?.remove();
      meRef.current = L.circleMarker(here, {
        radius: 9, color: Colors.ink, weight: 3, fillColor: Colors.blue, fillOpacity: 1,
      }).addTo(map);
      map.flyTo(here, 15, { duration: 0.8 });
    }, campus, { timeout: 8000, maximumAge: 60_000 });
  };

  const top = insets.top + 10;

  return (
    <View style={styles.container}>
      <View nativeID="rl-map" style={styles.mapWrap}>
        <View ref={hostRef} style={styles.map} />
      </View>

      <View style={[styles.headerOverlay, { top }]}>
        <MapHeader count={MOCK_HOSTELS.length} />
      </View>

      <View style={[styles.controls, { top: top + 84 }]}>
        <IconButton icon="add" onPress={() => zoom(1)} accessibilityLabel="Zoom in" />
        <IconButton icon="remove" onPress={() => zoom(-1)} accessibilityLabel="Zoom out" />
        <IconButton icon="locate" onPress={locate} accessibilityLabel="Go to my location" />
        <IconButton
          icon={layer === 'satellite' ? 'map' : 'earth'}
          color={layer === 'satellite' ? Colors.yellow : Colors.surface}
          onPress={() => setLayer(l => (l === 'satellite' ? 'street' : 'satellite'))}
          accessibilityLabel={layer === 'satellite' ? 'Show street map' : 'Show satellite map'}
        />
      </View>

      <MapLegend style={[styles.legend, { top: top + 84 }]} />

      <HostelSheet
        hostel={selected}
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onViewFull={() => { setSheetOpen(false); if (selected) router.push(`/hostel/${selected.id}`); }}
      />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  // zIndex 0 keeps Leaflet's own z-indexes inside the map, under the overlays.
  mapWrap: { flex: 1, zIndex: 0 },
  map: { flex: 1 },
  headerOverlay: { position: 'absolute', left: 16, right: 16, zIndex: 10 },
  controls: { position: 'absolute', right: 18, gap: 12, zIndex: 10 },
  legend: { position: 'absolute', left: 16, zIndex: 10 },
}));
