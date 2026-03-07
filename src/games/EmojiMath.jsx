import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍉', '🍓', '🍌', '🍒'];

const DIFFICULTY_CONFIG = {
  0: { vars: 2, maxVal: 5, time: 15000 },
  1: { vars: 2, maxVal: 10, time: 10000 },
  2: { vars: 3, maxVal: 10, time: 8000 },
};

function generateProblem(config) {
  const emojis = EMOJIS.sort(() => Math.random() - 0.5).slice(0, config.vars);
  const values = emojis.map(() => Math.floor(Math.random() * config.maxVal) + 1);
  const hints = emojis.map((e, i) => `${e} = ${values[i]}`);
  const idx1 = Math.floor(Math.random() * config.vars);
  let idx2 = Math.floor(Math.random() * config.vars);
  const ops = ['+', '-'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let answer;
  let question;
  if (op === '+') {
    answer = values[idx1] + values[idx2];
    question = `${emojis[idx1]} + ${emojis[idx2]} = ?`;
  } else {
    const big = Math.max(idx1, idx2);
    const small = Math.min(idx1, idx2);
    answer = values[big] - values[small];
    question = `${emojis[big]} - ${emojis[small]} = ?`;
  }
  const opts = new Set([answer]);
  while (opts.size < 4) {
    const off = Math.floor(Math.random() * 10) - 5;
    const v = answer + (off === 0 ? 1 : off);
    if (v >= 0) opts.add(v);
  }
  return { hints, question, answer, options: [...opts].sort(() => Math.random() - 0.5) };
}

export default function EmojiMath({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [problem, setProblem] = useState(() => generateProblem(config));
  const [timeLeft, setTimeLeft] = useState(config.time);
  const [streak, setStreak] = useState(0);
  const intervalRef = useRef(null);

  const next = () => { setProblem(generateProblem(config)); setTimeLeft(config.time); };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 100) { onWrong(); setStreak(0); next(); return config.time; } return t - 100; });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [problem, config.time]);

  const handleAnswer = (val) => {
    playTap();
    if (val === problem.answer) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };

  const progress = timeLeft / config.time;

  return (
    <View style={styles.container}>
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: progress > 0.3 ? '#22c55e' : '#ef4444' }]} />
      </View>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <View style={styles.hints}>
        {problem.hints.map((h, i) => <Text key={i} style={styles.hint}>{h}</Text>)}
      </View>
      <Text style={styles.question}>{problem.question}</Text>
      <View style={styles.options}>
        {problem.options.map((opt, i) => (
          <TouchableOpacity key={i} style={styles.optionBtn} onPress={() => handleAnswer(opt)} activeOpacity={0.7}>
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  timerBar: { width: SW - 60, height: 6, backgroundColor: COLORS.surface, borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 3 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  hints: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  hint: { color: COLORS.textSecondary, fontSize: 20, backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  question: { color: COLORS.text, fontSize: 36, fontWeight: '800', marginBottom: 30 },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  optionBtn: { width: (SW - 80) / 2, height: 56, backgroundColor: COLORS.surface, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  optionText: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
});
