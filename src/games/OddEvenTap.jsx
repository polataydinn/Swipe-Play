import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { gridSize: 3, spawnInterval: 2000, maxNum: 20 },
  1: { gridSize: 4, spawnInterval: 1500, maxNum: 50 },
  2: { gridSize: 4, spawnInterval: 1000, maxNum: 100 },
};

export default function OddEvenTap({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [targetOdd, setTargetOdd] = useState(true);
  const [numbers, setNumbers] = useState([]);
  const [streak, setStreak] = useState(0);
  const intervalRef = useRef(null);

  const generateNumbers = () => {
    const total = config.gridSize * config.gridSize;
    const nums = [];
    for (let i = 0; i < total; i++) {
      nums.push(Math.floor(Math.random() * config.maxNum) + 1);
    }
    return nums;
  };

  const newRound = () => {
    setTargetOdd(Math.random() > 0.5);
    setNumbers(generateNumbers());
  };

  useEffect(() => { newRound(); setStreak(0); }, [difficulty]);

  useEffect(() => {
    intervalRef.current = setInterval(() => { newRound(); }, config.spawnInterval * config.gridSize);
    return () => clearInterval(intervalRef.current);
  }, [difficulty]);

  const handleTap = (num) => {
    playTap();
    const isOdd = num % 2 !== 0;
    if (isOdd === targetOdd) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    newRound();
  };

  const cellSize = Math.floor((SW - 60 - (config.gridSize - 1) * 8) / config.gridSize);

  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.instruction}>Sadece {targetOdd ? 'TEK' : 'ÇİFT'} sayılara dokun!</Text>
      <View style={[styles.grid, { width: config.gridSize * (cellSize + 8) }]}>
        {numbers.map((num, i) => (
          <TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }]} onPress={() => handleTap(num)} activeOpacity={0.7}>
            <Text style={styles.cellText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 10 },
  instruction: { color: '#f59e0b', fontSize: 20, fontWeight: '700', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  cell: { backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  cellText: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
});
