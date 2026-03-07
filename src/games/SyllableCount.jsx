import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const WORD_DATA = [
  { word: 'EV', syllables: 1 }, { word: 'ARABA', syllables: 3 }, { word: 'GÜNEŞ', syllables: 2 },
  { word: 'BAHÇE', syllables: 2 }, { word: 'KİTAP', syllables: 2 }, { word: 'OKUL', syllables: 2 },
  { word: 'KALEM', syllables: 2 }, { word: 'DENİZ', syllables: 2 }, { word: 'KELEBEK', syllables: 3 },
  { word: 'ÖĞRETMEN', syllables: 3 }, { word: 'BİLGİSAYAR', syllables: 4 }, { word: 'ÜNİVERSİTE', syllables: 5 },
  { word: 'MATEMATİK', syllables: 4 }, { word: 'HASTANE', syllables: 3 }, { word: 'SİNEMA', syllables: 3 },
  { word: 'PORTAKAL', syllables: 3 }, { word: 'KÜTÜPHANE', syllables: 4 }, { word: 'TELEVİZYON', syllables: 4 },
  { word: 'AY', syllables: 1 }, { word: 'GÖL', syllables: 1 }, { word: 'BAL', syllables: 1 },
  { word: 'ÇIÇEK', syllables: 2 }, { word: 'KUZU', syllables: 2 }, { word: 'MÜZİK', syllables: 2 },
];

const DIFFICULTY_CONFIG = { 0: {}, 1: {}, 2: {} };

export default function SyllableCount({ difficulty, onCorrect, onWrong }) {
  const [current, setCurrent] = useState(WORD_DATA[0]);
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);

  const next = () => {
    const item = WORD_DATA[Math.floor(Math.random() * WORD_DATA.length)];
    setCurrent(item);
    const opts = new Set([item.syllables]);
    while (opts.size < 4) {
      const v = item.syllables + Math.floor(Math.random() * 5) - 2;
      if (v > 0) opts.add(v);
    }
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };

  useEffect(() => { next(); setStreak(0); }, [difficulty]);

  const handleAnswer = (val) => {
    playTap();
    if (val === current.syllables) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Bu kelime kaç heceli?</Text>
      <Text style={styles.word}>{current.word}</Text>
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
  word: { color: COLORS.text, fontSize: 40, fontWeight: '800', marginBottom: 30 },
  options: { flexDirection: 'row', gap: 16 },
  btn: { width: 60, height: 60, backgroundColor: COLORS.surface, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
});
