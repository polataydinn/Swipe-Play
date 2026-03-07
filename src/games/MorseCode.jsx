import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const MORSE = { A:'.-', B:'-...', C:'-.-.', D:'-..', E:'.', F:'..-.', G:'--.', H:'....', I:'..', J:'.---', K:'-.-', L:'.-..', M:'--', N:'-.', O:'---', P:'.--.', Q:'--.-', R:'.-.', S:'...', T:'-', U:'..-', V:'...-', W:'.--', X:'-..-', Y:'-.--', Z:'--..' };
const LETTERS = Object.keys(MORSE);
const DIFFICULTY_CONFIG = { 0: { pool: 8 }, 1: { pool: 16 }, 2: { pool: 26 } };
export default function MorseCode({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [letter, setLetter] = useState('A');
  const [input, setInput] = useState('');
  const [streak, setStreak] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const next = () => {
    const pool = LETTERS.slice(0, config.pool);
    setLetter(pool[Math.floor(Math.random() * pool.length)]);
    setInput(''); setShowResult(false);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const target = MORSE[letter];
  const addDot = () => { playTap(); setInput(i => i + '.'); };
  const addDash = () => { playTap(); setInput(i => i + '-'); };
  const removeLast = () => { playTap(); setInput(i => i.slice(0, -1)); };
  const check = () => {
    playTap(); setShowResult(true);
    if (input === target) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    setTimeout(next, 800);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Bu harfin Mors kodunu gir:</Text>
      <Text style={styles.letter}>{letter}</Text>
      <View style={styles.display}>
        <Text style={styles.morseInput}>{input || '...'}</Text>
      </View>
      <View style={styles.tapButtons}>
        <TouchableOpacity style={styles.dotBtn} onPress={addDot} activeOpacity={0.7}>
          <View style={styles.dot} />
          <Text style={styles.tapLabel}>Nokta (.)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dashBtn} onPress={addDash} activeOpacity={0.7}>
          <View style={styles.dash} />
          <Text style={styles.tapLabel}>Çizgi (-)</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.delBtn} onPress={removeLast} activeOpacity={0.7}>
          <Text style={styles.delText}>⌫</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkBtn} onPress={check} activeOpacity={0.7}>
          <Text style={styles.checkText}>Gönder</Text>
        </TouchableOpacity>
      </View>
      {showResult && input !== target && <Text style={styles.answer}>Doğru: {target}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 8 },
  letter: { color: '#f59e0b', fontSize: 72, fontWeight: '900', marginBottom: 16 },
  display: { backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 32, paddingVertical: 16, marginBottom: 24, minWidth: 160, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  morseInput: { color: COLORS.text, fontSize: 36, fontWeight: '800', letterSpacing: 8 },
  tapButtons: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  dotBtn: { width: 90, height: 90, backgroundColor: COLORS.surface, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3b82f6' },
  dashBtn: { width: 90, height: 90, backgroundColor: COLORS.surface, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ef4444' },
  dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#3b82f6' },
  dash: { width: 40, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  tapLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 12 },
  delBtn: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.surfaceLight },
  delText: { color: '#ef4444', fontSize: 20, fontWeight: '700' },
  checkBtn: { paddingHorizontal: 28, paddingVertical: 14, backgroundColor: '#22c55e', borderRadius: 14 },
  checkText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  answer: { color: COLORS.textMuted, fontSize: 16, marginTop: 12 },
});
