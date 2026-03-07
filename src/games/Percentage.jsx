import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const BAR_W = SW - 80;
const DIFFICULTY_CONFIG = { 0: { max: 100, tolerance: 8 }, 1: { max: 200, tolerance: 5 }, 2: { max: 500, tolerance: 3 } };
export default function Percentage({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [num, setNum] = useState(100);
  const [pct, setPct] = useState(50);
  const [sliderX, setSliderX] = useState(BAR_W / 2);
  const [submitted, setSubmitted] = useState(false);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const n = (Math.floor(Math.random() * (config.max / 10)) + 1) * 10;
    const p = (Math.floor(Math.random() * 9) + 1) * 10;
    setNum(n); setPct(p); setSliderX(BAR_W / 2); setSubmitted(false);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const answer = (num * pct) / 100;
  const userAnswer = Math.round((sliderX / BAR_W) * num);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { onLockSwipe?.(); },
      onPanResponderMove: (_, gs) => {
        setSliderX(x => Math.max(0, Math.min(BAR_W, x + gs.dx)));
      },
      onPanResponderRelease: () => {
        onUnlockSwipe?.();
        playTap(); setSubmitted(true);
        const tolerance = num * (config.tolerance / 100);
        const ua = Math.round((sliderX / BAR_W) * num);
        if (Math.abs(ua - answer) <= tolerance) { onCorrect(); setStreak(s => s + 1); }
        else { onWrong(); setStreak(0); }
        setTimeout(next, 800);
      },
      onPanResponderTerminate: () => { onUnlockSwipe?.(); },
    })
  ).current;
  const fillPct = (sliderX / BAR_W) * 100;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.question}>{num} sayısının %{pct} kadarı?</Text>
      <Text style={styles.value}>{userAnswer}</Text>
      <View style={styles.barContainer}>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${fillPct}%` }]} />
        </View>
        <View style={[styles.thumb, { left: sliderX - 14 }]} {...panResponder.panHandlers}>
          <View style={styles.thumbCircle} />
        </View>
      </View>
      <Text style={styles.hint}>Kaydırarak ayarla, bırakınca gönderilir</Text>
      {submitted && <Text style={styles.answer}>Doğru: {answer}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  question: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  value: { color: '#3b82f6', fontSize: 48, fontWeight: '900', marginBottom: 24 },
  barContainer: { width: BAR_W, height: 40, justifyContent: 'center', marginBottom: 16 },
  barBg: { width: BAR_W, height: 12, backgroundColor: COLORS.surface, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: 12, backgroundColor: '#3b82f6', borderRadius: 6 },
  thumb: { position: 'absolute', width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  thumbCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#3b82f6', borderWidth: 3, borderColor: '#fff' },
  hint: { color: COLORS.textMuted, fontSize: 12, marginBottom: 8 },
  answer: { color: COLORS.textSecondary, fontSize: 16, marginTop: 4 },
});
