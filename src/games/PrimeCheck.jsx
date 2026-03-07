import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { gridSize: 4, max: 16 }, 1: { gridSize: 5, max: 25 }, 2: { gridSize: 6, max: 36 } };
function isPrime(n) { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
export default function PrimeCheck({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [numbers, setNumbers] = useState([]);
  const [eliminated, setEliminated] = useState(new Set());
  const [streak, setStreak] = useState(0);
  const next = () => {
    const nums = [];
    for (let i = 2; i <= config.max; i++) nums.push(i);
    setNumbers(nums.slice(0, config.gridSize * config.gridSize));
    setEliminated(new Set());
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleTap = (num) => {
    playTap();
    if (isPrime(num)) {
      onWrong(); setStreak(0); setTimeout(next, 500);
      return;
    }
    const ne = new Set(eliminated); ne.add(num); setEliminated(ne);
    const remaining = numbers.filter(n => !ne.has(n));
    if (remaining.every(n => isPrime(n))) {
      onCorrect(); setStreak(s => s + 1); setTimeout(next, 600);
    }
  };
  const cellSize = Math.floor((SW - 60) / config.gridSize) - 6;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Asal olmayanları ele! (Asallara dokunma)</Text>
      <View style={[styles.grid, { width: config.gridSize * (cellSize + 6) }]}>
        {numbers.map((num, i) => {
          const isElim = eliminated.has(num);
          const prime = isPrime(num);
          return (
            <TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }, isElim && styles.elimCell, !isElim && prime && styles.primeCell]} onPress={() => !isElim && handleTap(num)} activeOpacity={0.7} disabled={isElim}>
              <Text style={[styles.cellText, isElim && styles.elimText]}>{num}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.hint}>Asal sayılar kalana kadar elemaya devam et</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 15, marginBottom: 16, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  cell: { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.surfaceLight },
  primeCell: { borderColor: '#8b5cf640' },
  elimCell: { backgroundColor: '#ef444420', borderColor: '#ef4444' },
  cellText: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  elimText: { color: '#ef4444', textDecorationLine: 'line-through', opacity: 0.4 },
  hint: { color: COLORS.textMuted, fontSize: 11 },
});
