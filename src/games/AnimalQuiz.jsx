import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const ANIMALS = [
  { emoji: '🐘', name: 'Fil', fact: 'En büyük kara hayvanı' }, { emoji: '🐆', name: 'Çita', fact: 'En hızlı kara hayvanı' },
  { emoji: '🦒', name: 'Zürafa', fact: 'En uzun boyunlu hayvan' }, { emoji: '🐋', name: 'Balina', fact: 'En büyük deniz memelisi' },
  { emoji: '🐢', name: 'Kaplumbağa', fact: 'En uzun yaşayan sürüngen' }, { emoji: '🦅', name: 'Kartal', fact: 'Güçlü pençeli yırtıcı kuş' },
  { emoji: '🐬', name: 'Yunus', fact: 'Akıllı deniz memelisi' }, { emoji: '🦁', name: 'Aslan', fact: 'Ormanların kralı' },
  { emoji: '🐧', name: 'Penguen', fact: 'Uçamayan kutup kuşu' }, { emoji: '🐨', name: 'Koala', fact: 'Okaliptüs yaprakları yer' },
  { emoji: '🦈', name: 'Köpekbalığı', fact: 'Denizlerin yırtıcısı' }, { emoji: '🐙', name: 'Ahtapot', fact: 'Sekiz kollu deniz canlısı' },
  { emoji: '🦩', name: 'Flamingo', fact: 'Pembe tüylü uzun bacaklı kuş' }, { emoji: '🐺', name: 'Kurt', fact: 'Sürü halinde avlanan etçil' },
  { emoji: '🦜', name: 'Papağan', fact: 'Konuşabilen renkli kuş' },
];
const ALL_NAMES = ANIMALS.map(a => a.name);
const DIFFICULTY_CONFIG = { 0: { mode: 'name', optionCount: 3 }, 1: { mode: 'fact', optionCount: 4 }, 2: { mode: 'fact', optionCount: 4 } };
export default function AnimalQuiz({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [current, setCurrent] = useState(ANIMALS[0]); const [options, setOptions] = useState([]); const [streak, setStreak] = useState(0);
  const next = () => {
    const item = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]; setCurrent(item);
    if (config.mode === 'name') {
      const opts = new Set([item.name]); while (opts.size < config.optionCount) opts.add(ALL_NAMES[Math.floor(Math.random() * ALL_NAMES.length)]);
      setOptions([...opts].sort(() => Math.random() - 0.5));
    } else {
      const opts = new Set([item.fact]); while (opts.size < config.optionCount) opts.add(ANIMALS[Math.floor(Math.random() * ANIMALS.length)].fact);
      setOptions([...opts].sort(() => Math.random() - 0.5));
    }
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const answer = config.mode === 'name' ? current.name : current.fact;
  const handleAnswer = (val) => { playTap(); if (val === answer) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); } next(); };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>{config.mode === 'name' ? 'Bu hangi hayvan?' : 'Bu hayvanın özelliği?'}</Text>
      <Text style={styles.emoji}>{current.emoji}</Text>
      <View style={styles.opts}>{options.map((opt, i) => (<TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(opt)} activeOpacity={0.7}><Text style={styles.btnText}>{opt}</Text></TouchableOpacity>))}</View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 },
  emoji: { fontSize: 80, marginBottom: 24 },
  opts: { width: SW - 60, gap: 10 },
  btn: { paddingVertical: 14, backgroundColor: COLORS.surface, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
});
