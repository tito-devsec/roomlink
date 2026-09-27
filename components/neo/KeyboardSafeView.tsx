// Keeps text inputs above the on-screen keyboard. Android apps now draw
// edge-to-edge, so the window no longer shrinks for the keyboard there — the
// padding has to be applied on Android as well as iOS. Use it as the root of a
// screen (or around a bottom input bar); React Native measures it against its
// parent, so a nested one under a header still lines up with the keyboard.
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, type KeyboardAvoidingViewProps } from 'react-native';

export function KeyboardSafeView(props: KeyboardAvoidingViewProps) {
  return <KeyboardAvoidingView behavior="padding" {...props} />;
}

/**
 * Whether the keyboard is open. Bottom bars use it to drop their safe-area
 * padding while typing: the keyboard already covers the navigation bar.
 */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subs = [
      Keyboard.addListener(show, () => setVisible(true)),
      Keyboard.addListener(hide, () => setVisible(false)),
    ];
    return () => subs.forEach(s => s.remove());
  }, []);
  return visible;
}
