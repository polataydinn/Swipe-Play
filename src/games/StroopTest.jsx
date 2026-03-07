import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const COLOR_LIST = [
  { name: 'Kırmızı', code: '#ef4444' },
  { name: 'Mavi', code: '#3b82f6' },
  { name: 'Yeşil', code: '#22c55e' },
  { name: 'Sarı', code: '#eab308' },
  { name: 'Mor', code: '#a855f7' },
  { name: 'Turuncu', code: '#f97316' },
];

const DIFFICULTY_CONFIG = {
  0: { time: 8000, optionCount: 3 },
  1: { time: 5000, optionCount: 4 },
  2: { time: 3000, optionCount: 6 },
};

function generateRound(config) {
  const wordIdx = Math.floor(Math.random() * COLOR_LIST.length);
  let colorIdx = wordIdx;
  while (colorIdx === wordIdx) colorIdx = Math.floor(Math.random() * COLOR_LIST.length);
  const correctColor = COLOR_LIST[colorIdx];
  const options = new Set([colorIdx]);
  while (options.size < Math.min(config.optionCount, COLOR_LIST.length)) {
    options.add(Math.floor(Math.random() * COLOR_LIST.length));
  }
  return {
    word: COLOR_LIST[wordIdx].name,
    displayColor: correctColor.code,
    correctIdx: colorIdx,
    options: [...options].sort(() => Math.random() - 0.5),
  };
}

export default function StroopTest({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [round, setRound] = useState(() => generateRound(config));
  const [timeLeft, setTimeLeft] = useState(config.time);
  const [streak, setStreak] = useState(0);
  const intervalRef = useRef(null);

  const nextRound = () => {
    setRound(generateRound(config));
    setTimeLeft(config.time);
  };

  useEffect(() => { nextRound(); setStreak(0); }, [difficulty]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 100) { onWrong(); setStreak(0); nextRound(); return config.time; }
        return t - 100;
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [round, config.time]);

  const handleAnswer = (idx) => {
    playTap();
    if (idx === round.correctIdx) {
      onCorrect();
      setStreak(s => s + 1);
    } else {
      onWrong();
      setStreak(0);
    }
    nextRound();
  };

  const progress = timeLeft / config.time;

  return (
    <View style={styles.container}>
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: progress > 0.3 ? '#22c55e' : '#ef4444' }]} />
      </View>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.hint}>Yazının RENGİNE dokun!</Text>
      <Text style={[styles.word, { color: round.displayColor }]}>{round.word}</Text>
      <View style={styles.options}>
        {round.options.map((idx, i) => (
          <TouchableOpacity key={i} style={[styles.optionBtn, { borderColor: COLOR_LIST[idx].code }]} onPress={() => handleAnswer(idx)} activeOpacity={0.7}>
            <View style={[styles.colorDot, { backgroundColor: COLOR_LIST[idx].code }]} />
            <Text style={styles.optionText}>{COLOR_LIST[idx].name}</Text>
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
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 8 },
  hint: { color: COLORS.textMuted, fontSize: 14, marginBottom: 16 },
  word: { fontSize: 48, fontWeight: '800', marginBottom: 36 },
  options: { width: SW - 60, gap: 10 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 2, gap: 12 },
  colorDot: { width: 24, height: 24, borderRadius: 12 },
  optionText: { color: COLORS.text, fontSize: 18, fontWeight: '600' },
});
