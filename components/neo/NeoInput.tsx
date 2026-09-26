import { forwardRef, useState, type ReactNode } from 'react';
import {
  Platform, StyleSheet, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { Icon, type IconName } from './Icon';
import { BorderRadius, BorderWidth, Colors, Fonts, hardShadow, themed } from '../../constants/Colors';
import { Text } from './Text';

export interface NeoInputProps extends TextInputProps {
  label?: string;
  icon?: IconName;
  left?: ReactNode;
  right?: ReactNode;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  fieldStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

// Browsers draw their own focus ring; the field's focus state replaces it.
const webReset = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

export const NeoInput = forwardRef<TextInput, NeoInputProps>(function NeoInput(
  { label, icon, left, right, error, hint, containerStyle, fieldStyle, inputStyle, multiline, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          multiline && styles.fieldMulti,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
          hardShadow(focused ? 4 : 3),
          fieldStyle,
        ]}
      >
        {icon ? (
          <Icon name={icon} size={18} color={focused ? Colors.blue : Colors.ink} style={multiline ? styles.iconTop : null} />
        ) : null}
        {left}
        <TextInput
          ref={ref}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.blue}
          cursorColor={Colors.ink}
          {...rest}
          multiline={multiline}
          onFocus={e => { setFocused(true); onFocus?.(e); }}
          onBlur={e => { setFocused(false); onBlur?.(e); }}
          style={[styles.input, multiline && styles.inputMulti, webReset, inputStyle]}
        />
        {right}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

const styles = themed(() => StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: Colors.ink, marginBottom: 8, letterSpacing: 0.2 },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    minHeight: 52, paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderWidth: BorderWidth.base, borderColor: Colors.ink, borderRadius: BorderRadius.md,
  },
  fieldMulti: { alignItems: 'flex-start', paddingTop: 12, minHeight: 100 },
  fieldFocused: { backgroundColor: Colors.highlight },
  fieldError: { backgroundColor: Colors.coralSoft },
  iconTop: { marginTop: 1 },
  input: {
    flex: 1, color: Colors.ink, fontFamily: Fonts.medium, fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  inputMulti: { textAlignVertical: 'top', paddingTop: 0, minHeight: 76 },
  error: { color: Colors.errorInk, fontSize: 12, fontWeight: '700', marginTop: 8 },
  hint: { color: Colors.textMuted, fontSize: 12, marginTop: 8 },
}));
