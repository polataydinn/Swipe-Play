import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { min: 5, max: 15, showTime: 2000, tolerance: 3 }, 1: { min: 10, max: 30, showTime: 1200, tolerance: 3 }, 2: { min: 20, max: 50, showTime: 800, tolerance: 5 } };
function genDots(count) { return Array.from({ length: count }, () => ({ x: 5 + Math.random() * 90, y: 5 + Math.random() * 90 })); }
export default function Estimation({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [count, setCount] = useState(0);
  const [dots, setDots] = useState([]);
  const [phase, setPhase] = useState('show');
  const [options, setOptions] = useState([]);
  const next = () => {
    const c = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
    setCount(c); setDots(genDots(c)); setPhase('show');
    const opts = new Set([c]);
    while (opts.size < 4) { const v = c + Math.floor(Math.random() * 12) - 6; if (v > 0) opts.add(v); }
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); }, [difficulty]);
  useEffect(() => { if (phase === 'show') { const t = setTimeout(() => setPhase('guess'), config.showTime); return () => clearTimeout(t); } }, [phase]);
  const handleAnswer = (val) => { playTap(); if (Math.abs(val - count) <= config.tolerance) { onCorrect(); } else { onWrong(); } setTimeout(next, 400); };
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{phase === 'show' ? 'Noktaları say!' : 'Kaç nokta vardı?'}</Text>
      <View style={styles.area}>
        {phase === 'show' && dots.map((d, i) => (<View key={i} style={[styles.dot, { left: `${d.x}%`, top: `${d.y}%` }]} />))}
        {phase === 'guess' && <Text style={styles.qMark}>?</Text>}
      </View>
      {phase === 'guess' && (<View style={styles.options}>{options.map((opt, i) => (<TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(opt)} activeOpacity={0.7}><Text style={styles.btnText}>{opt}</Text></TouchableOpacity>))}</View>)}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 16 },
  area: { width: SW - 60, height: 250, backgroundColor: COLORS.surface, borderRadius: 20, position: 'relative', marginBottom: 20, overflow: 'hidden' },
  dot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e' },
  qMark: { color: COLORS.textMuted, fontSize: 60, fontWeight: '800', textAlign: 'center', lineHeight: 250 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  btn: { width: (SW - 80) / 2, height: 56, backgroundColor: COLORS.surface, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
});
