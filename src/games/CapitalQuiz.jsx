import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const PAIRS = [
  { country: 'Türkiye', capital: 'Ankara' }, { country: 'Fransa', capital: 'Paris' }, { country: 'Almanya', capital: 'Berlin' },
  { country: 'İngiltere', capital: 'Londra' }, { country: 'İtalya', capital: 'Roma' }, { country: 'İspanya', capital: 'Madrid' },
  { country: 'Japonya', capital: 'Tokyo' }, { country: 'Rusya', capital: 'Moskova' }, { country: 'Brezilya', capital: 'Brasilia' },
  { country: 'Mısır', capital: 'Kahire' }, { country: 'Avustralya', capital: 'Kanberra' }, { country: 'Kanada', capital: 'Ottawa' },
  { country: 'Çin', capital: 'Pekin' }, { country: 'Hindistan', capital: 'Yeni Delhi' }, { country: 'ABD', capital: 'Washington' },
  { country: 'Yunanistan', capital: 'Atina' }, { country: 'Arjantin', capital: 'Buenos Aires' }, { country: 'Güney Kore', capital: 'Seul' },
  { country: 'Meksika', capital: 'Mexico City' }, { country: 'İsveç', capital: 'Stockholm' }, { country: 'Norveç', capital: 'Oslo' },
  { country: 'Polonya', capital: 'Varşova' }, { country: 'Portekiz', capital: 'Lizbon' }, { country: 'Hollanda', capital: 'Amsterdam' },
  { country: 'İran', capital: 'Tahran' },
];
const ALL_CAPITALS = PAIRS.map(p => p.capital);
const DIFFICULTY_CONFIG = { 0: { optionCount: 3 }, 1: { optionCount: 4 }, 2: { optionCount: 4 } };
export default function CapitalQuiz({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [current, setCurrent] = useState(PAIRS[0]); const [options, setOptions] = useState([]); const [streak, setStreak] = useState(0);
  const next = () => {
    const item = PAIRS[Math.floor(Math.random() * PAIRS.length)]; setCurrent(item);
    const opts = new Set([item.capital]); while (opts.size < config.optionCount) opts.add(ALL_CAPITALS[Math.floor(Math.random() * ALL_CAPITALS.length)]);
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleAnswer = (val) => { playTap(); if (val === current.capital) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); } next(); };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Başkenti nedir?</Text>
      <Text style={styles.country}>{current.country}</Text>
      <View style={styles.opts}>{options.map((opt, i) => (<TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(opt)} activeOpacity={0.7}><Text style={styles.btnText}>{opt}</Text></TouchableOpacity>))}</View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 12 },
  country: { color: COLORS.text, fontSize: 36, fontWeight: '800', marginBottom: 30 },
  opts: { width: SW - 60, gap: 12 },
  btn: { paddingVertical: 16, backgroundColor: COLORS.surface, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 18, fontWeight: '600' },
});
