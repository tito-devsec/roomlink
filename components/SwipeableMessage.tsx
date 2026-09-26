// SwipeableMessage — swipe a bubble to the right to reply, WhatsApp-style.
// Adapted from the gesture pattern in the whatsapp-clone (ChatMessageBox), but
// rebuilt for RoomLink's custom bubble renderer.

import React, { useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Icon } from './neo/Icon';
import { BorderWidth, Colors, themed } from '../constants/Colors';
import { haptic } from './neo';

interface Props {
  onReply: () => void;
  isOwn?: boolean;
  children: React.ReactNode;
}

export default function SwipeableMessage({ onReply, children }: Props) {
  const rowRef = useRef<Swipeable>(null);

  const renderAction = (progress: any) => {
    const scale = progress.interpolate({ inputRange: [0, 1, 100], outputRange: [0, 1, 1] });
    const translateX = progress.interpolate({ inputRange: [0, 1, 2], outputRange: [-8, 8, 16] });
    return (
      <Animated.View style={[styles.action, { transform: [{ scale }, { translateX }] }]}>
        <View style={styles.iconCircle}>
          <Icon name="arrow-undo" size={16} color={Colors.ink} />
        </View>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={rowRef}
      friction={2}
      leftThreshold={36}
      renderLeftActions={renderAction}
      onSwipeableWillOpen={() => {
        haptic('selection');
        onReply();
        // snap back so it behaves like a trigger, not a persistent open state
        requestAnimationFrame(() => rowRef.current?.close());
      }}
    >
      {children}
    </Swipeable>
  );
}

const styles = themed(() => StyleSheet.create({
  action: { width: 48, justifyContent: 'center', alignItems: 'center' },
  iconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center',
    borderWidth: BorderWidth.thin, borderColor: Colors.ink,
  },
}));
