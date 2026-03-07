import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { maxBase: 5, maxExp: 2 }, 1: { maxBase: 10, maxExp: 3 }, 2: { maxBase: 12, maxExp: 3 } };
export default function PowerCalc({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [base, setBase] = useState(2);
  const [exp, setExp] = useState(2);
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const b = Math.floor(Math.random() * (config.maxBase - 1)) + 2;
    const e = Math.floor(Math.random() * config.maxExp) + 2;
    const answer = Math.pow(b, e);
    setBase(b); setExp(e);
    const opts = new Set([answer]);
    while (opts.size < 4) { const off = Math.floor(Math.random() * answer) - answer / 2; const v = answer + Math.floor(off === 0 ? answer * 0.1 : off); if (v > 0) opts.add(v); }
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleAnswer = (val) => { playTap(); if (val === Math.pow(base, exp)) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); } next(); };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Üslü ifadeyi hesapla</Text>
      <View style={styles.exprRow}><Text style={styles.base}>{base}</Text><Text style={styles.exp}>{exp}</Text></View>
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
  exprRow: { flexDirection: 'row', marginBottom: 30 },
  base: { color: COLORS.text, fontSize: 64, fontWeight: '800' },
  exp: { color: '#f59e0b', fontSize: 32, fontWeight: '800', marginTop: -10 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  btn: { width: (SW - 80) / 2, height: 56, backgroundColor: COLORS.surface, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
});
