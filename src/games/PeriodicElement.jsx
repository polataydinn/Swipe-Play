import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const ELEMENTS = [
  { symbol: 'H', name: 'Hidrojen', number: 1, row: 0, col: 0 },
  { symbol: 'He', name: 'Helyum', number: 2, row: 0, col: 7 },
  { symbol: 'Li', name: 'Lityum', number: 3, row: 1, col: 0 },
  { symbol: 'Be', name: 'Berilyum', number: 4, row: 1, col: 1 },
  { symbol: 'B', name: 'Bor', number: 5, row: 1, col: 2 },
  { symbol: 'C', name: 'Karbon', number: 6, row: 1, col: 3 },
  { symbol: 'N', name: 'Azot', number: 7, row: 1, col: 4 },
  { symbol: 'O', name: 'Oksijen', number: 8, row: 1, col: 5 },
  { symbol: 'F', name: 'Flor', number: 9, row: 1, col: 6 },
  { symbol: 'Ne', name: 'Neon', number: 10, row: 1, col: 7 },
  { symbol: 'Na', name: 'Sodyum', number: 11, row: 2, col: 0 },
  { symbol: 'Mg', name: 'Magnezyum', number: 12, row: 2, col: 1 },
  { symbol: 'Al', name: 'Alüminyum', number: 13, row: 2, col: 2 },
  { symbol: 'Si', name: 'Silisyum', number: 14, row: 2, col: 3 },
  { symbol: 'P', name: 'Fosfor', number: 15, row: 2, col: 4 },
  { symbol: 'S', name: 'Kükürt', number: 16, row: 2, col: 5 },
  { symbol: 'Cl', name: 'Klor', number: 17, row: 2, col: 6 },
  { symbol: 'Ar', name: 'Argon', number: 18, row: 2, col: 7 },
  { symbol: 'K', name: 'Potasyum', number: 19, row: 3, col: 0 },
  { symbol: 'Ca', name: 'Kalsiyum', number: 20, row: 3, col: 1 },
  { symbol: 'Fe', name: 'Demir', number: 26, row: 3, col: 2 },
  { symbol: 'Cu', name: 'Bakır', number: 29, row: 3, col: 3 },
  { symbol: 'Zn', name: 'Çinko', number: 30, row: 3, col: 4 },
  { symbol: 'Ag', name: 'Gümüş', number: 47, row: 3, col: 5 },
  { symbol: 'Au', name: 'Altın', number: 79, row: 3, col: 6 },
  { symbol: 'Pb', name: 'Kurşun', number: 82, row: 3, col: 7 },
];
const ELEM_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
export default function PeriodicElement({ difficulty, onCorrect, onWrong }) {
  const config = { pool: 26 };
  const [target, setTarget] = useState(null);
  const [streak, setStreak] = useState(0);
  const pool = ELEMENTS.slice(0, config.pool);
  const next = () => { setTarget(pool[Math.floor(Math.random() * pool.length)]); };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleTap = (el) => {
    playTap();
    if (el.symbol === target.symbol) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };
  if (!target) return null;
  const cellSize = (SW - 48) / 8 - 2;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Bu elementi tabloda bul:</Text>
      <Text style={styles.targetName}>{target.name}</Text>
      <View style={styles.table}>
        {pool.map((el, i) => (
          <TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize, left: el.col * (cellSize + 2), top: el.row * (cellSize + 2), position: 'absolute', backgroundColor: ELEM_COLORS[el.row % ELEM_COLORS.length] + '30', borderColor: ELEM_COLORS[el.row % ELEM_COLORS.length] }]} onPress={() => handleTap(el)} activeOpacity={0.7}>
            <Text style={[styles.cellSymbol, { color: ELEM_COLORS[el.row % ELEM_COLORS.length] }]}>{el.symbol}</Text>
            <Text style={styles.cellNum}>{el.number}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 8 },
  label: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 4 },
  targetName: { color: '#f59e0b', fontSize: 28, fontWeight: '900', marginBottom: 2 },
  targetNum: { color: COLORS.textMuted, fontSize: 14, marginBottom: 12 },
  table: { width: SW - 32, height: ((SW - 48) / 8) * 4, position: 'relative' },
  cell: { borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  cellSymbol: { fontSize: 14, fontWeight: '800' },
  cellNum: { color: COLORS.textMuted, fontSize: 8 },
});
