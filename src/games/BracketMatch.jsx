import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const BRACKETS = { '(': ')', '[': ']', '{': '}' };
const OPEN = Object.keys(BRACKETS);
const CLOSE = Object.values(BRACKETS);
const ALL = [...OPEN, ...CLOSE];
const DIFFICULTY_CONFIG = { 0: { types: 1, length: 4 }, 1: { types: 2, length: 6 }, 2: { types: 3, length: 8 } };
export default function BracketMatch({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [stack, setStack] = useState([]);
  const [target, setTarget] = useState([]);
  const [position, setPosition] = useState(0);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState(false);
  const genTarget = () => {
    const brackets = [];
    const stk = [];
    const types = OPEN.slice(0, config.types);
    const len = config.length;
    for (let i = 0; i < len / 2; i++) {
      const b = types[Math.floor(Math.random() * types.length)];
      brackets.push(b); stk.push(BRACKETS[b]);
    }
    while (stk.length) brackets.push(stk.pop());
    return brackets;
  };
  const next = () => {
    setTarget(genTarget()); setStack([]); setPosition(0); setError(false);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleBracket = (b) => {
    playTap();
    if (b !== target[position]) {
      setError(true); onWrong(); setStreak(0);
      setTimeout(next, 600); return;
    }
    const ns = [...stack];
    if (OPEN.includes(b)) {
      ns.push(b);
    } else {
      if (ns.length > 0 && BRACKETS[ns[ns.length - 1]] === b) ns.pop();
    }
    setStack(ns); setPosition(position + 1);
    if (position + 1 >= target.length) {
      onCorrect(); setStreak(s => s + 1); setTimeout(next, 500);
    }
  };
  const available = [...OPEN.slice(0, config.types), ...CLOSE.slice(0, config.types)];
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Parantez dizisini sırayla oluştur!</Text>
      <View style={styles.targetRow}>
        {target.map((b, i) => (
          <View key={i} style={[styles.targetCell, i < position && styles.doneCell, i === position && styles.currentCell, error && i === position && styles.errorCell]}>
            <Text style={[styles.targetText, i < position && styles.doneText]}>{i < position ? b : '?'}</Text>
          </View>
        ))}
      </View>
      <View style={styles.stackDisplay}>
        <Text style={styles.stackLabel}>Yığın: </Text>
        <Text style={styles.stackContent}>{stack.length > 0 ? stack.join(' ') : '(boş)'}</Text>
      </View>
      <View style={styles.buttons}>
        {available.map((b, i) => (
          <TouchableOpacity key={i} style={[styles.btn, OPEN.includes(b) ? styles.openBtn : styles.closeBtn]} onPress={() => handleBracket(b)} activeOpacity={0.7}>
            <Text style={styles.btnText}>{b}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 15, marginBottom: 16 },
  targetRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  targetCell: { width: 36, height: 44, backgroundColor: COLORS.surface, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  doneCell: { backgroundColor: '#22c55e20', borderColor: '#22c55e' },
  currentCell: { borderColor: '#3b82f6', borderWidth: 2 },
  errorCell: { borderColor: '#ef4444', backgroundColor: '#ef444420' },
  targetText: { color: COLORS.textMuted, fontSize: 20, fontWeight: '800' },
  doneText: { color: '#22c55e' },
  stackDisplay: { flexDirection: 'row', marginBottom: 20, backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  stackLabel: { color: COLORS.textMuted, fontSize: 14 },
  stackContent: { color: '#f59e0b', fontSize: 14, fontWeight: '700', letterSpacing: 4 },
  buttons: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  btn: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  openBtn: { backgroundColor: '#3b82f620', borderColor: '#3b82f6' },
  closeBtn: { backgroundColor: '#ef444420', borderColor: '#ef4444' },
  btnText: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
});
