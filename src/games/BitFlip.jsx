import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { bits: 4 }, 1: { bits: 6 }, 2: { bits: 8 } };
export default function BitFlip({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [target, setTarget] = useState([]);
  const [current, setCurrent] = useState([]);
  const [moves, setMoves] = useState(0);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const t = Array.from({ length: config.bits }, () => Math.random() > 0.5 ? 1 : 0);
    let c;
    do { c = Array.from({ length: config.bits }, () => Math.random() > 0.5 ? 1 : 0); }
    while (c.join('') === t.join(''));
    setTarget(t); setCurrent(c); setMoves(0);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleFlip = (idx) => {
    playTap();
    const nc = [...current]; nc[idx] = nc[idx] === 0 ? 1 : 0;
    setCurrent(nc); setMoves(m => m + 1);
    if (nc.join('') === target.join('')) { onCorrect(); setStreak(s => s + 1); setTimeout(next, 500); }
  };
  const bitSize = Math.min(44, (SW - 80) / config.bits - 4);
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Hedef</Text>
      <View style={styles.bits}>
        {target.map((b, i) => (
          <View key={i} style={[styles.bit, { width: bitSize, height: bitSize }, b === 1 && styles.bitOn]}>
            <Text style={[styles.bitText, b === 1 && styles.bitTextOn]}>{b}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.label}>Mevcut (dokun çevir)</Text>
      <View style={styles.bits}>
        {current.map((b, i) => (
          <TouchableOpacity key={i} style={[styles.bit, { width: bitSize, height: bitSize }, b === 1 && styles.bitOn]} onPress={() => handleFlip(i)} activeOpacity={0.7}>
            <Text style={[styles.bitText, b === 1 && styles.bitTextOn]}>{b}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.moves}>Hamle: {moves}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 8 },
  bits: { flexDirection: 'row', gap: 4, marginBottom: 20 },
  bit: { borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.surfaceLight },
  bitOn: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  bitText: { color: COLORS.textMuted, fontSize: 18, fontWeight: '800' },
  bitTextOn: { color: '#fff' },
  moves: { color: COLORS.textMuted, fontSize: 14 },
});
