import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { gridSize: 4, baseColor: '#3b82f6', oddColor: '#ef4444', time: 8000 },
  1: { gridSize: 5, baseColor: '#3b82f6', oddColor: '#6366f1', time: 6000 },
  2: { gridSize: 6, baseColor: '#3b82f6', oddColor: '#4b7cf3', time: 4000 },
};

export default function VisualSearch({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const total = config.gridSize * config.gridSize;
  const [oddIdx, setOddIdx] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.time);
  const intervalRef = useRef(null);

  const next = () => {
    setOddIdx(Math.floor(Math.random() * total));
    setTimeLeft(config.time);
  };

  useEffect(() => { next(); setStreak(0); }, [difficulty]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 100) { onWrong(); setStreak(0); next(); return config.time; } return t - 100; });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [oddIdx, config.time]);

  const handleTap = (i) => {
    playTap();
    if (i === oddIdx) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };

  const cellSize = Math.floor((SW - 60 - (config.gridSize - 1) * 6) / config.gridSize);
  const progress = timeLeft / config.time;

  return (
    <View style={styles.container}>
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: progress > 0.3 ? '#22c55e' : '#ef4444' }]} />
      </View>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.instruction}>Farklı renkteki daireyi bul!</Text>
      <View style={[styles.grid, { width: config.gridSize * (cellSize + 6) }]}>
        {Array.from({ length: total }).map((_, i) => (
          <TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }]} onPress={() => handleTap(i)} activeOpacity={0.7}>
            <View style={[styles.circle, { width: cellSize - 12, height: cellSize - 12, borderRadius: (cellSize - 12) / 2, backgroundColor: i === oddIdx ? config.oddColor : config.baseColor }]} />
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
  instruction: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  cell: { justifyContent: 'center', alignItems: 'center' },
  circle: {},
});
