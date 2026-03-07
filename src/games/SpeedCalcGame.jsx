import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const DIFFICULTY_CONFIG = { 0: { time: 5000, max: 10 }, 1: { time: 4000, max: 20 }, 2: { time: 3000, max: 50 } };
export default function SpeedCalcGame({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [op, setOp] = useState('+');
  const [options, setOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(100);
  const [streak, setStreak] = useState(0);
  const timerRef = useRef(null);
  const calc = (a, b, op) => op === '+' ? a + b : op === '-' ? a - b : a * b;
  const next = () => {
    const na = Math.floor(Math.random() * config.max) + 1;
    const nb = Math.floor(Math.random() * config.max) + 1;
    const ops = ['+', '-', '×'];
    const nop = ops[Math.floor(Math.random() * (difficulty === 0 ? 2 : 3))];
    setA(na); setB(nb); setOp(nop); setTimeLeft(100);
    const correct = calc(na, nb, nop);
    const opts = new Set([correct]);
    while (opts.size < 4) opts.add(correct + Math.floor(Math.random() * 20) - 10);
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0) { onWrong(); setStreak(0); next(); return 100; }
        return t - (100 / (config.time / 50));
      });
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [difficulty]);
  const handleAnswer = (ans) => {
    playTap();
    if (ans === calc(a, b, op)) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <View style={[styles.timerBar, { width: `${Math.max(0, timeLeft)}%` }]} />
      <Text style={styles.problem}>{a} {op} {b} = ?</Text>
      <View style={styles.options}>
        {options.map((o, i) => (
          <TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(o)} activeOpacity={0.7}>
            <Text style={styles.btnText}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  timerBar: { height: 6, backgroundColor: '#ef4444', borderRadius: 3, alignSelf: 'stretch', marginBottom: 20 },
  problem: { color: COLORS.text, fontSize: 36, fontWeight: '800', marginBottom: 24 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  btn: { backgroundColor: COLORS.surface, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: COLORS.surfaceLight, minWidth: 80, alignItems: 'center' },
  btnText: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
});
