import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { gridSize: 3, litCount: 3, showTime: 2000 },
  1: { gridSize: 4, litCount: 5, showTime: 1500 },
  2: { gridSize: 5, litCount: 7, showTime: 1000 },
};

export default function PatternCopy({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const total = config.gridSize * config.gridSize;
  const [pattern, setPattern] = useState(new Set());
  const [phase, setPhase] = useState('show');
  const [selected, setSelected] = useState(new Set());

  const newRound = () => {
    const p = new Set();
    while (p.size < config.litCount) p.add(Math.floor(Math.random() * total));
    setPattern(p);
    setSelected(new Set());
    setPhase('show');
  };

  useEffect(() => { newRound(); }, [difficulty]);

  useEffect(() => {
    if (phase === 'show') {
      const t = setTimeout(() => setPhase('input'), config.showTime);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleTap = (idx) => {
    playTap();
    const newSel = new Set(selected);
    if (newSel.has(idx)) newSel.delete(idx); else newSel.add(idx);
    setSelected(newSel);

    if (newSel.size === pattern.size) {
      const correct = [...pattern].every(p => newSel.has(p));
      if (correct) { onCorrect(); } else { onWrong(); }
      setTimeout(newRound, 500);
    }
  };

  const cellSize = Math.floor((SW - 60 - (config.gridSize - 1) * 6) / config.gridSize);

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>{phase === 'show' ? 'Deseni ezberle!' : 'Deseni tekrarla!'}</Text>
      <View style={[styles.grid, { width: config.gridSize * (cellSize + 6) }]}>
        {Array.from({ length: total }).map((_, i) => {
          const isLit = phase === 'show' ? pattern.has(i) : selected.has(i);
          return (
            <TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }, isLit && styles.cellLit]} onPress={() => phase === 'input' && handleTap(i)} activeOpacity={0.7} disabled={phase === 'show'}>
              <Text style={styles.cellText}>{isLit ? '●' : ''}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  instruction: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  cell: { backgroundColor: COLORS.surface, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  cellLit: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  cellText: { color: '#fff', fontSize: 16 },
});
