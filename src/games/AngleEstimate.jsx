import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { angles: [30,45,60,90], tolerance: 10 }, 1: { angles: [15,30,45,60,75,90,120,135], tolerance: 7 }, 2: { angles: [15,30,45,60,75,90,105,120,135,150,165], tolerance: 5 } };
const BOX_SIZE = 160;
const CENTER = BOX_SIZE / 2;
export default function AngleEstimate({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [targetAngle, setTargetAngle] = useState(90);
  const [userAngle, setUserAngle] = useState(45);
  const [submitted, setSubmitted] = useState(false);
  const [streak, setStreak] = useState(0);
  const next = () => {
    setTargetAngle(config.angles[Math.floor(Math.random() * config.angles.length)]);
    setUserAngle(45); setSubmitted(false);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { onLockSwipe?.(); },
      onPanResponderMove: (_, gs) => {
        setUserAngle(a => Math.max(0, Math.min(360, a - gs.dy * 0.5 + gs.dx * 0.5)));
      },
      onPanResponderRelease: () => {
        onUnlockSwipe?.();
        playTap(); setSubmitted(true);
        const rounded = Math.round(userAngle);
        if (Math.abs(rounded - targetAngle) <= config.tolerance) { onCorrect(); setStreak(s => s + 1); }
        else { onWrong(); setStreak(0); }
        setTimeout(next, 1000);
      },
      onPanResponderTerminate: () => { onUnlockSwipe?.(); },
    })
  ).current;
  const rad = (userAngle * Math.PI) / 180;
  const lineLen = 60;
  const endX = CENTER + lineLen * Math.cos(-rad);
  const endY = CENTER + lineLen * Math.sin(-rad);
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Hedef: {targetAngle}°</Text>
      <Text style={styles.userAngle}>{Math.round(userAngle)}°</Text>
      <View style={styles.angleBox} {...panResponder.panHandlers}>
        <View style={[styles.fixedLine, { width: lineLen, left: CENTER, top: CENTER - 1.5 }]} />
        <View style={[styles.moveLine, {
          width: lineLen,
          left: CENTER,
          top: CENTER - 1.5,
          transform: [{ rotate: `-${userAngle}deg` }],
          transformOrigin: 'left center',
        }]} />
        <View style={[styles.dot, { left: CENTER - 5, top: CENTER - 5 }]} />
        {/* Angle arc hint */}
        <View style={[styles.arcHint, {
          left: CENTER - 20, top: CENTER - 20,
          borderTopColor: Math.abs(Math.round(userAngle) - targetAngle) <= config.tolerance ? '#22c55e' : '#3b82f6',
        }]} />
      </View>
      <Text style={styles.hint}>Kolu döndürmek için kaydır</Text>
      {submitted && <Text style={styles.answer}>Doğru: {targetAngle}°</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 4 },
  userAngle: { color: '#3b82f6', fontSize: 48, fontWeight: '900', marginBottom: 16 },
  angleBox: { width: BOX_SIZE, height: BOX_SIZE, backgroundColor: COLORS.surface, borderRadius: 20, position: 'relative', marginBottom: 20, borderWidth: 1, borderColor: COLORS.surfaceLight },
  fixedLine: { position: 'absolute', height: 3, backgroundColor: COLORS.textMuted, borderRadius: 2 },
  moveLine: { position: 'absolute', height: 3, backgroundColor: '#3b82f6', borderRadius: 2 },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#f59e0b' },
  arcHint: { position: 'absolute', width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent', borderTopWidth: 2 },
  hint: { color: COLORS.textMuted, fontSize: 12, marginBottom: 8 },
  answer: { color: COLORS.textSecondary, fontSize: 16 },
});
