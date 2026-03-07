import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { count: 4, time: 8000 }, 1: { count: 6, time: 6000 }, 2: { count: 8, time: 5000 } };
export default function Parity({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [numbers, setNumbers] = useState([]);
  const [wantOdd, setWantOdd] = useState(true);
  const [tapped, setTapped] = useState(new Set());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const nums = Array.from({ length: config.count * 2 }, () => Math.floor(Math.random() * 99) + 1);
    setNumbers(nums); setWantOdd(Math.random() > 0.5); setTapped(new Set());
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleTap = (idx) => {
    if (tapped.has(idx)) return;
    playTap();
    const num = numbers[idx];
    const isOdd = num % 2 !== 0;
    const nt = new Set(tapped); nt.add(idx); setTapped(nt);
    if ((wantOdd && isOdd) || (!wantOdd && !isOdd)) {
      setScore(s => s + 1);
      const targetCount = numbers.filter(n => wantOdd ? n % 2 !== 0 : n % 2 === 0).length;
      const correctTaps = [...nt].filter(i => {
        const n = numbers[i];
        return wantOdd ? n % 2 !== 0 : n % 2 === 0;
      }).length;
      if (correctTaps === targetCount) { onCorrect(); setStreak(s => s + 1); setTimeout(next, 500); }
    } else {
      onWrong(); setStreak(0); setTimeout(next, 500);
    }
  };
  const cellSize = Math.min(64, (SW - 60) / 4 - 8);
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <View style={[styles.banner, { backgroundColor: wantOdd ? '#8b5cf620' : '#3b82f620' }]}>
        <Text style={[styles.bannerText, { color: wantOdd ? '#8b5cf6' : '#3b82f6' }]}>
          Tüm {wantOdd ? 'TEK' : 'ÇİFT'} sayılara dokun!
        </Text>
      </View>
      <View style={styles.grid}>
        {numbers.map((num, i) => {
          const isTapped = tapped.has(i);
          const isCorrectType = wantOdd ? num % 2 !== 0 : num % 2 === 0;
          return (
            <TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }, isTapped && (isCorrectType ? styles.correctCell : styles.wrongCell)]} onPress={() => handleTap(i)} activeOpacity={0.7} disabled={isTapped}>
              <Text style={[styles.cellText, isTapped && styles.tappedText]}>{num}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  banner: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginBottom: 20 },
  bannerText: { fontSize: 18, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: SW - 40 },
  cell: { backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  correctCell: { backgroundColor: '#22c55e20', borderColor: '#22c55e' },
  wrongCell: { backgroundColor: '#ef444420', borderColor: '#ef4444' },
  cellText: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  tappedText: { opacity: 0.5 },
});
