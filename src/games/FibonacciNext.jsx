import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { showCount: 5 }, 1: { showCount: 4 }, 2: { showCount: 3 } };
function genFib() {
  const a = Math.floor(Math.random() * 5) + 1, b = Math.floor(Math.random() * 5) + 1;
  const seq = [a, b]; for (let i = 2; i < 7; i++) seq.push(seq[i - 1] + seq[i - 2]); return seq;
}
export default function FibonacciNext({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [seq, setSeq] = useState([]); const [options, setOptions] = useState([]); const [streak, setStreak] = useState(0);
  const next = () => {
    const s = genFib(); setSeq(s);
    const answer = s[config.showCount];
    const opts = new Set([answer]);
    while (opts.size < 4) { const v = answer + Math.floor(Math.random() * 20) - 10; if (v > 0) opts.add(v); }
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleAnswer = (val) => { playTap(); if (val === seq[config.showCount]) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); } next(); };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Sıradaki sayı ne?</Text>
      <View style={styles.seqRow}>
        {seq.slice(0, config.showCount).map((n, i) => (<View key={i} style={styles.item}><Text style={styles.itemText}>{n}</Text></View>))}
        <View style={[styles.item, styles.hidden]}><Text style={styles.itemText}>?</Text></View>
      </View>
      <View style={styles.options}>
        {options.map((opt, i) => (<TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(opt)} activeOpacity={0.7}><Text style={styles.btnText}>{opt}</Text></TouchableOpacity>))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 20 },
  seqRow: { flexDirection: 'row', gap: 8, marginBottom: 30 },
  item: { width: 48, height: 48, backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  hidden: { borderColor: '#f59e0b', backgroundColor: '#f59e0b20' },
  itemText: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  btn: { width: (SW - 80) / 2, height: 56, backgroundColor: COLORS.surface, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
});
