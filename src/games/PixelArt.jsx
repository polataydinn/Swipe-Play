import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { size: 4, litCount: 4 }, 1: { size: 5, litCount: 7 }, 2: { size: 6, litCount: 10 } };
export default function PixelArt({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const total = config.size * config.size;
  const [pattern, setPattern] = useState(new Set());
  const [playerGrid, setPlayerGrid] = useState(new Set());
  const newRound = () => {
    const p = new Set();
    while (p.size < config.litCount) p.add(Math.floor(Math.random() * total));
    setPattern(p); setPlayerGrid(new Set());
  };
  useEffect(() => { newRound(); }, [difficulty]);
  const handleTap = (idx) => {
    playTap();
    const g = new Set(playerGrid);
    if (g.has(idx)) g.delete(idx); else g.add(idx);
    setPlayerGrid(g);
  };
  const handleCheck = () => {
    playTap();
    const correct = pattern.size === playerGrid.size && [...pattern].every(p => playerGrid.has(p));
    if (correct) { onCorrect(); } else { onWrong(); }
    setTimeout(newRound, 500);
  };
  const cellSize = Math.floor(((SW - 80) / 2 - (config.size - 1) * 3) / config.size);
  const gridW = config.size * (cellSize + 3);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Deseni kopyala!</Text>
      <View style={styles.grids}>
        <View><Text style={styles.gridLabel}>Örnek</Text><View style={[styles.grid, { width: gridW }]}>{Array.from({ length: total }).map((_, i) => (<View key={i} style={[styles.cell, { width: cellSize, height: cellSize }, pattern.has(i) && styles.lit]} />))}</View></View>
        <View><Text style={styles.gridLabel}>Senin</Text><View style={[styles.grid, { width: gridW }]}>{Array.from({ length: total }).map((_, i) => (<TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }, playerGrid.has(i) && styles.playerLit]} onPress={() => handleTap(i)} activeOpacity={0.7} />))}</View></View>
      </View>
      <TouchableOpacity style={styles.checkBtn} onPress={handleCheck} activeOpacity={0.7}><Text style={styles.checkText}>Kontrol Et</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 16 },
  grids: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  gridLabel: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  cell: { backgroundColor: COLORS.surface, borderRadius: 4, borderWidth: 1, borderColor: COLORS.surfaceLight },
  lit: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  playerLit: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  checkText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
