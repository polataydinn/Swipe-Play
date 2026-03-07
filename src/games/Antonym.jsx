import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const PAIRS = [
  ['Büyük', 'Küçük'], ['Sıcak', 'Soğuk'], ['Hızlı', 'Yavaş'], ['Güzel', 'Çirkin'],
  ['Uzun', 'Kısa'], ['Zengin', 'Fakir'], ['Kolay', 'Zor'], ['Güçlü', 'Zayıf'],
  ['Doğru', 'Yanlış'], ['İyi', 'Kötü'], ['Yaşlı', 'Genç'], ['Açık', 'Kapalı'],
  ['Dolu', 'Boş'], ['Geniş', 'Dar'], ['Kalın', 'İnce'], ['Ağır', 'Hafif'],
  ['Ucuz', 'Pahalı'], ['Temiz', 'Kirli'], ['Aydınlık', 'Karanlık'], ['Mutlu', 'Üzgün'],
  ['Cesur', 'Korkak'], ['Sessiz', 'Gürültülü'], ['Tatlı', 'Acı'], ['Yumuşak', 'Sert'],
];

const ALL_WORDS = PAIRS.flat();

const DIFFICULTY_CONFIG = {
  0: { optionCount: 3, time: 10000 },
  1: { optionCount: 4, time: 7000 },
  2: { optionCount: 4, time: 4000 },
};

export default function Antonym({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [word, setWord] = useState('');
  const [answer, setAnswer] = useState('');
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);

  const next = () => {
    const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
    const flip = Math.random() > 0.5;
    const w = flip ? pair[1] : pair[0];
    const a = flip ? pair[0] : pair[1];
    setWord(w);
    setAnswer(a);
    const opts = new Set([a]);
    while (opts.size < config.optionCount) {
      const rw = ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)];
      if (rw !== w) opts.add(rw);
    }
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
      <Text style={styles.label}>Zıt anlamlısı nedir?</Text>
      <Text style={styles.word}>{word}</Text>
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
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 12 },
  word: { color: COLORS.text, fontSize: 40, fontWeight: '800', marginBottom: 30 },
  options: { width: SW - 60, gap: 12 },
  optionBtn: { paddingVertical: 16, backgroundColor: COLORS.surface, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  optionText: { color: COLORS.text, fontSize: 20, fontWeight: '600' },
});
