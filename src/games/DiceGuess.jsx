import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const DIFFICULTY_CONFIG = { 0: { mode: 'highlow' }, 1: { mode: 'oddeven' }, 2: { mode: 'exact' } };
export default function DiceGuess({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [result, setResult] = useState(0); const [phase, setPhase] = useState('guess'); const [streak, setStreak] = useState(0);
  const newRound = () => { setResult(0); setPhase('guess'); };
  useEffect(() => { setStreak(0); newRound(); }, [difficulty]);
  const roll = () => Math.floor(Math.random() * 6) + 1;
  const handleGuess = (guess) => {
    playTap();
    const r = roll(); setResult(r); setPhase('result');
    let correct = false;
    if (config.mode === 'highlow') correct = (guess === 'high' && r >= 4) || (guess === 'low' && r <= 3);
    else if (config.mode === 'oddeven') correct = (guess === 'odd' && r % 2 !== 0) || (guess === 'even' && r % 2 === 0);
    else correct = guess === r;
    if (correct) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    setTimeout(newRound, 800);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <View style={styles.dice}><Text style={styles.diceText}>{result > 0 ? DICE_FACES[result - 1] : '🎲'}</Text></View>
      {result > 0 && <Text style={styles.resultText}>{result} geldi!</Text>}
      {phase === 'guess' && config.mode === 'highlow' && (
        <><Text style={styles.label}>Yüksek mi düşük mü?</Text><View style={styles.buttons}>
          <TouchableOpacity style={styles.btn} onPress={() => handleGuess('high')} activeOpacity={0.7}><Text style={styles.btnText}>Yüksek (4-6)</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => handleGuess('low')} activeOpacity={0.7}><Text style={styles.btnText}>Düşük (1-3)</Text></TouchableOpacity>
        </View></>
      )}
      {phase === 'guess' && config.mode === 'oddeven' && (
        <><Text style={styles.label}>Tek mi çift mi?</Text><View style={styles.buttons}>
          <TouchableOpacity style={styles.btn} onPress={() => handleGuess('odd')} activeOpacity={0.7}><Text style={styles.btnText}>Tek</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => handleGuess('even')} activeOpacity={0.7}><Text style={styles.btnText}>Çift</Text></TouchableOpacity>
        </View></>
      )}
      {phase === 'guess' && config.mode === 'exact' && (
        <><Text style={styles.label}>Hangi sayı gelecek?</Text><View style={styles.buttons}>
          {[1,2,3,4,5,6].map(n => (<TouchableOpacity key={n} style={styles.numBtn} onPress={() => handleGuess(n)} activeOpacity={0.7}><Text style={styles.numText}>{DICE_FACES[n-1]}</Text></TouchableOpacity>))}
        </View></>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  dice: { marginBottom: 16 },
  diceText: { fontSize: 80 },
  resultText: { color: COLORS.text, fontSize: 24, fontWeight: '700', marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 16 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  btn: { paddingHorizontal: 24, paddingVertical: 14, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  numBtn: { width: 50, height: 50, backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  numText: { fontSize: 28 },
});
