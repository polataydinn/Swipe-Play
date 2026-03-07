import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const COINS = [
  { value: 100, label: '100₺', color: '#ef4444' },
  { value: 50, label: '50₺', color: '#f59e0b' },
  { value: 20, label: '20₺', color: '#22c55e' },
  { value: 10, label: '10₺', color: '#3b82f6' },
  { value: 5, label: '5₺', color: '#8b5cf6' },
  { value: 1, label: '1₺', color: '#6b7280' },
];
const DIFFICULTY_CONFIG = { 0: { maxPrice: 50, coins: 4 }, 1: { maxPrice: 150, coins: 5 }, 2: { maxPrice: 300, coins: 6 } };
export default function ChangeMaker({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [price, setPrice] = useState(0);
  const [paid, setPaid] = useState(0);
  const [change, setChange] = useState(0);
  const [collected, setCollected] = useState(0);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const p = (Math.floor(Math.random() * config.maxPrice) + 10);
    const overpay = (Math.floor(Math.random() * 5) + 1) * 10;
    setPrice(p); setPaid(p + overpay); setChange(overpay); setCollected(0);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const addCoin = (val) => {
    playTap();
    const nc = collected + val;
    setCollected(nc);
    if (nc === change) { onCorrect(); setStreak(s => s + 1); setTimeout(next, 500); }
    else if (nc > change) { onWrong(); setStreak(0); setTimeout(next, 500); }
  };
  const reset = () => { playTap(); setCollected(0); };
  const available = COINS.slice(0, config.coins);
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <View style={styles.receipt}>
        <Text style={styles.receiptLine}>Fiyat: {price}₺</Text>
        <Text style={styles.receiptLine}>Ödenen: {paid}₺</Text>
        <Text style={styles.changeLine}>Para üstü: {change}₺</Text>
      </View>
      <Text style={styles.collected}>Toplanan: {collected}₺</Text>
      <View style={styles.remaining}>
        <View style={[styles.progressBar, { width: `${Math.min(100, (collected / change) * 100)}%`, backgroundColor: collected > change ? '#ef4444' : '#22c55e' }]} />
      </View>
      <View style={styles.coins}>
        {available.map((c, i) => (
          <TouchableOpacity key={i} style={[styles.coinBtn, { borderColor: c.color }]} onPress={() => addCoin(c.value)} activeOpacity={0.7}>
            <Text style={[styles.coinText, { color: c.color }]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.resetBtn} onPress={reset} activeOpacity={0.7}>
        <Text style={styles.resetText}>Sıfırla</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  receipt: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16, minWidth: 200, borderWidth: 1, borderColor: COLORS.surfaceLight },
  receiptLine: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 4 },
  changeLine: { color: '#22c55e', fontSize: 20, fontWeight: '800', marginTop: 4 },
  collected: { color: COLORS.text, fontSize: 28, fontWeight: '900', marginBottom: 8 },
  remaining: { width: SW - 80, height: 8, backgroundColor: COLORS.surface, borderRadius: 4, overflow: 'hidden', marginBottom: 20 },
  progressBar: { height: '100%', borderRadius: 4 },
  coins: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 16 },
  coinBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  coinText: { fontSize: 16, fontWeight: '800' },
  resetBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: COLORS.surface, borderRadius: 12 },
  resetText: { color: COLORS.textMuted, fontSize: 14 },
});
