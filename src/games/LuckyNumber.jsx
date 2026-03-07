import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { range: 5, guesses: 3 }, 1: { range: 10, guesses: 4 }, 2: { range: 20, guesses: 5 } };
export default function LuckyNumber({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [target, setTarget] = useState(1);
  const [guessesLeft, setGuessesLeft] = useState(config.guesses);
  const [hint, setHint] = useState('');
  const [low, setLow] = useState(1);
  const [high, setHigh] = useState(config.range);
  const [streak, setStreak] = useState(0);
  const newGame = () => {
    setTarget(Math.floor(Math.random() * config.range) + 1);
    setGuessesLeft(config.guesses); setHint(''); setLow(1); setHigh(config.range);
  };
  useEffect(() => { newGame(); setStreak(0); }, [difficulty]);
  const handleGuess = (num) => {
    playTap();
    if (num === target) { onCorrect(); setStreak(s => s + 1); setHint('Doğru!'); setTimeout(newGame, 600); return; }
    const left = guessesLeft - 1;
    setGuessesLeft(left);
    if (num < target) { setHint('Daha yüksek!'); setLow(Math.max(low, num + 1)); }
    else { setHint('Daha düşük!'); setHigh(Math.min(high, num - 1)); }
    if (left <= 0) { onWrong(); setStreak(0); setHint(`Cevap: ${target}`); setTimeout(newGame, 1000); }
  };
  const numbers = [];
  for (let i = low; i <= high; i++) numbers.push(i);
  const btnSize = Math.min(48, (SW - 60) / Math.min(numbers.length, 6) - 8);
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>1-{config.range} arası sayıyı bul!</Text>
      <Text style={styles.guesses}>Kalan hak: {guessesLeft}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.nums}>
        {numbers.map(n => (
          <TouchableOpacity key={n} style={[styles.numBtn, { width: btnSize, height: btnSize }]} onPress={() => handleGuess(n)} activeOpacity={0.7}>
            <Text style={styles.numText}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 8 },
  guesses: { color: '#f59e0b', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  hint: { color: '#3b82f6', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  nums: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: SW - 40 },
  numBtn: { backgroundColor: COLORS.surface, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  numText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
});
