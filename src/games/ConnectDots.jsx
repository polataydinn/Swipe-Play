import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { count: 6, time: 15000 }, 1: { count: 10, time: 12000 }, 2: { count: 14, time: 10000 } };
function genDots(count) { return Array.from({ length: count }, (_, i) => ({ num: i + 1, x: 10 + Math.random() * 80, y: 5 + Math.random() * 85 })); }
export default function ConnectDots({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [dots, setDots] = useState([]); const [nextNum, setNextNum] = useState(1);
  const [timeLeft, setTimeLeft] = useState(config.time);
  const intervalRef = useRef(null);
  const newRound = () => { setDots(genDots(config.count)); setNextNum(1); setTimeLeft(config.time); };
  useEffect(() => { newRound(); }, [difficulty]);
  useEffect(() => { intervalRef.current = setInterval(() => { setTimeLeft(t => { if (t <= 100) { onWrong(); newRound(); return config.time; } return t - 100; }); }, 100); return () => clearInterval(intervalRef.current); }, [dots, config.time]);
  const handleTap = (num) => {
    playTap();
    if (num === nextNum) { const n = nextNum + 1; setNextNum(n); if (n > config.count) { onCorrect(); setTimeout(newRound, 500); } }
    else { onWrong(); setNextNum(1); }
  };
  const progress = timeLeft / config.time;
  return (
    <View style={styles.container}>
      <View style={styles.timerBar}><View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: progress > 0.3 ? '#22c55e' : '#ef4444' }]} /></View>
      <Text style={styles.label}>Sırayla noktalara dokun! Sıradaki: {nextNum}</Text>
      <View style={styles.area}>
        {dots.map((d, i) => (
          <TouchableOpacity key={i} style={[styles.dot, { left: `${d.x}%`, top: `${d.y}%` }, d.num < nextNum && styles.dotDone]} onPress={() => handleTap(d.num)} activeOpacity={0.7}>
            <Text style={[styles.dotText, d.num < nextNum && styles.dotTextDone]}>{d.num}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  timerBar: { width: SW - 60, height: 6, backgroundColor: COLORS.surface, borderRadius: 3, marginBottom: 16, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 3 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 12 },
  area: { width: SW - 40, height: 350, backgroundColor: COLORS.surface, borderRadius: 20, position: 'relative' },
  dot: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceLight, justifyContent: 'center', alignItems: 'center', marginLeft: -18, marginTop: -18 },
  dotDone: { backgroundColor: '#22c55e40' },
  dotText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  dotTextDone: { color: '#22c55e' },
});
