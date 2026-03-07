import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const BASIC_COLORS = [
  { name: 'Kırmızı', hex: '#ef4444', rgb: [239, 68, 68] },
  { name: 'Mavi', hex: '#3b82f6', rgb: [59, 130, 246] },
  { name: 'Sarı', hex: '#eab308', rgb: [234, 179, 8] },
  { name: 'Yeşil', hex: '#22c55e', rgb: [34, 197, 94] },
  { name: 'Mor', hex: '#8b5cf6', rgb: [139, 92, 246] },
  { name: 'Turuncu', hex: '#f97316', rgb: [249, 115, 22] },
];
const MIXES = [
  { a: 'Kırmızı', b: 'Mavi', result: 'Mor' }, { a: 'Kırmızı', b: 'Sarı', result: 'Turuncu' },
  { a: 'Mavi', b: 'Sarı', result: 'Yeşil' },
];
const DIFFICULTY_CONFIG = { 0: { pool: 3 }, 1: { pool: 4 }, 2: { pool: 6 } };
export default function ColorBlend({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [mix, setMix] = useState(null);
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const m = MIXES[Math.floor(Math.random() * MIXES.length)];
    setMix(m);
    const opts = new Set([m.result]);
    const pool = BASIC_COLORS.slice(0, config.pool).map(c => c.name);
    while (opts.size < 4) opts.add(pool[Math.floor(Math.random() * pool.length)]);
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleAnswer = (ans) => {
    playTap();
    if (ans === mix.result) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };
  const getHex = (name) => BASIC_COLORS.find(c => c.name === name)?.hex || '#888';
  if (!mix) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Bu iki rengi karıştırınca ne olur?</Text>
      <View style={styles.mixRow}>
        <View style={[styles.colorCircle, { backgroundColor: getHex(mix.a) }]} />
        <Text style={styles.plus}>+</Text>
        <View style={[styles.colorCircle, { backgroundColor: getHex(mix.b) }]} />
        <Text style={styles.plus}>=</Text>
        <Text style={styles.question}>?</Text>
      </View>
      <View style={styles.options}>
        {options.map((o, i) => (
          <TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(o)} activeOpacity={0.7}>
            <View style={[styles.optColor, { backgroundColor: getHex(o) }]} />
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
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 20 },
  mixRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  colorCircle: { width: 50, height: 50, borderRadius: 25 },
  plus: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
  question: { color: COLORS.textMuted, fontSize: 36, fontWeight: '800' },
  options: { gap: 10 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surface, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.surfaceLight, minWidth: 180 },
  optColor: { width: 24, height: 24, borderRadius: 12 },
  btnText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
});
