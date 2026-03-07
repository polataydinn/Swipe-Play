import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { gridSize: 4, maxFill: 6 }, 1: { gridSize: 5, maxFill: 10 }, 2: { gridSize: 6, maxFill: 15 } };
export default function AreaCalc({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const total = config.gridSize * config.gridSize;
  const [filled, setFilled] = useState(new Set());
  const [userCount, setUserCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const count = Math.floor(Math.random() * (config.maxFill - 3)) + 3;
    const f = new Set();
    const start = Math.floor(Math.random() * total);
    f.add(start);
    while (f.size < count) {
      const arr = [...f];
      const base = arr[Math.floor(Math.random() * arr.length)];
      const r = Math.floor(base / config.gridSize);
      const c = base % config.gridSize;
      const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      const d = dirs[Math.floor(Math.random() * 4)];
      const nr = r + d[0], nc = c + d[1];
      if (nr >= 0 && nr < config.gridSize && nc >= 0 && nc < config.gridSize) {
        f.add(nr * config.gridSize + nc);
      }
    }
    setFilled(f); setUserCount(0);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const cellSize = Math.floor((SW - 80) / config.gridSize) - 4;
  const increment = () => { playTap(); setUserCount(c => c + 1); };
  const decrement = () => { playTap(); setUserCount(c => Math.max(0, c - 1)); };
  const check = () => {
    playTap();
    if (userCount === filled.size) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    setTimeout(next, 500);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Renkli kareleri say!</Text>
      <View style={[styles.grid, { width: config.gridSize * (cellSize + 4) }]}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.cell, { width: cellSize, height: cellSize }, filled.has(i) && styles.filledCell]} />
        ))}
      </View>
      <View style={styles.counter}>
        <TouchableOpacity style={styles.counterBtn} onPress={decrement} activeOpacity={0.7}>
          <Text style={styles.counterBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.counterValue}>{userCount}</Text>
        <TouchableOpacity style={styles.counterBtn} onPress={increment} activeOpacity={0.7}>
          <Text style={styles.counterBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.checkBtn} onPress={check} activeOpacity={0.7}>
        <Text style={styles.checkText}>Gönder</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 24 },
  cell: { backgroundColor: COLORS.surface, borderRadius: 4, borderWidth: 1, borderColor: COLORS.surfaceLight },
  filledCell: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 },
  counterBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  counterBtnText: { color: COLORS.text, fontSize: 28, fontWeight: '700' },
  counterValue: { color: COLORS.text, fontSize: 40, fontWeight: '900', minWidth: 60, textAlign: 'center' },
  checkBtn: { backgroundColor: '#22c55e', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  checkText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
