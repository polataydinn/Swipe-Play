import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { size: 3, litCount: 3 }, 1: { size: 4, litCount: 5 }, 2: { size: 5, litCount: 7 } };
function mirror(idx, size) { const r = Math.floor(idx / size); const c = idx % size; return r * size + (size - 1 - c); }
export default function MirrorImage({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const total = config.size * config.size;
  const [pattern, setPattern] = useState(new Set()); const [mirrored, setMirrored] = useState(new Set()); const [playerGrid, setPlayerGrid] = useState(new Set());
  const newRound = () => {
    const p = new Set(); while (p.size < config.litCount) p.add(Math.floor(Math.random() * total));
    setPattern(p); const m = new Set([...p].map(i => mirror(i, config.size))); setMirrored(m); setPlayerGrid(new Set());
  };
  useEffect(() => { newRound(); }, [difficulty]);
  const handleTap = (idx) => { playTap(); const g = new Set(playerGrid); if (g.has(idx)) g.delete(idx); else g.add(idx); setPlayerGrid(g); };
  const handleCheck = () => {
    playTap();
    const correct = mirrored.size === playerGrid.size && [...mirrored].every(i => playerGrid.has(i));
    if (correct) { onCorrect(); } else { onWrong(); }
    setTimeout(newRound, 500);
  };
  const cellSize = Math.floor(((SW - 80) / 2 - (config.size - 1) * 3) / config.size);
  const gridW = config.size * (cellSize + 3);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ayna görüntüsünü oluştur!</Text>
      <View style={styles.grids}>
        <View><Text style={styles.gridLabel}>Orijinal</Text><View style={[styles.grid, { width: gridW }]}>{Array.from({ length: total }).map((_, i) => (<View key={i} style={[styles.cell, { width: cellSize, height: cellSize }, pattern.has(i) && styles.lit]} />))}</View></View>
        <Text style={styles.mirror}>🪞</Text>
        <View><Text style={styles.gridLabel}>Ayna</Text><View style={[styles.grid, { width: gridW }]}>{Array.from({ length: total }).map((_, i) => (<TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }, playerGrid.has(i) && styles.playerLit]} onPress={() => handleTap(i)} activeOpacity={0.7} />))}</View></View>
      </View>
      <TouchableOpacity style={styles.checkBtn} onPress={handleCheck} activeOpacity={0.7}><Text style={styles.checkText}>Kontrol Et</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 },
  grids: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  gridLabel: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  cell: { backgroundColor: COLORS.surface, borderRadius: 4, borderWidth: 1, borderColor: COLORS.surfaceLight },
  lit: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  playerLit: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  mirror: { fontSize: 24 },
  checkBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  checkText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
