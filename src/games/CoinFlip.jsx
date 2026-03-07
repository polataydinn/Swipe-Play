import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { streakNeeded: 3 }, 1: { streakNeeded: 4 }, 2: { streakNeeded: 5 } };
export default function CoinFlip({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [result, setResult] = useState(''); const [streak, setStreak] = useState(0); const [phase, setPhase] = useState('choose');
  const newRound = () => { setResult(''); setPhase('choose'); };
  useEffect(() => { setStreak(0); newRound(); }, [difficulty]);
  const handleGuess = (guess) => {
    playTap();
    const coin = Math.random() > 0.5 ? 'Yazı' : 'Tura';
    setResult(coin); setPhase('result');
    if (guess === coin) {
      const newS = streak + 1; setStreak(newS);
      if (newS >= config.streakNeeded) { onCorrect(); setTimeout(() => { setStreak(0); newRound(); }, 800); }
      else setTimeout(newRound, 600);
    } else { onWrong(); setStreak(0); setTimeout(newRound, 600); }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.streakText}>🔥 {streak}/{config.streakNeeded}</Text>
      <View style={styles.coin}><Text style={styles.coinText}>{phase === 'result' ? (result === 'Yazı' ? '📝' : '👑') : '🪙'}</Text></View>
      {phase === 'result' && <Text style={styles.result}>{result}!</Text>}
      {phase === 'choose' && (
        <>
          <Text style={styles.label}>Tahminin ne?</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.btn} onPress={() => handleGuess('Yazı')} activeOpacity={0.7}><Text style={styles.btnText}>📝 Yazı</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => handleGuess('Tura')} activeOpacity={0.7}><Text style={styles.btnText}>👑 Tura</Text></TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streakText: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 20 },
  coin: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  coinText: { fontSize: 50 },
  result: { color: COLORS.text, fontSize: 28, fontWeight: '800', marginBottom: 20 },
  label: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 20 },
  buttons: { flexDirection: 'row', gap: 16 },
  btn: { paddingHorizontal: 28, paddingVertical: 16, backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
});
