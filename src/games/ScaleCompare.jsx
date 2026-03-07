import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const ITEMS = [
  { emoji: '🍎', weight: 2 }, { emoji: '🍊', weight: 3 }, { emoji: '🍉', weight: 8 },
  { emoji: '🍇', weight: 1 }, { emoji: '🍌', weight: 2 }, { emoji: '🥝', weight: 1 },
  { emoji: '🍑', weight: 3 }, { emoji: '🍒', weight: 1 }, { emoji: '🥭', weight: 4 },
  { emoji: '🍍', weight: 6 }, { emoji: '🥥', weight: 5 }, { emoji: '🍋', weight: 2 },
];
const DIFFICULTY_CONFIG = { 0: { leftCount: 1, rightCount: 1 }, 1: { leftCount: 2, rightCount: 2 }, 2: { leftCount: 3, rightCount: 3 } };
function pickItems(count) { const items = []; for (let i = 0; i < count; i++) items.push(ITEMS[Math.floor(Math.random() * ITEMS.length)]); return items; }
export default function ScaleCompare({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [left, setLeft] = useState([]); const [right, setRight] = useState([]); const [streak, setStreak] = useState(0);
  const next = () => { setLeft(pickItems(config.leftCount)); setRight(pickItems(config.rightCount)); };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const leftW = left.reduce((s, i) => s + i.weight, 0);
  const rightW = right.reduce((s, i) => s + i.weight, 0);
  const handleAnswer = (ans) => {
    playTap();
    const correct = leftW > rightW ? 'left' : leftW < rightW ? 'right' : 'equal';
    if (ans === correct) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Hangi taraf daha ağır?</Text>
      <View style={styles.scale}>
        <TouchableOpacity style={styles.side} onPress={() => handleAnswer('left')} activeOpacity={0.7}>
          <Text style={styles.items}>{left.map(i => i.emoji).join(' ')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.eqBtn} onPress={() => handleAnswer('equal')} activeOpacity={0.7}><Text style={styles.eqText}>⚖️</Text></TouchableOpacity>
        <TouchableOpacity style={styles.side} onPress={() => handleAnswer('right')} activeOpacity={0.7}>
          <Text style={styles.items}>{right.map(i => i.emoji).join(' ')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 24 },
  scale: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  side: { flex: 1, height: 120, backgroundColor: COLORS.surface, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight, padding: 8 },
  items: { fontSize: 32, textAlign: 'center' },
  eqBtn: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  eqText: { fontSize: 32 },
});
