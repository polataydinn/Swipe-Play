import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const BAR_W = SW - 100;
const DIFFICULTY_CONFIG = { 0: { tolerance: 40 }, 1: { tolerance: 25 }, 2: { tolerance: 15 } };
export default function HexColor({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [targetR, setTargetR] = useState(128);
  const [targetG, setTargetG] = useState(128);
  const [targetB, setTargetB] = useState(128);
  const [r, setR] = useState(128);
  const [g, setG] = useState(128);
  const [b, setB] = useState(128);
  const [streak, setStreak] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const next = () => {
    setTargetR(Math.floor(Math.random() * 256));
    setTargetG(Math.floor(Math.random() * 256));
    setTargetB(Math.floor(Math.random() * 256));
    setR(128); setG(128); setB(128); setSubmitted(false);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const toHex = (v) => v.toString(16).padStart(2, '0');
  const targetHex = `#${toHex(targetR)}${toHex(targetG)}${toHex(targetB)}`;
  const userHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  const check = () => {
    playTap(); setSubmitted(true);
    const dist = Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB);
    if (dist <= config.tolerance * 3) { onCorrect(); setStreak(s => s + 1); }
    else { onWrong(); setStreak(0); }
    setTimeout(next, 1000);
  };
  const SliderRow = ({ label, value, setValue, color }) => {
    const pan = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => { onLockSwipe?.(); },
        onPanResponderMove: (_, gs) => { setValue(v => Math.max(0, Math.min(255, v + Math.round(gs.dx)))); },
        onPanResponderRelease: () => { onUnlockSwipe?.(); },
        onPanResponderTerminate: () => { onUnlockSwipe?.(); },
      })
    ).current;
    return (
      <View style={styles.sliderRow}>
        <Text style={[styles.sliderLabel, { color }]}>{label}</Text>
        <View style={styles.sliderTrack} {...pan.panHandlers}>
          <View style={[styles.sliderFill, { width: `${(value / 255) * 100}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.sliderVal}>{value}</Text>
      </View>
    );
  };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Bu rengi RGB ile karıştır!</Text>
      <View style={styles.colorRow}>
        <View style={styles.colorCol}>
          <View style={[styles.colorBox, { backgroundColor: targetHex }]} />
          <Text style={styles.colorLabel}>Hedef</Text>
        </View>
        <View style={styles.colorCol}>
          <View style={[styles.colorBox, { backgroundColor: userHex }]} />
          <Text style={styles.colorLabel}>Senin</Text>
        </View>
      </View>
      <SliderRow label="R" value={r} setValue={setR} color="#ef4444" />
      <SliderRow label="G" value={g} setValue={setG} color="#22c55e" />
      <SliderRow label="B" value={b} setValue={setB} color="#3b82f6" />
      {!submitted && (
        <View style={styles.checkBtn} onTouchEnd={check}>
          <Text style={styles.checkText}>Karşılaştır</Text>
        </View>
      )}
      {submitted && <Text style={styles.result}>Hedef: {targetHex.toUpperCase()}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 },
  colorRow: { flexDirection: 'row', gap: 20, marginBottom: 24 },
  colorCol: { alignItems: 'center' },
  colorBox: { width: 80, height: 80, borderRadius: 16, borderWidth: 2, borderColor: COLORS.surfaceLight },
  colorLabel: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, width: SW - 60 },
  sliderLabel: { fontSize: 18, fontWeight: '800', width: 24 },
  sliderTrack: { flex: 1, height: 24, backgroundColor: COLORS.surface, borderRadius: 12, overflow: 'hidden' },
  sliderFill: { height: '100%', borderRadius: 12 },
  sliderVal: { color: COLORS.textMuted, fontSize: 14, width: 32, textAlign: 'right' },
  checkBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 16 },
  checkText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  result: { color: COLORS.textSecondary, fontSize: 14, marginTop: 12, fontFamily: 'monospace' },
});
