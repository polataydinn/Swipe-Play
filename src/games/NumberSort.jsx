import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { COLORS } from '../constants/colors';
import { playTap, playTick } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { count: 5, maxNum: 20, time: 15000 },
  1: { count: 7, maxNum: 50, time: 12000 },
  2: { count: 9, maxNum: 100, time: 8000 },
};

function generateNumbers(count, maxNum) {
  const nums = new Set();
  while (nums.size < count) {
    nums.add(Math.floor(Math.random() * maxNum) + 1);
  }
  return [...nums];
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function NumberSort({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [numbers, setNumbers] = useState([]);
  const [sorted, setSorted] = useState([]);
  const [nextIdx, setNextIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.time);
  const [round, setRound] = useState(0);
  const intervalRef = useRef(null);

  const initRound = useCallback(() => {
    const nums = generateNumbers(config.count, config.maxNum);
    setNumbers(shuffleArray(nums));
    setSorted([...nums].sort((a, b) => a - b));
    setNextIdx(0);
    setTimeLeft(config.time);
  }, [config]);

  useEffect(() => {
    initRound();
    setRound(0);
  }, [difficulty]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 100) {
          onWrong();
          initRound();
          return config.time;
        }
        return t - 100;
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [round, config.time, difficulty]);

  const handlePress = (num) => {
    playTap();
    if (num === sorted[nextIdx]) {
      const newIdx = nextIdx + 1;
      setNextIdx(newIdx);
      if (newIdx === sorted.length) {
        onCorrect();
        setRound((r) => r + 1);
        setTimeout(() => initRound(), 500);
      }
    } else {
      onWrong();
      setNextIdx(0);
    }
  };

  const progress = timeLeft / config.time;
  const btnSize = Math.min(70, (SW - 60 - (Math.min(5, config.count) - 1) * 8) / Math.min(5, config.count));

  return (
    <View style={styles.container}>
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: progress > 0.3 ? '#22c55e' : '#ef4444' }]} />
      </View>
      <Text style={styles.instruction}>Küçükten büyüğe dokun</Text>
      <View style={styles.progressRow}>
        {sorted.map((num, i) => (
          <View key={i} style={[styles.progressSlot, i < nextIdx && styles.progressDone]}>
            <Text style={styles.progressText}>{i < nextIdx ? num : '?'}</Text>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {numbers.map((num, i) => {
          const tapped = sorted.indexOf(num) < nextIdx;
          return (
            <TouchableOpacity
              key={`${num}-${i}`}
              style={[styles.numBtn, { width: btnSize, height: btnSize }, tapped && styles.numDone]}
              onPress={() => handlePress(num)}
              disabled={tapped}
              activeOpacity={0.7}
            >
              <Text style={[styles.numText, tapped && styles.numTextDone]}>{num}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  timerBar: { width: SW - 60, height: 6, backgroundColor: COLORS.surface, borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 3 },
  instruction: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 20 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 30, flexWrap: 'wrap', justifyContent: 'center' },
  progressSlot: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.surfaceLight,
  },
  progressDone: { borderColor: '#22c55e', backgroundColor: '#22c55e20' },
  progressText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  numBtn: {
    borderRadius: 14, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
  },
  numDone: { backgroundColor: COLORS.surface, opacity: 0.3 },
  numText: { color: COLORS.text, fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  numTextDone: { color: COLORS.textMuted },
});
