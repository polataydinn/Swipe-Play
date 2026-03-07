import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const WORDS = ['GÜNEŞ', 'BAHÇE', 'KITAP', 'BULUT', 'DENİZ', 'ARABA', 'ÇIÇEK', 'KALEM', 'OKUL', 'KÖPRÜ',
  'BİLGİ', 'KELEBEK', 'ÖĞRETMEN', 'HASTANE', 'MÜZİK', 'TÜRKÇE', 'FUTBOL', 'PORTAKAL', 'SİNEMA', 'MEVSIM'];

const ALPHABET = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

const DIFFICULTY_CONFIG = {
  0: { optionCount: 3 },
  1: { optionCount: 4 },
  2: { optionCount: 6 },
};

export default function MissingLetter({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [word, setWord] = useState('');
  const [missingIdx, setMissingIdx] = useState(0);
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);

  const next = () => {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    const idx = Math.floor(Math.random() * w.length);
    const correct = w[idx];
    setWord(w);
    setMissingIdx(idx);
    const opts = new Set([correct]);
    while (opts.size < config.optionCount) {
      opts.add(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
    }
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };

  useEffect(() => { next(); setStreak(0); }, [difficulty]);

  const handleAnswer = (l) => {
    playTap();
    if (l === word[missingIdx]) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };

  const display = word.split('').map((l, i) => i === missingIdx ? '_' : l).join(' ');

  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Eksik harfi bul!</Text>
      <Text style={styles.word}>{display}</Text>
      <View style={styles.options}>
        {options.map((l, i) => (
          <TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(l)} activeOpacity={0.7}>
            <Text style={styles.btnText}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 },
  word: { color: COLORS.text, fontSize: 36, fontWeight: '800', letterSpacing: 4, marginBottom: 30 },
  options: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  btn: { width: 56, height: 56, backgroundColor: COLORS.surface, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
});
