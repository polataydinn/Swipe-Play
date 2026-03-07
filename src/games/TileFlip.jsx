import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { size: 3, litCount: 3, showTime: 2500 }, 1: { size: 4, litCount: 5, showTime: 2000 }, 2: { size: 4, litCount: 7, showTime: 1500 } };
export default function TileFlip({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const total = config.size * config.size;
  const [pattern, setPattern] = useState(new Set());
  const [phase, setPhase] = useState('show');
  const [flipped, setFlipped] = useState(new Set());
  const newRound = () => {
    const p = new Set();
    while (p.size < config.litCount) p.add(Math.floor(Math.random() * total));
    setPattern(p); setFlipped(new Set()); setPhase('show');
  };
  useEffect(() => { newRound(); }, [difficulty]);
  useEffect(() => { if (phase === 'show') { const t = setTimeout(() => setPhase('input'), config.showTime); return () => clearTimeout(t); } }, [phase]);
  const handleTap = (idx) => {
    playTap();
    const f = new Set(flipped);
    if (f.has(idx)) f.delete(idx); else f.add(idx);
    setFlipped(f);
    if (f.size === pattern.size) {
      const correct = [...pattern].every(p => f.has(p));
      if (correct) { onCorrect(); } else { onWrong(); }
      setTimeout(newRound, 500);
    }
  };
  const cellSize = Math.floor((SW - 60 - (config.size - 1) * 6) / config.size);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{phase === 'show' ? 'Deseni ezberle!' : 'Aynı kareleri aç!'}</Text>
      <View style={[styles.grid, { width: config.size * (cellSize + 6) }]}>
        {Array.from({ length: total }).map((_, i) => {
          const isLit = phase === 'show' ? pattern.has(i) : flipped.has(i);
          return (
            <TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }, isLit && styles.lit]} onPress={() => phase === 'input' && handleTap(i)} activeOpacity={0.7} disabled={phase === 'show'}>
              <Text style={styles.cellText}>{isLit ? '✦' : ''}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  cell: { backgroundColor: COLORS.surface, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  lit: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  cellText: { color: '#fff', fontSize: 18 },
});
