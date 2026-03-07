import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const PHRASES = [
  { phrase: 'Bonjour', lang: 'Fransızca' }, { phrase: 'Grazie', lang: 'İtalyanca' },
  { phrase: 'Danke', lang: 'Almanca' }, { phrase: 'Arigato', lang: 'Japonca' },
  { phrase: 'Spasibo', lang: 'Rusça' }, { phrase: 'Obrigado', lang: 'Portekizce' },
  { phrase: 'Hola', lang: 'İspanyolca' }, { phrase: 'Namaste', lang: 'Hintçe' },
  { phrase: 'Annyeong', lang: 'Korece' }, { phrase: 'Ni hao', lang: 'Çince' },
  { phrase: 'Shukran', lang: 'Arapça' }, { phrase: 'Tack', lang: 'İsveççe' },
  { phrase: 'Dziekuje', lang: 'Lehçe' }, { phrase: 'Efharisto', lang: 'Yunanca' },
  { phrase: 'Xie xie', lang: 'Çince' }, { phrase: 'Sawadee', lang: 'Tayca' },
];
const ALL_LANGS = [...new Set(PHRASES.map(p => p.lang))];
export default function LanguageGuess({ difficulty, onCorrect, onWrong }) {
  const [current, setCurrent] = useState(PHRASES[0]); const [options, setOptions] = useState([]); const [streak, setStreak] = useState(0);
  const next = () => {
    const item = PHRASES[Math.floor(Math.random() * PHRASES.length)]; setCurrent(item);
    const count = difficulty === 0 ? 3 : 4;
    const opts = new Set([item.lang]); while (opts.size < count) opts.add(ALL_LANGS[Math.floor(Math.random() * ALL_LANGS.length)]);
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleAnswer = (val) => { playTap(); if (val === current.lang) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); } next(); };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Bu hangi dil?</Text>
      <Text style={styles.phrase}>"{current.phrase}"</Text>
      <View style={styles.opts}>{options.map((opt, i) => (<TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(opt)} activeOpacity={0.7}><Text style={styles.btnText}>{opt}</Text></TouchableOpacity>))}</View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 },
  phrase: { color: '#f59e0b', fontSize: 36, fontWeight: '800', marginBottom: 30, fontStyle: 'italic' },
  opts: { width: SW - 60, gap: 12 },
  btn: { paddingVertical: 16, backgroundColor: COLORS.surface, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 18, fontWeight: '600' },
});
