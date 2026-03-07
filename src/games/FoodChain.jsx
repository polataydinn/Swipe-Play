import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const CHAINS = [
  { items: ['🌱', '🐛', '🐦', '🦅'], name: 'Bitki→Böcek→Kuş→Kartal' },
  { items: ['🌿', '🐇', '🦊', '🐺'], name: 'Ot→Tavşan→Tilki→Kurt' },
  { items: ['🌾', '🐭', '🐍', '🦉'], name: 'Tahıl→Fare→Yılan→Baykuş' },
  { items: ['🌊', '🦐', '🐟', '🦈'], name: 'Plankton→Karides→Balık→Köpekbalığı' },
  { items: ['🍃', '🐌', '🐸', '🐊'], name: 'Yaprak→Salyangoz→Kurbağa→Timsah' },
  { items: ['🌻', '🐝', '🐻', '🦁'], name: 'Çiçek→Arı→Ayı→Aslan' },
];
const DIFFICULTY_CONFIG = { 0: { count: 3 }, 1: { count: 4 }, 2: { count: 4 } };
export default function FoodChain({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [chain, setChain] = useState(null);
  const [shuffled, setShuffled] = useState([]);
  const [selected, setSelected] = useState([]);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const c = CHAINS[Math.floor(Math.random() * CHAINS.length)];
    const items = c.items.slice(0, config.count);
    setChain(items);
    setShuffled([...items].sort(() => Math.random() - 0.5));
    setSelected([]);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleTap = (emoji) => {
    if (selected.includes(emoji)) return;
    playTap();
    const ns = [...selected, emoji];
    setSelected(ns);
    if (ns.length === chain.length) {
      const correct = ns.every((e, i) => e === chain[i]);
      if (correct) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
      setTimeout(next, 600);
    }
  };
  if (!chain) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Besin zincirini sırala!</Text>
      <View style={styles.selected}>
        {Array.from({ length: chain.length }).map((_, i) => (
          <View key={i} style={styles.slot}>
            <Text style={styles.slotText}>{selected[i] || '?'}</Text>
          </View>
        ))}
      </View>
      <View style={styles.options}>
        {shuffled.map((emoji, i) => (
          <TouchableOpacity key={i} style={[styles.optBtn, selected.includes(emoji) && styles.usedBtn]} onPress={() => handleTap(emoji)} activeOpacity={0.7} disabled={selected.includes(emoji)}>
            <Text style={styles.optText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 20 },
  selected: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  slot: { width: 56, height: 56, backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  slotText: { fontSize: 28 },
  options: { flexDirection: 'row', gap: 12 },
  optBtn: { width: 64, height: 64, backgroundColor: COLORS.surface, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  usedBtn: { opacity: 0.3 },
  optText: { fontSize: 32 },
});
