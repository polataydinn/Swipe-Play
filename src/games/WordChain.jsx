import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const WORD_POOL = [
  'ARABA', 'ANNE', 'ELMA', 'AYI', 'IRMAK', 'KALEM', 'MASA', 'AYAK', 'KAPI', 'İNEK',
  'KUŞ', 'ŞEKER', 'RENK', 'KAPAK', 'KAYIK', 'KÖPEK', 'KUTU', 'UZAY', 'YÜZÜK', 'KIRAZ',
  'ZEBRA', 'ASLAN', 'NILÜFER', 'RÜZGAR', 'RESIM', 'MEKTUP', 'PORTAKAL', 'LIMON', 'NEHIR',
];

const DIFFICULTY_CONFIG = {
  0: { optionCount: 3 },
  1: { optionCount: 4 },
  2: { optionCount: 4 },
};

export default function WordChain({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [currentWord, setCurrentWord] = useState('');
  const [options, setOptions] = useState([]);
  const [answer, setAnswer] = useState('');
  const [streak, setStreak] = useState(0);

  const next = () => {
    const w = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
    const lastChar = w[w.length - 1].toUpperCase();
    const correct = WORD_POOL.filter(x => x[0].toUpperCase() === lastChar && x !== w);
    if (correct.length === 0) { next(); return; }
    const ans = correct[Math.floor(Math.random() * correct.length)];
    const opts = new Set([ans]);
    while (opts.size < config.optionCount) {
      const r = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
      if (r !== w && r[0].toUpperCase() !== lastChar) opts.add(r);
    }
    setCurrentWord(w);
    setAnswer(ans);
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };

  useEffect(() => { next(); setStreak(0); }, [difficulty]);

  const handleAnswer = (val) => {
    playTap();
    if (val === answer) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Son harfle başlayan kelimeyi seç!</Text>
      <Text style={styles.word}>{currentWord}</Text>
      <Text style={styles.hint}>Son harf: <Text style={styles.hintChar}>{currentWord[currentWord.length - 1]}</Text></Text>
      <View style={styles.options}>
        {options.map((opt, i) => (
          <TouchableOpacity key={i} style={styles.optionBtn} onPress={() => handleAnswer(opt)} activeOpacity={0.7}>
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 12, textAlign: 'center' },
  word: { color: COLORS.text, fontSize: 36, fontWeight: '800', marginBottom: 8 },
  hint: { color: COLORS.textMuted, fontSize: 16, marginBottom: 24 },
  hintChar: { color: '#f59e0b', fontWeight: '800', fontSize: 20 },
  options: { width: SW - 60, gap: 12 },
  optionBtn: { paddingVertical: 16, backgroundColor: COLORS.surface, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  optionText: { color: COLORS.text, fontSize: 20, fontWeight: '600' },
});
