import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { max: 10 }, 1: { max: 20 }, 2: { max: 50 } };
export default function AlgebraSolve({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const [answer, setAnswer] = useState(0);
  const [userVal, setUserVal] = useState(0);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const x = Math.floor(Math.random() * config.max) + 1;
    const coef = Math.floor(Math.random() * 5) + 1;
    const constant = Math.floor(Math.random() * config.max);
    setA(coef); setB(constant); setAnswer(x); setUserVal(0);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const result = a * answer + b;
  const addDigit = (d) => { playTap(); setUserVal(v => v * 10 + d); };
  const clear = () => { playTap(); setUserVal(0); };
  const check = () => {
    playTap();
    if (userVal === answer) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    setTimeout(next, 500);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <View style={styles.equation}>
        <Text style={styles.eqText}>{a}x + {b} = {result}</Text>
      </View>
      <Text style={styles.xLabel}>x = ?</Text>
      <View style={styles.display}>
        <Text style={styles.displayText}>{userVal || '_'}</Text>
      </View>
      <View style={styles.numpad}>
        {[1,2,3,4,5,6,7,8,9].map(d => (
          <TouchableOpacity key={d} style={styles.numBtn} onPress={() => addDigit(d)} activeOpacity={0.7}>
            <Text style={styles.numText}>{d}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.numBtn, styles.clearBtn]} onPress={clear} activeOpacity={0.7}>
          <Text style={styles.clearText}>C</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.numBtn} onPress={() => addDigit(0)} activeOpacity={0.7}>
          <Text style={styles.numText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.numBtn, styles.sendBtn]} onPress={check} activeOpacity={0.7}>
          <Text style={styles.sendText}>✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  equation: { backgroundColor: COLORS.surface, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.surfaceLight },
  eqText: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
  xLabel: { color: '#f59e0b', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  display: { backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12, marginBottom: 20, minWidth: 120, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  displayText: { color: COLORS.text, fontSize: 36, fontWeight: '900' },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: 3 * 64 + 16, justifyContent: 'center' },
  numBtn: { width: 60, height: 52, backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  numText: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  clearBtn: { borderColor: '#ef4444' },
  clearText: { color: '#ef4444', fontSize: 20, fontWeight: '800' },
  sendBtn: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  sendText: { color: '#fff', fontSize: 22, fontWeight: '800' },
});
