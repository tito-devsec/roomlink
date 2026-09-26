import { createContext, useContext } from 'react';
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { Colors, Fonts, themed } from '../../constants/Colors';

const WEIGHT_FAMILY: Record<string, string> = {
  ultralight: Fonts.regular, thin: Fonts.regular, light: Fonts.regular,
  normal: Fonts.regular, regular: Fonts.regular,
  '100': Fonts.regular, '200': Fonts.regular, '300': Fonts.regular, '400': Fonts.regular,
  medium: Fonts.medium, '500': Fonts.medium,
  semibold: Fonts.semibold, '600': Fonts.semibold,
  bold: Fonts.bold, heavy: Fonts.bold, black: Fonts.bold,
  '700': Fonts.bold, '800': Fonts.bold, '900': Fonts.bold,
};

// Nested <Text> inherits its parent's family unless it asks for a weight.
const InsideText = createContext(false);

export function Text({ style, ...rest }: TextProps) {
  const nested = useContext(InsideText);
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;

  let family = flat.fontFamily;
  if (!family && (flat.fontWeight != null || !nested)) {
    family = WEIGHT_FAMILY[String(flat.fontWeight ?? 'normal')] ?? Fonts.regular;
  }

  return (
    <InsideText.Provider value>
      <RNText
        {...rest}
        style={[!nested && styles.base, style, family ? { fontFamily: family, fontWeight: 'normal' } : null]}
      />
    </InsideText.Provider>
  );
}

const styles = themed(() => StyleSheet.create({
  base: { color: Colors.ink },
}));
