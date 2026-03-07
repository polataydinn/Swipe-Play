import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const BALLOON_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4', '#f97316'];

const DIFFICULTY_CONFIG = {
  0: { count: 5, maxNum: 10 },
  1: { count: 7, maxNum: 20 },
  2: { count: 9, maxNum: 50 },
};

function generateBalloons(config) {
  const nums = new Set();
  while (nums.size < config.count) nums.add(Math.floor(Math.random() * config.maxNum) + 1);
  return [...nums].map((n, i) => ({
    num: n,
    color: BALLOON_COLORS[i % BALLOON_COLORS.length],
    x: 10 + (i % 4) * 22 + Math.random() * 10,
    popped: false,
  }));
}

export default function BalloonPop({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [balloons, setBalloons] = useState([]);
  const [nextIdx, setNextIdx] = useState(0);
  const [sorted, setSorted] = useState([]);

  const newRound = () => {
    const b = generateBalloons(config);
    setBalloons(b);
    setSorted([...b].sort((a, c) => a.num - c.num));
    setNextIdx(0);
  };

  useEffect(() => { newRound(); }, [difficulty]);

  const handlePop = (idx) => {
    playTap();
    if (balloons[idx].num === sorted[nextIdx].num) {
      const newBalloons = [...balloons];
      newBalloons[idx] = { ...newBalloons[idx], popped: true };
      setBalloons(newBalloons);
      const next = nextIdx + 1;
      setNextIdx(next);
      if (next === sorted.length) {
        onCorrect();
        setTimeout(newRound, 500);
      }
    } else {
      onWrong();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>Balonları küçükten büyüğe patlat!</Text>
      <Text style={styles.nextHint}>Sıradaki: {sorted[nextIdx]?.num ?? '✓'}</Text>
      <View style={styles.area}>
        {balloons.map((b, i) => !b.popped && (
          <TouchableOpacity key={i} style={[styles.balloon, { backgroundColor: b.color, left: `${b.x}%`, top: `${(i * 18) % 80}%` }]} onPress={() => handlePop(i)} activeOpacity={0.7}>
            <Text style={styles.balloonText}>{b.num}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  instruction: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 8 },
  nextHint: { color: '#f59e0b', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  area: { width: SW - 40, height: 350, position: 'relative' },
  balloon: { position: 'absolute', width: 56, height: 70, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  balloonText: { color: '#fff', fontSize: 20, fontWeight: '800' },
});
