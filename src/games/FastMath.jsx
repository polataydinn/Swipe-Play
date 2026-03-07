import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useAnimatedProps } from 'react-native-reanimated';
import { COLORS } from '../constants/colors';
import { playTap, playTick } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { time: 10000, maxNum: 20, ops: ['+', '-'] },
  1: { time: 7000, maxNum: 50, ops: ['+', '-', '×'] },
  2: { time: 4000, maxNum: 100, ops: ['+', '-', '×', '÷'] },
};

function generateProblem(config) {
  const op = config.ops[Math.floor(Math.random() * config.ops.length)];
  let a, b, answer;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * config.maxNum) + 1;
      b = Math.floor(Math.random() * config.maxNum) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * config.maxNum) + 1;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      answer = a * b;
      break;
    case '÷':
      b = Math.floor(Math.random() * 12) + 2;
      answer = Math.floor(Math.random() * 12) + 2;
      a = b * answer;
      break;
    default:
      a = 1; b = 1; answer = 2;
  }

  // Generate wrong options
  const options = new Set([answer]);
  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 20) - 10;
    const wrong = answer + (offset === 0 ? 1 : offset);
    if (wrong >= 0) options.add(wrong);
  }

  return {
    question: `${a} ${op} ${b}`,
    answer,
    options: [...options].sort(() => Math.random() - 0.5),
  };
}

export default function FastMath({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [problem, setProblem] = useState(() => generateProblem(config));
  const [timeLeft, setTimeLeft] = useState(config.time);
  const [streak, setStreak] = useState(0);
  const intervalRef = useRef(null);

  const newProblem = useCallback(() => {
    setProblem(generateProblem(config));
    setTimeLeft(config.time);
  }, [config]);

  useEffect(() => {
    newProblem();
  }, [difficulty]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 100) {
          onWrong();
          setStreak(0);
          return config.time;
        }
        return t - 100;
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [problem, config.time]);

  const handleAnswer = (val) => {
    playTap();
    if (val === problem.answer) {
      onCorrect();
      setStreak((s) => s + 1);
    } else {
      onWrong();
      setStreak(0);
    }
    newProblem();
  };

  const progress = timeLeft / config.time;

  return (
    <View style={styles.container}>
      <View style={styles.timerBar}>
        <View
          style={[
            styles.timerFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: progress > 0.3 ? '#22c55e' : '#ef4444',
            },
          ]}
        />
      </View>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.question}>{problem.question}</Text>
      <Text style={styles.equals}>=?</Text>
      <View style={styles.options}>
        {problem.options.map((opt, i) => (
          <TouchableOpacity
            key={`${opt}-${i}`}
            style={styles.optionBtn}
            onPress={() => handleAnswer(opt)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  timerBar: { width: SW - 60, height: 6, backgroundColor: COLORS.surface, borderRadius: 3, marginBottom: 30, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 3 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 10 },
  question: { color: COLORS.text, fontSize: 48, fontWeight: '800', fontVariant: ['tabular-nums'] },
  equals: { color: COLORS.textSecondary, fontSize: 32, marginVertical: 20 },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  optionBtn: {
    width: (SW - 80) / 2,
    height: 60,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  optionText: { color: COLORS.text, fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
