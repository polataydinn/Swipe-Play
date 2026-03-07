import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { gridSize: 4, maxFill: 5 }, 1: { gridSize: 5, maxFill: 8 }, 2: { gridSize: 6, maxFill: 12 } };
export default function PerimeterCalc({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [filled, setFilled] = useState(new Set());
  const [userCount, setUserCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const count = Math.floor(Math.random() * (config.maxFill - 2)) + 2;
    const f = new Set();
    const start = Math.floor(Math.random() * (config.gridSize * config.gridSize));
    f.add(start);
    while (f.size < count) {
      const arr = [...f];
      const base = arr[Math.floor(Math.random() * arr.length)];
      const r = Math.floor(base / config.gridSize), c = base % config.gridSize;
      const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      const d = dirs[Math.floor(Math.random() * 4)];
      const nr = r+d[0], nc = c+d[1];
      if (nr >= 0 && nr < config.gridSize && nc >= 0 && nc < config.gridSize) f.add(nr * config.gridSize + nc);
    }
    setFilled(f); setUserCount(0);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const calcPerimeter = () => {
    let p = 0;
    filled.forEach(idx => {
      const r = Math.floor(idx / config.gridSize), c = idx % config.gridSize;
      [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr,dc]) => {
        const nr = r+dr, nc = c+dc;
        if (nr < 0 || nr >= config.gridSize || nc < 0 || nc >= config.gridSize || !filled.has(nr * config.gridSize + nc)) p++;
      });
    });
    return p;
  };
  const perimeter = calcPerimeter();
  const cellSize = Math.floor((SW - 80) / config.gridSize) - 4;
  const inc = () => { playTap(); setUserCount(c => c + 1); };
  const dec = () => { playTap(); setUserCount(c => Math.max(0, c - 1)); };
  const check = () => {
    playTap();
    if (userCount === perimeter) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    setTimeout(next, 500);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Şeklin çevresini say (kenar sayısı)</Text>
      <View style={[styles.grid, { width: config.gridSize * (cellSize + 4) }]}>
        {Array.from({ length: config.gridSize * config.gridSize }).map((_, i) => {
          const isFilled = filled.has(i);
          const r = Math.floor(i / config.gridSize), c = i % config.gridSize;
          const borderT = isFilled && (r === 0 || !filled.has((r-1)*config.gridSize+c)) ? 3 : 0;
          const borderB = isFilled && (r === config.gridSize-1 || !filled.has((r+1)*config.gridSize+c)) ? 3 : 0;
          const borderL = isFilled && (c === 0 || !filled.has(r*config.gridSize+c-1)) ? 3 : 0;
          const borderR = isFilled && (c === config.gridSize-1 || !filled.has(r*config.gridSize+c+1)) ? 3 : 0;
          return (
            <View key={i} style={[styles.cell, { width: cellSize, height: cellSize }, isFilled && styles.filledCell, { borderTopWidth: borderT, borderBottomWidth: borderB, borderLeftWidth: borderL, borderRightWidth: borderR, borderColor: isFilled ? '#ef4444' : 'transparent' }]} />
          );
        })}
      </View>
      <View style={styles.counter}>
        <TouchableOpacity style={styles.cBtn} onPress={dec} activeOpacity={0.7}><Text style={styles.cBtnText}>−</Text></TouchableOpacity>
        <Text style={styles.counterVal}>{userCount}</Text>
        <TouchableOpacity style={styles.cBtn} onPress={inc} activeOpacity={0.7}><Text style={styles.cBtnText}>+</Text></TouchableOpacity>
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
  label: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 16, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 20 },
  cell: { backgroundColor: COLORS.surface, borderRadius: 2 },
  filledCell: { backgroundColor: '#3b82f6' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 16 },
  cBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  cBtnText: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  counterVal: { color: COLORS.text, fontSize: 40, fontWeight: '900', minWidth: 50, textAlign: 'center' },
  checkBtn: { backgroundColor: '#22c55e', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  checkText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
