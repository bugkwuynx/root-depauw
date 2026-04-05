import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// ─────────────────────────────────────────────────────────────────────────────
// SetupTaskItem  (editing phase — X to remove, V to lock in)
// ─────────────────────────────────────────────────────────────────────────────

interface SetupTaskItemProps {
  title: string;
  emoji: string;
  subtitle?: string;
  coinBonus?: number;
  isFixed: boolean;
  onFix: () => void;
  onDelete: () => void;
}

export function SetupTaskItem({
  title,
  emoji,
  subtitle,
  coinBonus,
  isFixed,
  onFix,
  onDelete,
}: SetupTaskItemProps) {
  const cardOpacity = useSharedValue(1);
  const cardTranslateX = useSharedValue(0);
  const buttonsOpacity = useSharedValue(1);
  const buttonsScale = useSharedValue(1);
  const checkScale = useSharedValue(1);
  const crossScale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateX: cardTranslateX.value }],
  }));
  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ scale: buttonsScale.value }],
  }));
  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));
  const crossAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: crossScale.value }],
  }));

  // Use setTimeout instead of animation callbacks — guarantees JS-thread execution
  // regardless of Reanimated's worklet/new-arch threading model.
  const handleFix = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    buttonsOpacity.value = withTiming(0, { duration: 180 });
    buttonsScale.value = withTiming(0.3, { duration: 180, easing: Easing.in(Easing.quad) });
    setTimeout(onFix, 210);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cardOpacity.value = withTiming(0, { duration: 230 });
    cardTranslateX.value = withTiming(-70, { duration: 230 });
    setTimeout(onDelete, 250);
  };

  return (
    <Animated.View style={[styles.card, isFixed && styles.cardFixed, cardStyle]}>
      {/* Left: emoji + text */}
      <View style={styles.left}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {coinBonus != null ? (
            <View style={styles.coinBadge}>
              <Text style={styles.coinText}>+{coinBonus} 🪙</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Right: X/V buttons (hidden once fixed) */}
      {!isFixed && (
        <Animated.View style={[styles.buttons, buttonsStyle]}>
          {/* X — delete */}
          <Pressable
            onPressIn={() => {
              crossScale.value = withTiming(0.8, { duration: 80, easing: Easing.out(Easing.quad) });
            }}
            onPressOut={() => {
              crossScale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) });
            }}
            onPress={handleDelete}
            hitSlop={8}
          >
            <Animated.View style={[styles.btn, styles.crossBtn, crossAnimStyle]}>
              <Text style={styles.crossText}>✕</Text>
            </Animated.View>
          </Pressable>

          {/* V — lock in */}
          <Pressable
            onPressIn={() => {
              checkScale.value = withTiming(0.8, { duration: 80, easing: Easing.out(Easing.quad) });
            }}
            onPressOut={() => {
              checkScale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) });
            }}
            onPress={handleFix}
            hitSlop={8}
          >
            <Animated.View style={[styles.btn, styles.checkBtn, checkAnimStyle]}>
              <Text style={styles.checkText}>✓</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrackingTaskItem  (tracking phase — dotted circle to mark complete)
// ─────────────────────────────────────────────────────────────────────────────

interface TrackingTaskItemProps {
  title: string;
  emoji: string;
  subtitle?: string;
  completed: boolean;
  onToggleComplete: () => void;
}

export function TrackingTaskItem({
  title,
  emoji,
  subtitle,
  completed,
  onToggleComplete,
}: TrackingTaskItemProps) {
  // progress: 0 = empty circle, 1 = filled circle with ✓
  const progress = useSharedValue(completed ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(completed ? 1 : 0, { duration: 220, easing: Easing.out(Easing.quad) });
  }, [completed]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }],
    opacity: progress.value,
  }));

  // Animated.Text can be unstable with new arch — wrap Text in Animated.View instead
  const checkWrapStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleComplete();
  };

  return (
    <View style={[styles.card, completed && styles.cardCompleted]}>
      {/* Left: emoji + text */}
      <View style={styles.left}>
        <Text style={[styles.emoji, completed && { opacity: 0.4 }]}>{emoji}</Text>
        <View style={styles.textWrap}>
          <Text
            style={[styles.title, completed && styles.titleCompleted]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {/* Right: dotted completion circle */}
      <Pressable onPress={handleToggle} hitSlop={12}>
        <View style={styles.circleWrapper}>
          {/* Static dashed ring */}
          <View style={[styles.circleRing, completed && styles.circleRingDone]} />
          {/* Animated green fill (scale + fade) */}
          <Animated.View style={[styles.circleFill, fillStyle]} />
          {/* Checkmark — in Animated.View to avoid Animated.Text issues */}
          <Animated.View style={[styles.circleCheckWrap, checkWrapStyle]}>
            <Text style={styles.circleCheckText}>✓</Text>
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#5FAD89',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardFixed: {
    borderLeftWidth: 3,
    borderLeftColor: '#5FAD89',
  },
  cardCompleted: {
    backgroundColor: '#FAFFFE',
  },

  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  emoji: { fontSize: 24 },
  textWrap: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D5A3D',
    lineHeight: 20,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#A0BFA8',
  },
  subtitle: {
    fontSize: 12,
    color: '#83BF99',
    marginTop: 2,
  },

  coinBadge: {
    marginTop: 5,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  coinText: { fontSize: 11, color: '#92710A', fontWeight: '700' },

  // Setup buttons
  buttons: { flexDirection: 'row', gap: 6 },
  btn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossBtn: {
    backgroundColor: '#FEF0F0',
    borderWidth: 1.5,
    borderColor: '#F9C8C8',
  },
  crossText: { fontSize: 14, color: '#E07070', fontWeight: '700' },
  checkBtn: {
    backgroundColor: '#E1F0E3',
    borderWidth: 1.5,
    borderColor: '#83BF99',
  },
  checkText: { fontSize: 18, color: '#5FAD89', fontWeight: '700' },

  // Tracking completion circle
  circleWrapper: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#83BF99',
  },
  circleRingDone: {
    borderColor: '#5FAD89',
    borderStyle: 'solid',
  },
  circleFill: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#5FAD89',
  },
  circleCheckWrap: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleCheckText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '800',
    lineHeight: 18,
  },
});
