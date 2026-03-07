import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { maxNum: 20 }, 1: { maxNum: 50 }, 2: { maxNum: 100 } };
function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }
export default function GCDGame({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [a, setA] = useState(12); const [b, setB] = useState(8);
  const [options, setOptions] = useState([]); const [streak, setStreak] = useState(0);
  const next = () => {
    const na = Math.floor(Math.random() * config.maxNum) + 2; const nb = Math.floor(Math.random() * config.maxNum) + 2;
    setA(na); setB(nb);
    const answer = gcd(na, nb);
    const opts = new Set([answer]);
    while (opts.size < 4) { const v = Math.floor(Math.random() * Math.max(na, nb)) + 1; opts.add(v); }
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleAnswer = (val) => { playTap(); if (val === gcd(a, b)) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); } next(); };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>EBOB'u bul!</Text>
      <Text style={styles.question}>EBOB({a}, {b})</Text>
      <View style={styles.options}>
        {options.map((opt, i) => (<TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(opt)} activeOpacity={0.7}><Text style={styles.btnText}>{opt}</Text></TouchableOpacity>))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 12 },
  question: { color: COLORS.text, fontSize: 36, fontWeight: '800', marginBottom: 30 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  btn: { width: (SW - 80) / 2, height: 56, backgroundColor: COLORS.surface, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
});
