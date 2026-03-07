import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const FLAGS = [
  { flag: '🇹🇷', name: 'Türkiye' }, { flag: '🇫🇷', name: 'Fransa' }, { flag: '🇩🇪', name: 'Almanya' },
  { flag: '🇬🇧', name: 'İngiltere' }, { flag: '🇺🇸', name: 'ABD' }, { flag: '🇯🇵', name: 'Japonya' },
  { flag: '🇮🇹', name: 'İtalya' }, { flag: '🇪🇸', name: 'İspanya' }, { flag: '🇧🇷', name: 'Brezilya' },
  { flag: '🇷🇺', name: 'Rusya' }, { flag: '🇨🇳', name: 'Çin' }, { flag: '🇰🇷', name: 'Güney Kore' },
  { flag: '🇮🇳', name: 'Hindistan' }, { flag: '🇦🇺', name: 'Avustralya' }, { flag: '🇨🇦', name: 'Kanada' },
  { flag: '🇲🇽', name: 'Meksika' }, { flag: '🇦🇷', name: 'Arjantin' }, { flag: '🇪🇬', name: 'Mısır' },
  { flag: '🇸🇦', name: 'Suudi Arabistan' }, { flag: '🇬🇷', name: 'Yunanistan' },
  { flag: '🇳🇱', name: 'Hollanda' }, { flag: '🇵🇱', name: 'Polonya' }, { flag: '🇸🇪', name: 'İsveç' },
  { flag: '🇳🇴', name: 'Norveç' }, { flag: '🇵🇹', name: 'Portekiz' },
];
const DIFFICULTY_CONFIG = { 0: { optionCount: 3 }, 1: { optionCount: 4 }, 2: { optionCount: 4 } };
export default function FlagQuiz({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [current, setCurrent] = useState(FLAGS[0]); const [options, setOptions] = useState([]); const [streak, setStreak] = useState(0);
  const next = () => {
    const item = FLAGS[Math.floor(Math.random() * FLAGS.length)]; setCurrent(item);
    const opts = new Set([item.name]); while (opts.size < config.optionCount) { opts.add(FLAGS[Math.floor(Math.random() * FLAGS.length)].name); }
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleAnswer = (val) => { playTap(); if (val === current.name) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); } next(); };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Bu hangi ülkenin bayrağı?</Text>
      <Text style={styles.flag}>{current.flag}</Text>
      <View style={styles.opts}>{options.map((opt, i) => (<TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(opt)} activeOpacity={0.7}><Text style={styles.btnText}>{opt}</Text></TouchableOpacity>))}</View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 },
  flag: { fontSize: 80, marginBottom: 30 },
  opts: { width: SW - 60, gap: 12 },
  btn: { paddingVertical: 16, backgroundColor: COLORS.surface, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 18, fontWeight: '600' },
});
