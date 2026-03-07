import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { count: 4 }, 1: { count: 5 }, 2: { count: 6 } };
const BAR_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
export default function BubbleSortGame({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [arr, setArr] = useState([]);
  const [swaps, setSwaps] = useState(0);
  const newGame = () => {
    let a;
    do { a = Array.from({ length: config.count }, (_, i) => i + 1).sort(() => Math.random() - 0.5); }
    while (a.every((v, i) => v === i + 1));
    setArr(a); setSwaps(0);
  };
  useEffect(() => { newGame(); }, [difficulty]);
  const handleSwap = (i) => {
    if (i >= arr.length - 1) return;
    playTap();
    const na = [...arr]; [na[i], na[i + 1]] = [na[i + 1], na[i]];
    setArr(na); setSwaps(s => s + 1);
    if (na.every((v, idx) => v === idx + 1)) { onCorrect(); setTimeout(newGame, 800); }
  };
  const barW = Math.min(50, (SW - 60) / config.count - 8);
  const maxH = 140;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Küçükten büyüğe sırala</Text>
      <Text style={styles.swaps}>Takas: {swaps}</Text>
      <View style={styles.bars}>
        {arr.map((v, i) => (
          <TouchableOpacity key={i} style={styles.barCol} onPress={() => handleSwap(i)} activeOpacity={0.7}>
            <View style={[styles.bar, { height: (v / config.count) * maxH, width: barW, backgroundColor: BAR_COLORS[v - 1] }]} />
            <Text style={styles.barLabel}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.hint}>Değiştirmek için çubuğa dokun (sağdaki ile)</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 8 },
  swaps: { color: COLORS.textMuted, fontSize: 14, marginBottom: 16 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 16, height: 180 },
  barCol: { alignItems: 'center', justifyContent: 'flex-end' },
  bar: { borderRadius: 8 },
  barLabel: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginTop: 6 },
  hint: { color: COLORS.textMuted, fontSize: 12 },
});
