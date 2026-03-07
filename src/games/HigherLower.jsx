import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { maxNum: 20 },
  1: { maxNum: 50 },
  2: { maxNum: 100 },
};

export default function HigherLower({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(0);
  const [streak, setStreak] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const genNum = () => Math.floor(Math.random() * config.maxNum) + 1;

  const startNew = () => {
    const c = genNum();
    let n = genNum();
    while (n === c) n = genNum();
    setCurrent(c);
    setNext(n);
    setRevealed(false);
  };

  useEffect(() => { startNew(); setStreak(0); }, [difficulty]);

  const handleGuess = (higher) => {
    playTap();
    setRevealed(true);
    const correct = higher ? next > current : next < current;
    if (correct) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    setTimeout(startNew, 800);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Şu anki</Text>
        <Text style={styles.cardNumber}>{current}</Text>
      </View>
      <Text style={styles.vs}>Sıradaki sayı?</Text>
      <View style={[styles.card, styles.nextCard]}>
        <Text style={styles.cardNumber}>{revealed ? next : '?'}</Text>
      </View>
      {!revealed && (
        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#22c55e' }]} onPress={() => handleGuess(true)} activeOpacity={0.7}>
            <Text style={styles.btnText}>↑ Yüksek</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#ef4444' }]} onPress={() => handleGuess(false)} activeOpacity={0.7}>
            <Text style={styles.btnText}>↓ Düşük</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 20 },
  card: { width: SW - 80, height: 100, backgroundColor: COLORS.surface, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  nextCard: { marginBottom: 30 },
  cardLabel: { color: COLORS.textMuted, fontSize: 14 },
  cardNumber: { color: COLORS.text, fontSize: 48, fontWeight: '800' },
  vs: { color: COLORS.textSecondary, fontSize: 18, marginVertical: 16 },
  buttons: { flexDirection: 'row', gap: 16 },
  btn: { paddingHorizontal: 30, paddingVertical: 16, borderRadius: 16 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
