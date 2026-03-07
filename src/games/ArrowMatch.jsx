import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIRECTIONS = [
  { name: '↑', label: 'Yukarı' },
  { name: '↓', label: 'Aşağı' },
  { name: '←', label: 'Sol' },
  { name: '→', label: 'Sağ' },
];

const DIFFICULTY_CONFIG = {
  0: { time: 5000, rounds: 5 },
  1: { time: 3000, rounds: 8 },
  2: { time: 1500, rounds: 12 },
};

export default function ArrowMatch({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.time);
  const [streak, setStreak] = useState(0);
  const intervalRef = useRef(null);

  const nextArrow = () => {
    setCurrent(Math.floor(Math.random() * 4));
    setTimeLeft(config.time);
  };

  useEffect(() => { nextArrow(); setStreak(0); }, [difficulty]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 100) { onWrong(); setStreak(0); nextArrow(); return config.time; }
        return t - 100;
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [current, config.time]);

  const handlePress = (idx) => {
    playTap();
    if (idx === current) {
      onCorrect();
      setStreak(s => s + 1);
    } else {
      onWrong();
      setStreak(0);
    }
    nextArrow();
  };

  const progress = timeLeft / config.time;

  return (
    <View style={styles.container}>
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: progress > 0.3 ? '#22c55e' : '#ef4444' }]} />
      </View>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.arrow}>{DIRECTIONS[current].name}</Text>
      <View style={styles.grid}>
        <View style={styles.row}>
          <View style={styles.spacer} />
          <TouchableOpacity style={styles.btn} onPress={() => handlePress(0)} activeOpacity={0.7}>
            <Text style={styles.btnText}>↑</Text>
          </TouchableOpacity>
          <View style={styles.spacer} />
        </View>
        <View style={styles.row}>
          <TouchableOpacity style={styles.btn} onPress={() => handlePress(2)} activeOpacity={0.7}>
            <Text style={styles.btnText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => handlePress(1)} activeOpacity={0.7}>
            <Text style={styles.btnText}>↓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => handlePress(3)} activeOpacity={0.7}>
            <Text style={styles.btnText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  timerBar: { width: SW - 60, height: 6, backgroundColor: COLORS.surface, borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 3 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 10 },
  arrow: { color: COLORS.text, fontSize: 80, fontWeight: '800', marginBottom: 40 },
  grid: { gap: 10 },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  spacer: { width: 70, height: 70 },
  btn: { width: 70, height: 70, backgroundColor: COLORS.surface, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 32, fontWeight: '700' },
});
