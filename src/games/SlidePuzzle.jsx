import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { size: 3, shuffles: 20 }, 1: { size: 3, shuffles: 50 }, 2: { size: 4, shuffles: 60 } };
function initBoard(size) { const b = []; for (let i = 1; i < size * size; i++) b.push(i); b.push(0); return b; }
function shuffleBoard(board, size, n) {
  const b = [...board];
  for (let i = 0; i < n; i++) {
    const empty = b.indexOf(0);
    const r = Math.floor(empty / size), c = empty % size;
    const neighbors = [];
    if (r > 0) neighbors.push(empty - size);
    if (r < size - 1) neighbors.push(empty + size);
    if (c > 0) neighbors.push(empty - 1);
    if (c < size - 1) neighbors.push(empty + 1);
    const swap = neighbors[Math.floor(Math.random() * neighbors.length)];
    [b[empty], b[swap]] = [b[swap], b[empty]];
  }
  return b;
}
function isSolved(board, size) { for (let i = 0; i < size * size - 1; i++) { if (board[i] !== i + 1) return false; } return board[size * size - 1] === 0; }
export default function SlidePuzzle({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [board, setBoard] = useState([]); const [moves, setMoves] = useState(0);
  const newGame = () => { setBoard(shuffleBoard(initBoard(config.size), config.size, config.shuffles)); setMoves(0); };
  useEffect(() => { newGame(); }, [difficulty]);
  const handlePress = (idx) => {
    const empty = board.indexOf(0);
    const r = Math.floor(idx / config.size), c = idx % config.size;
    const er = Math.floor(empty / config.size), ec = empty % config.size;
    if ((Math.abs(r - er) + Math.abs(c - ec)) !== 1) return;
    playTap();
    const b = [...board]; [b[idx], b[empty]] = [b[empty], b[idx]]; setBoard(b); setMoves(m => m + 1);
    if (isSolved(b, config.size)) { onCorrect(); setTimeout(newGame, 500); }
  };
  const cellSize = Math.floor((SW - 60 - (config.size - 1) * 4) / config.size);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sayıları sıraya diz!</Text>
      <Text style={styles.moves}>Hamle: {moves}</Text>
      <View style={[styles.grid, { width: config.size * (cellSize + 4) }]}>
        {board.map((v, i) => (
          <TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }, v === 0 && styles.empty]} onPress={() => handlePress(i)} activeOpacity={0.7} disabled={v === 0}>
            <Text style={styles.cellText}>{v || ''}</Text>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  cell: { backgroundColor: COLORS.surfaceLight, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  empty: { backgroundColor: COLORS.surface },
  cellText: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
});
