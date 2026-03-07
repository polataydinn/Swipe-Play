import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const DIFFICULTY_CONFIG = { 0: { max: 15, bases: [2] }, 1: { max: 31, bases: [2, 8] }, 2: { max: 63, bases: [2, 8, 16] } };
export default function BaseConvert({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [num, setNum] = useState(0);
  const [base, setBase] = useState(2);
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const n = Math.floor(Math.random() * config.max) + 2;
    const b = config.bases[Math.floor(Math.random() * config.bases.length)];
    setNum(n); setBase(b);
    const correct = n.toString(b).toUpperCase();
    const opts = new Set([correct]);
    while (opts.size < 4) {
      const fake = (n + Math.floor(Math.random() * 10) - 5);
      if (fake > 0) opts.add(fake.toString(b).toUpperCase());
      else opts.add((n + Math.floor(Math.random() * 5) + 1).toString(b).toUpperCase());
    }
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const baseLabel = base === 2 ? 'İkilik' : base === 8 ? 'Sekizlik' : 'Onaltılık';
  const handleAnswer = (ans) => {
    playTap();
    if (ans === num.toString(base).toUpperCase()) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>{num} sayısının {baseLabel} karşılığı?</Text>
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
  label: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 24, textAlign: 'center' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  btn: { backgroundColor: COLORS.surface, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.surfaceLight, minWidth: 100, alignItems: 'center' },
  btnText: { color: COLORS.text, fontSize: 18, fontWeight: '700', fontFamily: 'monospace' },
});
