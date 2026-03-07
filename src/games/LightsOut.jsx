import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { size: 3 }, 1: { size: 4 }, 2: { size: 5 } };
function genBoard(size) {
  const board = Array(size * size).fill(false);
  const presses = 3 + Math.floor(Math.random() * 3);
  for (let p = 0; p < presses; p++) {
    const idx = Math.floor(Math.random() * size * size);
    toggle(board, idx, size);
  }
  if (board.every(v => !v)) return genBoard(size);
  return board;
}
function toggle(board, idx, size) {
  board[idx] = !board[idx];
  const r = Math.floor(idx / size), c = idx % size;
  if (r > 0) board[idx - size] = !board[idx - size];
  if (r < size - 1) board[idx + size] = !board[idx + size];
  if (c > 0) board[idx - 1] = !board[idx - 1];
  if (c < size - 1) board[idx + 1] = !board[idx + 1];
}
export default function LightsOut({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [board, setBoard] = useState([]);
  const [moves, setMoves] = useState(0);
  const newGame = () => { setBoard(genBoard(config.size)); setMoves(0); };
  useEffect(() => { newGame(); }, [difficulty]);
  const handlePress = (idx) => {
    playTap();
    const b = [...board];
    toggle(b, idx, config.size);
    setBoard(b);
    setMoves(m => m + 1);
    if (b.every(v => !v)) { onCorrect(); setTimeout(newGame, 500); }
  };
  const cellSize = Math.floor((SW - 60 - (config.size - 1) * 6) / config.size);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tüm ışıkları kapat!</Text>
      <Text style={styles.moves}>Hamle: {moves}</Text>
      <View style={[styles.grid, { width: config.size * (cellSize + 6) }]}>
        {board.map((on, i) => (
          <TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }, on && styles.cellOn]} onPress={() => handlePress(i)} activeOpacity={0.7}>
            <Text style={styles.cellText}>{on ? '💡' : ''}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 8 },
  moves: { color: COLORS.textMuted, fontSize: 14, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  cell: { backgroundColor: COLORS.surface, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  cellOn: { backgroundColor: '#fbbf24', borderColor: '#fbbf24' },
  cellText: { fontSize: 20 },
});
