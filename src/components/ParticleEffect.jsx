import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');
const PARTICLE_COUNT = 20;
const PARTICLE_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

function Particle({ x, y, color, delay, onDone }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 60 + Math.random() * 120;
    const targetX = Math.cos(angle) * distance;
    const targetY = Math.sin(angle) * distance;

    scale.value = withDelay(delay, withTiming(1, { duration: 150 }));
    translateX.value = withDelay(delay, withTiming(targetX, { duration: 600, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withTiming(targetY, { duration: 600, easing: Easing.out(Easing.quad) }));
    opacity.value = withDelay(
      delay + 300,
      withTiming(0, { duration: 300 }, () => {
        if (onDone) runOnJS(onDone)();
      })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const size = 4 + Math.random() * 8;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

export default function ParticleEffect({ trigger, x = SW / 2, y = SH / 2 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (trigger > 0) {
      const newParticles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: Date.now() + i,
        x,
        y,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        delay: Math.random() * 100,
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 1000);
    }
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <Particle key={p.id} x={p.x} y={p.y} color={p.color} delay={p.delay} />
      ))}
    </View>
  );
}
