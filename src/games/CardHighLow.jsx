import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
function randCard() { return { suit: SUITS[Math.floor(Math.random() * 4)], value: Math.floor(Math.random() * 13) }; }
export default function CardHighLow({ difficulty, onCorrect, onWrong }) {
  const [current, setCurrent] = useState(randCard()); const [next, setNext] = useState(randCard());
  const [revealed, setRevealed] = useState(false); const [streak, setStreak] = useState(0);
  const startNew = () => { setCurrent(randCard()); setNext(randCard()); setRevealed(false); };
  useEffect(() => { startNew(); setStreak(0); }, [difficulty]);
  const handleGuess = (higher) => {
    playTap(); setRevealed(true);
    const correct = higher ? next.value >= current.value : next.value <= current.value;
    if (correct) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    setTimeout(startNew, 800);
  };
  const suitColor = (s) => s === '♥' || s === '♦' ? '#ef4444' : COLORS.text;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <View style={styles.cards}>
        <View style={styles.card}><Text style={[styles.cardValue, { color: suitColor(current.suit) }]}>{VALUES[current.value]}</Text><Text style={[styles.cardSuit, { color: suitColor(current.suit) }]}>{current.suit}</Text></View>
        <View style={[styles.card, styles.nextCard]}>{revealed ? (<><Text style={[styles.cardValue, { color: suitColor(next.suit) }]}>{VALUES[next.value]}</Text><Text style={[styles.cardSuit, { color: suitColor(next.suit) }]}>{next.suit}</Text></>) : (<Text style={styles.hidden}>?</Text>)}</View>
      </View>
      {!revealed && (<View style={styles.buttons}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#22c55e' }]} onPress={() => handleGuess(true)} activeOpacity={0.7}><Text style={styles.btnText}>↑ Yüksek</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#ef4444' }]} onPress={() => handleGuess(false)} activeOpacity={0.7}><Text style={styles.btnText}>↓ Düşük</Text></TouchableOpacity>
      </View>)}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 20 },
  cards: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  card: { width: 100, height: 140, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  nextCard: { borderWidth: 2, borderColor: COLORS.surfaceLight },
  cardValue: { fontSize: 36, fontWeight: '800' },
  cardSuit: { fontSize: 28 },
  hidden: { color: COLORS.textMuted, fontSize: 48, fontWeight: '800' },
  buttons: { flexDirection: 'row', gap: 16 },
  btn: { paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
