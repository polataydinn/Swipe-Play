import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const VOWELS = 'AEIİOÖUÜ';
const WORDS = {
  0: ['GÜNEŞ', 'BULUT', 'ARABA', 'ELMA', 'OKUL', 'KAPI', 'DENİZ', 'MASA', 'ÇIÇEK', 'GECE'],
  1: ['KELEBEK', 'ÖĞRETMEN', 'PORTAKAL', 'MATEMATİK', 'HASTANE', 'SİNEMA', 'FUTBOL', 'RESTORAN', 'KÜTÜPHANE', 'ÜNİVERSİTE'],
  2: ['BİLGİSAYAR', 'TELEVİZYON', 'SORUMLULUK', 'ARAŞTIRMACI', 'DÜŞÜNCE', 'LABORATUVAR', 'HELIKOPTER', 'ÜNIVERSITE', 'HAYVANAT', 'MÜHENDİSLİK'],
};

const DIFFICULTY_CONFIG = { 0: {}, 1: {}, 2: {} };

export default function VowelCount({ difficulty, onCorrect, onWrong }) {
  const wordList = WORDS[difficulty] || WORDS[0];
  const [word, setWord] = useState('');
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);

  const next = () => {
    const w = wordList[Math.floor(Math.random() * wordList.length)];
    setWord(w);
    const count = w.split('').filter(c => VOWELS.includes(c)).length;
    const opts = new Set([count]);
    while (opts.size < 4) {
      const v = count + Math.floor(Math.random() * 5) - 2;
      if (v >= 0) opts.add(v);
    }
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };

  useEffect(() => { next(); setStreak(0); }, [difficulty]);

  const correct = word.split('').filter(c => VOWELS.includes(c)).length;

  const handleAnswer = (val) => {
    playTap();
    if (val === correct) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Bu kelimede kaç sesli harf var?</Text>
      <Text style={styles.word}>{word}</Text>
      <View style={styles.options}>
        {options.map((opt, i) => (
          <TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(opt)} activeOpacity={0.7}>
            <Text style={styles.btnText}>{opt}</Text>
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
  word: { color: COLORS.text, fontSize: 36, fontWeight: '800', marginBottom: 30 },
  options: { flexDirection: 'row', gap: 16 },
  btn: { width: 60, height: 60, backgroundColor: COLORS.surface, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
});
