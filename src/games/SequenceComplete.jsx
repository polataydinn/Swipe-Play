import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { type: 'arith' }, 1: { type: 'mixed' }, 2: { type: 'hard' } };
function genSequence(diff) {
  if (diff === 0) { const start = Math.floor(Math.random() * 10) + 1; const step = Math.floor(Math.random() * 5) + 1; const seq = Array.from({ length: 5 }, (_, i) => start + step * i); return seq; }
  if (diff === 1) { const start = Math.floor(Math.random() * 5) + 1; const ratio = Math.floor(Math.random() * 3) + 2; const seq = Array.from({ length: 5 }, (_, i) => start * Math.pow(ratio, i)); return seq; }
  const a = Math.floor(Math.random() * 5) + 1, b = Math.floor(Math.random() * 5) + 1;
  const seq = [a, b]; for (let i = 2; i < 5; i++) seq.push(seq[i - 1] + seq[i - 2]); return seq;
}
export default function SequenceComplete({ difficulty, onCorrect, onWrong }) {
  const [sequence, setSequence] = useState([]);
  const [hideIdx, setHideIdx] = useState(4);
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const seq = genSequence(difficulty);
    const idx = 2 + Math.floor(Math.random() * 3);
    setSequence(seq); setHideIdx(idx);
    const answer = seq[idx];
    const opts = new Set([answer]);
    while (opts.size < 4) { const off = Math.floor(Math.random() * 10) - 5; const v = answer + (off === 0 ? 1 : off); if (v >= 0) opts.add(v); }
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleAnswer = (val) => { playTap(); if (val === sequence[hideIdx]) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); } next(); };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Sıradaki sayıyı bul!</Text>
      <View style={styles.seqRow}>
        {sequence.map((n, i) => (<View key={i} style={[styles.seqItem, i === hideIdx && styles.hidden]}><Text style={styles.seqText}>{i === hideIdx ? '?' : n}</Text></View>))}
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
  seqItem: { width: 52, height: 52, backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  hidden: { borderColor: '#f59e0b', backgroundColor: '#f59e0b20' },
  seqText: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  btn: { width: (SW - 80) / 2, height: 56, backgroundColor: COLORS.surface, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
});
