import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const BAR_W = SW - 80;
const DIFFICULTY_CONFIG = { 0: { maxBill: 50, tolerance: 3 }, 1: { maxBill: 100, tolerance: 2 }, 2: { maxBill: 200, tolerance: 1 } };
export default function TipCalculator({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [bill, setBill] = useState(50);
  const [targetPct, setTargetPct] = useState(15);
  const [sliderPos, setSliderPos] = useState(0.5);
  const [submitted, setSubmitted] = useState(false);
  const [streak, setStreak] = useState(0);
  const next = () => {
    setBill((Math.floor(Math.random() * (config.maxBill / 5)) + 1) * 5);
    setTargetPct([10, 15, 18, 20, 25][Math.floor(Math.random() * 5)]);
    setSliderPos(0.5); setSubmitted(false);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const correctTip = (bill * targetPct) / 100;
  const maxTip = bill * 0.3;
  const userTip = Math.round(sliderPos * maxTip * 10) / 10;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { onLockSwipe?.(); },
      onPanResponderMove: (_, gs) => { setSliderPos(p => Math.max(0, Math.min(1, p + gs.dx / BAR_W))); },
      onPanResponderRelease: () => {
        onUnlockSwipe?.();
        playTap(); setSubmitted(true);
        if (Math.abs(userTip - correctTip) <= config.tolerance) { onCorrect(); setStreak(s => s + 1); }
        else { onWrong(); setStreak(0); }
        setTimeout(next, 1000);
      },
      onPanResponderTerminate: () => { onUnlockSwipe?.(); },
    })
  ).current;
  const userPct = maxTip > 0 ? Math.round((userTip / bill) * 100) : 0;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.billText}>💰 Hesap: {bill} TL</Text>
      <Text style={styles.question}>%{targetPct} bahşiş = ?</Text>
      <Text style={styles.tipValue}>{userTip} TL</Text>
      <Text style={styles.tipPct}>(%{userPct})</Text>
      <View style={styles.sliderContainer} {...panResponder.panHandlers}>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${sliderPos * 100}%` }]} />
        </View>
        <View style={[styles.thumb, { left: sliderPos * BAR_W - 14 }]}>
          <View style={styles.thumbCircle} />
        </View>
      </View>
      <Text style={styles.hint}>Kaydırarak bahşişi ayarla</Text>
      {submitted && <Text style={styles.answer}>Doğru: {correctTip} TL</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  billText: { color: COLORS.text, fontSize: 24, fontWeight: '700', marginBottom: 4 },
  question: { color: '#22c55e', fontSize: 20, fontWeight: '800', marginBottom: 16 },
  tipValue: { color: COLORS.text, fontSize: 48, fontWeight: '900' },
  tipPct: { color: COLORS.textMuted, fontSize: 16, marginBottom: 20 },
  sliderContainer: { width: BAR_W, height: 40, justifyContent: 'center', marginBottom: 16 },
  sliderTrack: { width: BAR_W, height: 12, backgroundColor: COLORS.surface, borderRadius: 6, overflow: 'hidden' },
  sliderFill: { height: 12, backgroundColor: '#22c55e', borderRadius: 6 },
  thumb: { position: 'absolute', width: 28, height: 28 },
  thumbCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#22c55e', borderWidth: 3, borderColor: '#fff' },
  hint: { color: COLORS.textMuted, fontSize: 12, marginBottom: 8 },
  answer: { color: COLORS.textSecondary, fontSize: 16 },
});
