import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const THERM_H = 220;
const DIFFICULTY_CONFIG = { 0: { tolerance: 5 }, 1: { tolerance: 3 }, 2: { tolerance: 2 } };
export default function TemperatureConvert({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [celsius, setCelsius] = useState(0);
  const [level, setLevel] = useState(0.5);
  const [submitted, setSubmitted] = useState(false);
  const [streak, setStreak] = useState(0);
  const next = () => {
    setCelsius(Math.floor(Math.random() * 101) - 20);
    setLevel(0.5); setSubmitted(false);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const correctF = Math.round(celsius * 9 / 5 + 32);
  const minVal = -40; const maxVal = 250;
  const userVal = Math.round(minVal + level * (maxVal - minVal));
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { onLockSwipe?.(); },
      onPanResponderMove: (_, gs) => { setLevel(l => Math.max(0, Math.min(1, l - gs.dy / THERM_H))); },
      onPanResponderRelease: () => {
        onUnlockSwipe?.();
        playTap(); setSubmitted(true);
        if (Math.abs(userVal - correctF) <= config.tolerance) { onCorrect(); setStreak(s => s + 1); }
        else { onWrong(); setStreak(0); }
        setTimeout(next, 1000);
      },
      onPanResponderTerminate: () => { onUnlockSwipe?.(); },
    })
  ).current;
  const mercuryH = level * THERM_H;
  const col = userVal < 0 ? '#3b82f6' : userVal < 70 ? '#22c55e' : userVal < 150 ? '#f59e0b' : '#ef4444';
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.question}>{celsius}°C = ?°F</Text>
      <View style={styles.thermRow}>
        <View style={styles.thermometer} {...panResponder.panHandlers}>
          <View style={styles.thermBg}>
            <View style={[styles.mercury, { height: mercuryH, backgroundColor: col }]} />
          </View>
          <View style={[styles.thermBulb, { borderColor: col }]}>
            <View style={[styles.bulbFill, { backgroundColor: col }]} />
          </View>
        </View>
        <View style={styles.readout}>
          <Text style={[styles.temp, { color: col }]}>{userVal}°F</Text>
          {submitted && <Text style={styles.correct}>Doğru: {correctF}°F</Text>}
        </View>
      </View>
      <Text style={styles.hint}>Termometreyi yukarı/aşağı kaydır</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  question: { color: COLORS.text, fontSize: 28, fontWeight: '900', marginBottom: 24 },
  thermRow: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 20 },
  thermometer: { alignItems: 'center' },
  thermBg: { width: 24, height: THERM_H, backgroundColor: COLORS.surface, borderRadius: 12, overflow: 'hidden', justifyContent: 'flex-end', borderWidth: 1, borderColor: COLORS.surfaceLight },
  mercury: { width: '100%', borderRadius: 12 },
  thermBulb: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, marginTop: -4, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  bulbFill: { width: 24, height: 24, borderRadius: 12 },
  readout: { alignItems: 'center' },
  temp: { fontSize: 40, fontWeight: '900' },
  correct: { color: COLORS.textSecondary, fontSize: 16, marginTop: 8 },
  hint: { color: COLORS.textMuted, fontSize: 12 },
});
