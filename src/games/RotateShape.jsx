import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const SIZE = 3;
const TOTAL = SIZE * SIZE;
function rotateGrid90(grid) {
  const out = Array(TOTAL).fill(false);
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) out[c * SIZE + (SIZE - 1 - r)] = grid[r * SIZE + c];
  return out;
}
function gridKey(g) { return g.map(v => v ? '1' : '0').join(''); }
const DIFFICULTY_CONFIG = { 0: { rotations: 1 }, 1: { rotations: 2 }, 2: { rotations: 3 } };
export default function RotateShape({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [original, setOriginal] = useState([]); const [answer, setAnswer] = useState([]); const [options, setOptions] = useState([]); const [streak, setStreak] = useState(0);
  const next = () => {
    let grid = Array(TOTAL).fill(false);
    const litCount = 3 + Math.floor(Math.random() * 2);
    const indices = new Set(); while (indices.size < litCount) indices.add(Math.floor(Math.random() * TOTAL));
    indices.forEach(i => { grid[i] = true; });
    setOriginal(grid);
    let rotated = grid;
    for (let i = 0; i < config.rotations; i++) rotated = rotateGrid90(rotated);
    setAnswer(rotated);
    const opts = [gridKey(rotated)];
    for (let r = 1; r <= 3; r++) { let g = grid; for (let i = 0; i < r; i++) g = rotateGrid90(g); const k = gridKey(g); if (!opts.includes(k)) opts.push(k); }
    while (opts.length < 4) { let g = Array(TOTAL).fill(false); const s = new Set(); while (s.size < litCount) s.add(Math.floor(Math.random() * TOTAL)); s.forEach(i => { g[i] = true; }); const k = gridKey(g); if (!opts.includes(k)) opts.push(k); }
    setOptions(opts.sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleAnswer = (key) => { playTap(); if (key === gridKey(answer)) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); } next(); };
  const renderGrid = (grid, cellSize) => (
    <View style={[styles.grid, { width: SIZE * (cellSize + 2) }]}>{grid.map((v, i) => (<View key={i} style={[styles.cell, { width: cellSize, height: cellSize }, v && styles.lit]} />))}</View>
  );
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>{config.rotations * 90}° döndürülmüş hali hangisi?</Text>
      {renderGrid(original, 28)}
      <Text style={styles.arrow}>↻ {config.rotations * 90}°</Text>
      <View style={styles.optionsRow}>
        {options.map((key, i) => {
          const g = key.split('').map(v => v === '1');
          return (<TouchableOpacity key={i} style={styles.optBox} onPress={() => handleAnswer(key)} activeOpacity={0.7}>{renderGrid(g, 18)}</TouchableOpacity>);
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  cell: { backgroundColor: COLORS.surface, borderRadius: 3, borderWidth: 1, borderColor: COLORS.surfaceLight },
  lit: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  arrow: { color: '#f59e0b', fontSize: 24, fontWeight: '800', marginVertical: 16 },
  optionsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  optBox: { padding: 8, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.surfaceLight },
});
