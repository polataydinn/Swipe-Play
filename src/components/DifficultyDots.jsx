import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const DOT_SIZE = 8;
const ACTIVE_DOT_SIZE = 12;

export default function DifficultyDots({ difficulty, translateX, screenWidth }) {
  const dots = [0, 1, 2];

  return (
    <View style={styles.container}>
      {dots.map((dotIndex) => (
        <AnimatedDot
          key={dotIndex}
          dotIndex={dotIndex}
          difficulty={difficulty}
          translateX={translateX}
          screenWidth={screenWidth}
        />
      ))}
    </View>
  );
}

function AnimatedDot({ dotIndex, difficulty, translateX, screenWidth }) {
  const animatedStyle = useAnimatedStyle(() => {
    // Current difficulty + fractional offset from swipe
    const fractional = translateX.value / screenWidth;
    const activeDiff = difficulty.value - fractional;

    const distance = Math.abs(activeDiff - dotIndex);
    const scale = interpolate(distance, [0, 1], [1.5, 1], Extrapolation.CLAMP);
    const opacity = interpolate(distance, [0, 1], [1, 0.3], Extrapolation.CLAMP);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#ffffff',
  },
});
