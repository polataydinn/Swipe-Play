import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const COLOR_MAP = [
  { name: 'Kırmızı', code: '#ef4444' },
  { name: 'Mavi', code: '#3b82f6' },
  { name: 'Yeşil', code: '#22c55e' },
  { name: 'Sarı', code: '#eab308' },
  { name: 'Mor', code: '#a855f7' },
  { name: 'Turuncu', code: '#f97316' },
];

const DIFFICULTY_CONFIG = {
  0: { buttonCount: 4, time: 5000 },
  1: { buttonCount: 5, time: 3500 },
  2: { buttonCount: 6, time: 2000 },
};

export default function ColorTap({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [targetColor, setTargetColor] = useState(COLOR_MAP[0]);
  const [buttons, setButtons] = useState([]);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.time);
  const intervalRef = useRef(null);

  const next = () => {
    const tIdx = Math.floor(Math.random() * COLOR_MAP.length);
    setTargetColor(COLOR_MAP[tIdx]);
    const btns = [tIdx];
    while (btns.length < config.buttonCount) {
      const r = Math.floor(Math.random() * COLOR_MAP.length);
      btns.push(r);
    }
    setButtons(btns.sort(() => Math.random() - 0.5));
    setTimeLeft(config.time);
  };

  useEffect(() => { next(); setStreak(0); }, [difficulty]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 100) { onWrong(); setStreak(0); next(); return config.time; } return t - 100; });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [buttons, config.time]);

  const handleTap = (idx) => {
    playTap();
    if (COLOR_MAP[idx].name === targetColor.name) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };

  const progress = timeLeft / config.time;

  return (
    <View style={styles.container}>
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: progress > 0.3 ? '#22c55e' : '#ef4444' }]} />
      </View>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.instruction}>Bu renge dokun:</Text>
      <Text style={[styles.colorName, { color: targetColor.code }]}>{targetColor.name}</Text>
      <View style={styles.buttons}>
        {buttons.map((cIdx, i) => (
          <TouchableOpacity key={i} style={[styles.btn, { backgroundColor: COLOR_MAP[cIdx].code }]} onPress={() => handleTap(cIdx)} activeOpacity={0.7} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  timerBar: { width: SW - 60, height: 6, backgroundColor: COLORS.surface, borderRadius: 3, marginBottom: 16, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 3 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 10 },
  instruction: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 8 },
  colorName: { fontSize: 36, fontWeight: '800', marginBottom: 30 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  btn: { width: 70, height: 70, borderRadius: 35 },
});
