// Flaticon UIcons ("Uicons by Flaticon"), rendered from the subset fonts built
// by scripts/build-icons.js. Add a name to constants/icons.json, then run
// `npm run icons`.
import { Platform, StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import names from '../../constants/icons.json';
import glyphs from '../../constants/iconGlyphs.json';
import { Colors } from '../../constants/Colors';

export type IconName = keyof typeof names;
export type IconVariant = 'bold' | 'solid';

// Font aliases registered in app/_layout.tsx.
export const IconFonts = {
  bold: 'UIconsBold',
  solid: 'UIconsSolid',
  brands: 'UIconsBrands',
};

const TARGETS = names as Record<string, string>;
const BOLD = glyphs.bold as Record<string, number>;
const SOLID = glyphs.solid as Record<string, number>;
const BRANDS = glyphs.brands as Record<string, number>;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  variant?: IconVariant;
  style?: StyleProp<TextStyle>;
}

/** The character and font for an icon, for drawing it outside <Icon> (e.g. web map pins). */
export function iconGlyph(name: IconName, variant: IconVariant = 'bold'): { char: string; fontFamily: string } {
  const target = TARGETS[name];
  let fontFamily = IconFonts.bold;
  let code = BOLD[target];
  if (target.startsWith('brands:')) {
    fontFamily = IconFonts.brands;
    code = BRANDS[target.slice('brands:'.length)];
  } else if (variant === 'solid' && SOLID[target]) {
    fontFamily = IconFonts.solid;
    code = SOLID[target];
  }
  return { char: code ? String.fromCodePoint(code) : '', fontFamily };
}

export function Icon({ name, size = 20, color = Colors.ink, variant = 'bold', style }: IconProps) {
  const { char, fontFamily } = iconGlyph(name, variant);
  return (
    <Text
      allowFontScaling={false}
      accessible={false}
      style={[styles.icon, { fontFamily, fontSize: size, lineHeight: size, width: size, height: size, color }, style]}
    >
      {char}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
    includeFontPadding: false,
    ...Platform.select({ android: { textAlignVertical: 'center' as const }, default: {} }),
  },
});
