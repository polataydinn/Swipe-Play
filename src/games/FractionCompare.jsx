import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { maxDenom: 6 }, 1: { maxDenom: 10 }, 2: { maxDenom: 12 } };
function genFrac(maxD) { const d = Math.floor(Math.random() * (maxD - 1)) + 2; const n = Math.floor(Math.random() * d) + 1; return { n, d }; }
export default function FractionCompare({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [left, setLeft] = useState({ n: 1, d: 2 });
  const [right, setRight] = useState({ n: 1, d: 3 });
  const [streak, setStreak] = useState(0);
  const next = () => { setLeft(genFrac(config.maxDenom)); setRight(genFrac(config.maxDenom)); };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const leftVal = left.n / left.d;
  const rightVal = right.n / right.d;
  const handleTap = (side) => {
    playTap();
    const correct = leftVal > rightVal ? 'left' : leftVal < rightVal ? 'right' : 'equal';
    if (side === correct || (side === 'left' && correct === 'equal') || (side === 'right' && correct === 'equal')) {
      if (side === correct) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    } else { onWrong(); setStreak(0); }
    next();
  };
  const PIE_R = 50;
  const renderPie = (frac) => {
    const segments = [];
    const angle = (frac.n / frac.d) * 360;
    for (let i = 0; i < frac.d; i++) {
      const filled = i < frac.n;
      segments.push(
        <View key={i} style={[styles.segment, {
          width: 20, height: PIE_R * 2,
          transform: [{ rotate: `${(i / frac.d) * 360}deg` }],
          backgroundColor: filled ? '#3b82f6' : COLORS.surface,
          position: 'absolute',
        }]} />
      );
    }
    return (
      <View style={[styles.pie, { width: PIE_R * 2, height: PIE_R * 2 }]}>
        <View style={[styles.pieFill, { width: PIE_R * 2, height: PIE_R * 2 }]}>
          <View style={[styles.pieSlice, {
            borderTopColor: '#3b82f6',
            borderRightColor: angle > 90 ? '#3b82f6' : 'transparent',
            borderBottomColor: angle > 180 ? '#3b82f6' : 'transparent',
            borderLeftColor: angle > 270 ? '#3b82f6' : 'transparent',
          }]} />
        </View>
        <Text style={styles.fracText}>{frac.n}/{frac.d}</Text>
      </View>
    );
  };
  const leftPct = Math.round(leftVal * 100);
  const rightPct = Math.round(rightVal * 100);
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Hangisi daha büyük? (Pasta grafiğe bak!)</Text>
      <View style={styles.pies}>
        <TouchableOpacity style={styles.pieBox} onPress={() => handleTap('left')} activeOpacity={0.7}>
          <View style={styles.barOuter}><View style={[styles.barInner, { width: `${leftPct}%`, backgroundColor: '#3b82f6' }]} /></View>
          <Text style={styles.fracLabel}>{left.n}/{left.d}</Text>
        </TouchableOpacity>
        <Text style={styles.vs}>VS</Text>
        <TouchableOpacity style={styles.pieBox} onPress={() => handleTap('right')} activeOpacity={0.7}>
          <View style={styles.barOuter}><View style={[styles.barInner, { width: `${rightPct}%`, backgroundColor: '#22c55e' }]} /></View>
          <Text style={styles.fracLabel}>{right.n}/{right.d}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.tip}>Büyük olan kesre dokun</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 20 },
  pies: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  pieBox: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  barOuter: { width: '100%', height: 80, backgroundColor: COLORS.background, borderRadius: 12, overflow: 'hidden', justifyContent: 'flex-end' },
  barInner: { height: '100%', borderRadius: 12 },
  fracLabel: { color: COLORS.text, fontSize: 28, fontWeight: '900', marginTop: 12 },
  vs: { color: COLORS.textMuted, fontSize: 20, fontWeight: '900' },
  pie: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  pieFill: { position: 'absolute', borderRadius: 999, overflow: 'hidden' },
  pieSlice: { width: '100%', height: '100%', borderWidth: 50, borderRadius: 999 },
  fracText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  tip: { color: COLORS.textMuted, fontSize: 12 },
});
