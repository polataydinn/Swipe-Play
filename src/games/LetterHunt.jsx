import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const LETTERS = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';

const DIFFICULTY_CONFIG = {
  0: { gridSize: 4, time: 10000 },
  1: { gridSize: 5, time: 7000 },
  2: { gridSize: 6, time: 4000 },
};

export default function LetterHunt({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const total = config.gridSize * config.gridSize;
  const [grid, setGrid] = useState([]);
  const [target, setTarget] = useState('');
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.time);
  const intervalRef = useRef(null);

  const newRound = () => {
    const t = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    setTarget(t);
    const g = [];
    const targetPos = Math.floor(Math.random() * total);
    for (let i = 0; i < total; i++) {
      if (i === targetPos) { g.push(t); }
      else {
        let l = t;
        while (l === t) l = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        g.push(l);
      }
    }
    setGrid(g);
    setTimeLeft(config.time);
  };

  useEffect(() => { newRound(); setStreak(0); }, [difficulty]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 100) { onWrong(); setStreak(0); newRound(); return config.time; } return t - 100; });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [grid, config.time]);

  const handleTap = (i) => {
    playTap();
    if (grid[i] === target) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    newRound();
  };

  const cellSize = Math.floor((SW - 60 - (config.gridSize - 1) * 6) / config.gridSize);
  const progress = timeLeft / config.time;

  return (
    <View style={styles.container}>
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: progress > 0.3 ? '#22c55e' : '#ef4444' }]} />
      </View>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.targetLabel}>Bul: <Text style={styles.targetChar}>{target}</Text></Text>
      <View style={[styles.grid, { width: config.gridSize * (cellSize + 6) }]}>
        {grid.map((l, i) => (
          <TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }]} onPress={() => handleTap(i)} activeOpacity={0.7}>
            <Text style={styles.cellText}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  timerBar: { width: SW - 60, height: 6, backgroundColor: COLORS.surface, borderRadius: 3, marginBottom: 16, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 3 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 8 },
  targetLabel: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 16 },
  targetChar: { color: '#f59e0b', fontSize: 24, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  cell: { backgroundColor: COLORS.surface, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  cellText: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
});
