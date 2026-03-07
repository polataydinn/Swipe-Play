import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { gridSize: 3, sets: [['🍎','🍊'], ['🐱','🐶'], ['⭐','🌙'], ['🔵','🔴'], ['🌸','🌻']] },
  1: { gridSize: 4, sets: [['😀','😃'], ['🟢','🟩'], ['🔶','🔷'], ['🐻','🐼'], ['🍇','🫐']] },
  2: { gridSize: 5, sets: [['😊','😄'], ['🟠','🟡'], ['◼️','◻️'], ['🌲','🌳'], ['👋','🤚']] },
};

function generateGrid(config) {
  const set = config.sets[Math.floor(Math.random() * config.sets.length)];
  const total = config.gridSize * config.gridSize;
  const oddIdx = Math.floor(Math.random() * total);
  const grid = [];
  for (let i = 0; i < total; i++) {
    grid.push({ emoji: i === oddIdx ? set[1] : set[0], isOdd: i === oddIdx });
  }
  return grid;
}

export default function OddOneOut({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [grid, setGrid] = useState([]);
  const [round, setRound] = useState(0);

  useEffect(() => {
    setGrid(generateGrid(config));
  }, [difficulty, round]);

  const handlePress = (item) => {
    playTap();
    if (item.isOdd) {
      onCorrect();
      setTimeout(() => setRound(r => r + 1), 400);
    } else {
      onWrong();
    }
  };

  const cellSize = Math.floor((SW - 60 - (config.gridSize - 1) * 8) / config.gridSize);

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>Farklı olanı bul!</Text>
      <View style={[styles.grid, { width: config.gridSize * (cellSize + 8) }]}>
        {grid.map((item, i) => (
          <TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }]} onPress={() => handlePress(item)} activeOpacity={0.7}>
            <Text style={{ fontSize: cellSize * 0.5 }}>{item.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  instruction: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  cell: { backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
});
