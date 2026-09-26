// RoomLink — neo-brutalist design tokens, in a light and a dark palette.
// Flat colours, thick ink outlines and hard (zero-blur) offset shadows.
//
// `Colors` always reads the active palette, so anything read while rendering
// follows the theme. Values computed once at module load (StyleSheet.create,
// lookup tables) must be wrapped in themed(), which recomputes them per theme.
// The chosen theme is stored and switched in services/theme.ts.

const light = {
  // Canvas & structure
  bg: '#FFF6E6',
  surface: '#FFFFFF',
  ink: '#111111',
  white: '#FFFFFF',

  // Brand blue from the logo; the only accent that takes white text.
  blue: '#1A3BE8',
  blueSoft: '#DCE3FF',

  // Pop accents — all readable with ink text on top.
  yellow: '#FFD23F',
  yellowSoft: '#FFF0B3',
  pink: '#FF90C8',
  pinkSoft: '#FFE1EF',
  coral: '#FF6B6B',
  coralSoft: '#FFE0E0',
  green: '#3DDC97',
  greenSoft: '#D3F8E5',
  purple: '#A68BFA',
  purpleSoft: '#ECE5FF',
  orange: '#FF9F43',
  orangeSoft: '#FFE8D1',
  cyan: '#5AD2F4',
  cyanSoft: '#D8F5FD',

  // Text
  textPrimary: '#111111',
  textSecondary: '#474747',
  textMuted: '#6E6E6E',

  // Warm tint for focused fields and unread rows; hairline dividers inside lists.
  highlight: '#FFFBEA',
  divider: '#E4DED2',

  // Status: bright fills for badges, darker "Ink" variants for coloured text.
  success: '#3DDC97',
  successInk: '#0B7A48',
  error: '#FF6B6B',
  errorInk: '#C92A2A',
  warning: '#FF9F43',
  warningInk: '#A85600',

  overlay: 'rgba(17,17,17,0.5)',
  // Logo artwork sits on this navy; used behind it so the tile has no seams.
  logoNavy: '#050A1E',
};

export type Palette = typeof light;
export type ThemeMode = 'light' | 'dark';

// Dark keeps every role: "ink" (outlines, hard shadows, text) turns cream, and
// the accent fills deepen so cream text on them still reads (all ≥ 4.5:1).
// Blue lightens instead, because it carries `white` text, which is near-black here.
const dark: Palette = {
  bg: '#131318',
  surface: '#1E1E26',
  ink: '#F4EDE0',
  white: '#131318',

  blue: '#8FA2FF',
  blueSoft: '#232B55',

  yellow: '#7A5C00',
  yellowSoft: '#3A3116',
  pink: '#9C2463',
  pinkSoft: '#3D1F2E',
  coral: '#A83232',
  coralSoft: '#3F2020',
  green: '#13714A',
  greenSoft: '#173529',
  purple: '#5B3FD0',
  purpleSoft: '#2A2452',
  orange: '#9A4A0A',
  orangeSoft: '#3E2A18',
  cyan: '#0F6E86',
  cyanSoft: '#153541',

  textPrimary: '#F4EDE0',
  textSecondary: '#BDB6AA',
  textMuted: '#918B81',

  highlight: '#29251A',
  divider: '#3A3A45',

  success: '#13714A',
  successInk: '#5BE3A6',
  error: '#A83232',
  errorInk: '#FF8A8A',
  warning: '#9A4A0A',
  warningInk: '#FFB36B',

  overlay: 'rgba(0,0,0,0.62)',
  logoNavy: '#050A1E',
};

const palettes: Record<ThemeMode, Palette> = { light, dark };
let mode: ThemeMode = 'light';

export const Colors = {} as Palette;
for (const key of Object.keys(light) as (keyof Palette)[]) {
  Object.defineProperty(Colors, key, { enumerable: true, get: () => palettes[mode][key] });
}

export const getThemeMode = () => mode;
/** Low-level switch; screens should use setThemeMode from services/theme. */
export function applyThemeMode(next: ThemeMode) { mode = next; }

/**
 * A value computed once per theme — a StyleSheet or a lookup table built from
 * Colors. Reads go through a proxy, so `styles.card` comes from the active theme.
 */
export function themed<T extends object>(factory: () => T): T {
  const cache: Partial<Record<ThemeMode, T>> = {};
  const current = (): T => (cache[mode] ??= factory());
  const target = (Array.isArray(current()) ? [] : {}) as T;
  return new Proxy(target, {
    get: (_t, key) => Reflect.get(current(), key),
    has: (_t, key) => Reflect.has(current(), key),
    ownKeys: () => Reflect.ownKeys(current()),
    getOwnPropertyDescriptor: (t, key) => {
      const desc = Reflect.getOwnPropertyDescriptor(current(), key);
      if (!desc) return undefined;
      // Proxy invariant: only the target's own fixed keys (an array's length) stay non-configurable.
      const fixed = Reflect.getOwnPropertyDescriptor(t, key)?.configurable === false;
      return { ...desc, configurable: !fixed };
    },
  });
}

// Loaded in app/_layout.tsx via @expo-google-fonts.
export const Fonts = {
  display: 'ArchivoBlack_400Regular',
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semibold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const BorderRadius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 26, full: 9999 };
export const BorderWidth = { thin: 2, base: 2.5, thick: 3 };
export const FontSize = { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, xxxl: 32, hero: 40 };

export function hardShadow(offset = 4, color: string = Colors.ink): { boxShadow: string } {
  return { boxShadow: `${offset}px ${offset}px 0px ${color}` };
}

export const Shadow = themed(() => ({
  sm: hardShadow(2),
  md: hardShadow(4),
  lg: hardShadow(6),
}));

// Colours that read well behind ink initials (avatars, icon tiles).
export const AccentCycle = themed(() => [
  Colors.yellow, Colors.pink, Colors.cyan, Colors.green,
  Colors.purple, Colors.orange, Colors.coral,
]);

export function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AccentCycle[h % AccentCycle.length];
}
