import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const CONVERSIONS = [
  { from: 'km', to: 'm', factor: 1000, cat: 'Uzunluk' },
  { from: 'm', to: 'cm', factor: 100, cat: 'Uzunluk' },
  { from: 'cm', to: 'mm', factor: 10, cat: 'Uzunluk' },
  { from: 'kg', to: 'g', factor: 1000, cat: 'Ağırlık' },
  { from: 'g', to: 'mg', factor: 1000, cat: 'Ağırlık' },
  { from: 'L', to: 'mL', factor: 1000, cat: 'Hacim' },
  { from: 'saat', to: 'dk', factor: 60, cat: 'Zaman' },
  { from: 'dk', to: 'sn', factor: 60, cat: 'Zaman' },
];
const DIFFICULTY_CONFIG = { 0: { pool: 3, maxVal: 5 }, 1: { pool: 6, maxVal: 10 }, 2: { pool: 8, maxVal: 20 } };
export default function UnitConvert({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [conv, setConv] = useState(CONVERSIONS[0]);
  const [value, setValue] = useState(1);
  const [leftItems, setLeftItems] = useState([]);
  const [rightItems, setRightItems] = useState([]);
  const [selectedL, setSelectedL] = useState(null);
  const [selectedR, setSelectedR] = useState(null);
  const [matched, setMatched] = useState(new Set());
  const [streak, setStreak] = useState(0);
  const next = () => {
    const pool = CONVERSIONS.slice(0, config.pool);
    const pairs = [];
    for (let i = 0; i < 4; i++) {
      const c = pool[Math.floor(Math.random() * pool.length)];
      const v = Math.floor(Math.random() * config.maxVal) + 1;
      pairs.push({ value: v, from: `${v} ${c.from}`, to: `${v * c.factor} ${c.to}`, id: i });
    }
    setLeftItems(pairs.map(p => ({ text: p.from, id: p.id })).sort(() => Math.random() - 0.5));
    setRightItems(pairs.map(p => ({ text: p.to, id: p.id })).sort(() => Math.random() - 0.5));
    setSelectedL(null); setSelectedR(null); setMatched(new Set());
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleLeft = (item) => {
    if (matched.has(item.id)) return;
    playTap(); setSelectedL(item.id);
    if (selectedR !== null) {
      if (item.id === selectedR) {
        const nm = new Set(matched); nm.add(item.id); setMatched(nm);
        setSelectedL(null); setSelectedR(null);
        if (nm.size === 4) { onCorrect(); setStreak(s => s + 1); setTimeout(next, 500); }
      } else { onWrong(); setStreak(0); setSelectedL(null); setSelectedR(null); }
    }
  };
  const handleRight = (item) => {
    if (matched.has(item.id)) return;
    playTap(); setSelectedR(item.id);
    if (selectedL !== null) {
      if (item.id === selectedL) {
        const nm = new Set(matched); nm.add(item.id); setMatched(nm);
        setSelectedL(null); setSelectedR(null);
        if (nm.size === 4) { onCorrect(); setStreak(s => s + 1); setTimeout(next, 500); }
      } else { onWrong(); setStreak(0); setSelectedL(null); setSelectedR(null); }
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Eşleştir!</Text>
      <View style={styles.columns}>
        <View style={styles.col}>
          {leftItems.map((item, i) => (
            <TouchableOpacity key={i} style={[styles.item, selectedL === item.id && styles.selectedItem, matched.has(item.id) && styles.matchedItem]} onPress={() => handleLeft(item)} activeOpacity={0.7} disabled={matched.has(item.id)}>
              <Text style={[styles.itemText, matched.has(item.id) && styles.matchedText]}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.arrow}>↔</Text>
        <View style={styles.col}>
          {rightItems.map((item, i) => (
            <TouchableOpacity key={i} style={[styles.item, selectedR === item.id && styles.selectedItem, matched.has(item.id) && styles.matchedItem]} onPress={() => handleRight(item)} activeOpacity={0.7} disabled={matched.has(item.id)}>
              <Text style={[styles.itemText, matched.has(item.id) && styles.matchedText]}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 },
  columns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  col: { gap: 8 },
  arrow: { color: COLORS.textMuted, fontSize: 20, fontWeight: '800' },
  item: { backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.surfaceLight, minWidth: 110, alignItems: 'center' },
  selectedItem: { borderColor: '#3b82f6', backgroundColor: '#3b82f620' },
  matchedItem: { backgroundColor: '#22c55e20', borderColor: '#22c55e' },
  itemText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  matchedText: { color: '#22c55e' },
});
