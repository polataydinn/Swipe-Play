import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { size: 3, litCount: 3, showTime: 2000 }, 1: { size: 4, litCount: 5, showTime: 1500 }, 2: { size: 5, litCount: 7, showTime: 1000 } };
export default function MemoryGrid({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const total = config.size * config.size;
  const [lit, setLit] = useState(new Set()); const [phase, setPhase] = useState('show'); const [tapped, setTapped] = useState(new Set());
  const newRound = () => { const l = new Set(); while (l.size < config.litCount) l.add(Math.floor(Math.random() * total)); setLit(l); setTapped(new Set()); setPhase('show'); };
  useEffect(() => { newRound(); }, [difficulty]);
  useEffect(() => { if (phase === 'show') { const t = setTimeout(() => setPhase('input'), config.showTime); return () => clearTimeout(t); } }, [phase]);
  const handleTap = (idx) => {
    playTap();
    if (lit.has(idx)) {
      const t = new Set(tapped); t.add(idx); setTapped(t);
      if (t.size === lit.size) { onCorrect(); setTimeout(newRound, 400); }
    } else { onWrong(); setTimeout(newRound, 400); }
  };
  const cellSize = Math.floor((SW - 60 - (config.size - 1) * 6) / config.size);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{phase === 'show' ? 'Işıklı kareleri ezberle!' : 'Işıklı karelere dokun!'}</Text>
      <View style={[styles.grid, { width: config.size * (cellSize + 6) }]}>
        {Array.from({ length: total }).map((_, i) => {
          const isLit = phase === 'show' ? lit.has(i) : tapped.has(i);
          return (<TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }, isLit && styles.lit]} onPress={() => phase === 'input' && handleTap(i)} activeOpacity={0.7} disabled={phase === 'show' || tapped.has(i)} />);
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  cell: { backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.surfaceLight },
  lit: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
});
