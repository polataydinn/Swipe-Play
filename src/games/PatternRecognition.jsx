import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const SHAPES = ['●', '■', '▲', '◆', '★'];
const PATTERN_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];
const DIFFICULTY_CONFIG = { 0: { patternLen: 2, showLen: 4 }, 1: { patternLen: 3, showLen: 6 }, 2: { patternLen: 3, showLen: 6 } };
export default function PatternRecognition({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [sequence, setSequence] = useState([]); const [answer, setAnswer] = useState(''); const [options, setOptions] = useState([]); const [streak, setStreak] = useState(0);
  const next = () => {
    const pattern = Array.from({ length: config.patternLen }, () => SHAPES[Math.floor(Math.random() * SHAPES.length)]);
    const shown = []; for (let i = 0; i < config.showLen; i++) shown.push(pattern[i % pattern.length]);
    const ans = pattern[config.showLen % pattern.length];
    setSequence(shown); setAnswer(ans);
    const opts = new Set([ans]); while (opts.size < 4) opts.add(SHAPES[Math.floor(Math.random() * SHAPES.length)]);
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleAnswer = (val) => { playTap(); if (val === answer) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); } next(); };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Sıradaki ne?</Text>
      <View style={styles.seqRow}>{sequence.map((s, i) => (<View key={i} style={styles.item}><Text style={styles.itemText}>{s}</Text></View>))}<View style={[styles.item, styles.hidden]}><Text style={styles.itemText}>?</Text></View></View>
      <View style={styles.opts}>{options.map((opt, i) => (<TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(opt)} activeOpacity={0.7}><Text style={styles.btnText}>{opt}</Text></TouchableOpacity>))}</View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 20 },
  seqRow: { flexDirection: 'row', gap: 8, marginBottom: 30, flexWrap: 'wrap', justifyContent: 'center' },
  item: { width: 44, height: 44, backgroundColor: COLORS.surface, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  hidden: { borderWidth: 2, borderColor: '#f59e0b' },
  itemText: { fontSize: 22 },
  opts: { flexDirection: 'row', gap: 16 },
  btn: { width: 64, height: 64, backgroundColor: COLORS.surface, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { fontSize: 28 },
});
