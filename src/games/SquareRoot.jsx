import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const PERFECT_SQUARES = { 0: [1,4,9,16,25,36,49,64,81,100], 1: [1,4,9,16,25,36,49,64,81,100,121,144,169,196,225,256,289,324,361,400], 2: [4,9,16,25,36,49,64,81,100,121,144,169,196,225,256,289,324,361,400,441,484,529,576,625] };
export default function SquareRoot({ difficulty, onCorrect, onWrong }) {
  const squares = PERFECT_SQUARES[difficulty] || PERFECT_SQUARES[0];
  const [num, setNum] = useState(4);
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const n = squares[Math.floor(Math.random() * squares.length)];
    const answer = Math.sqrt(n);
    setNum(n);
    const opts = new Set([answer]);
    while (opts.size < 4) { const v = answer + Math.floor(Math.random() * 8) - 4; if (v > 0) opts.add(v); }
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleAnswer = (val) => { playTap(); if (val === Math.sqrt(num)) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); } next(); };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Karekökü bul</Text>
      <Text style={styles.expr}>√{num}</Text>
      <View style={styles.options}>
        {options.map((opt, i) => (<TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(opt)} activeOpacity={0.7}><Text style={styles.btnText}>{opt}</Text></TouchableOpacity>))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 20 },
  expr: { color: COLORS.text, fontSize: 56, fontWeight: '800', marginBottom: 30 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  btn: { width: (SW - 80) / 2, height: 56, backgroundColor: COLORS.surface, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
});
