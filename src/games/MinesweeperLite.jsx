import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { size: 4, mines: 3 }, 1: { size: 5, mines: 5 }, 2: { size: 6, mines: 8 } };
export default function MinesweeperLite({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const total = config.size * config.size;
  const [mineSet, setMineSet] = useState(new Set());
  const [revealed, setRevealed] = useState(new Set());
  const [gameOver, setGameOver] = useState(false);
  const newGame = () => {
    const m = new Set();
    while (m.size < config.mines) m.add(Math.floor(Math.random() * total));
    setMineSet(m); setRevealed(new Set()); setGameOver(false);
  };
  useEffect(() => { newGame(); }, [difficulty]);
  const neighbors = (idx) => {
    const r = Math.floor(idx / config.size), c = idx % config.size, n = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < config.size && nc >= 0 && nc < config.size) n.push(nr * config.size + nc);
    }
    return n;
  };
  const countMines = (idx) => neighbors(idx).filter(n => mineSet.has(n)).length;
  const handleTap = (idx) => {
    if (gameOver || revealed.has(idx)) return;
    playTap();
    if (mineSet.has(idx)) { setGameOver(true); setRevealed(new Set(Array.from({ length: total }, (_, i) => i))); onWrong(); setTimeout(newGame, 1000); return; }
    const newR = new Set(revealed); newR.add(idx);
    if (countMines(idx) === 0) {
      const queue = [idx];
      while (queue.length) { const cur = queue.shift(); neighbors(cur).forEach(n => { if (!newR.has(n) && !mineSet.has(n)) { newR.add(n); if (countMines(n) === 0) queue.push(n); } }); }
    }
    setRevealed(newR);
    if (newR.size === total - config.mines) { onCorrect(); setTimeout(newGame, 800); }
  };
  const cellSize = Math.floor((SW - 60) / config.size) - 4;
  const NUM_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#6b7280'];
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Mayınlardan kaçın!</Text>
      <View style={[styles.grid, { width: config.size * (cellSize + 4) }]}>
        {Array.from({ length: total }).map((_, i) => {
          const isRevealed = revealed.has(i);
          const isMine = mineSet.has(i);
          const count = countMines(i);
          return (
            <TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }, isRevealed && styles.revealedCell]} onPress={() => handleTap(i)} activeOpacity={0.7}>
              {isRevealed && isMine ? <Text style={styles.mine}>💣</Text> : isRevealed && count > 0 ? <Text style={[styles.num, { color: NUM_COLORS[count - 1] }]}>{count}</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { backgroundColor: COLORS.surface, borderRadius: 6, borderWidth: 1, borderColor: COLORS.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  revealedCell: { backgroundColor: COLORS.background, borderColor: COLORS.surfaceLight },
  mine: { fontSize: 20 },
  num: { fontSize: 18, fontWeight: '800' },
});
