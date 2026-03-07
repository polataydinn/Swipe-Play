import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playTick } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const PUZZLES = {
  0: [
    { emojis: '☀️🌊', answer: 'Plaj', options: ['Plaj', 'Orman', 'Dağ', 'Göl'] },
    { emojis: '🍕🧀', answer: 'Pizza', options: ['Pizza', 'Burger', 'Tost', 'Lahmacun'] },
    { emojis: '⚽🏟️', answer: 'Futbol', options: ['Futbol', 'Basketbol', 'Tenis', 'Yüzme'] },
    { emojis: '📚✏️', answer: 'Okul', options: ['Okul', 'Kütüphane', 'Ofis', 'Müze'] },
    { emojis: '🎂🎁', answer: 'Doğum Günü', options: ['Doğum Günü', 'Yılbaşı', 'Düğün', 'Bayram'] },
    { emojis: '🌙⭐', answer: 'Gece', options: ['Gece', 'Uzay', 'Rüya', 'Ay'] },
  ],
  1: [
    { emojis: '🎭🎪🤡', answer: 'Sirk', options: ['Sirk', 'Tiyatro', 'Sinema', 'Konser'] },
    { emojis: '🔑🚪🏠', answer: 'Eve Giriş', options: ['Eve Giriş', 'Kilit', 'Taşınma', 'Hırsız'] },
    { emojis: '✈️🌍🧳', answer: 'Seyahat', options: ['Seyahat', 'Göç', 'Tatil', 'İş'] },
    { emojis: '🎵🎸🎤', answer: 'Konser', options: ['Konser', 'Karaoke', 'Stüdyo', 'Parti'] },
    { emojis: '💊🏥👨‍⚕️', answer: 'Hastane', options: ['Hastane', 'Eczane', 'Klinik', 'Ameliyat'] },
    { emojis: '🌧️☂️💨', answer: 'Fırtına', options: ['Fırtına', 'Yağmur', 'Sonbahar', 'Sel'] },
  ],
  2: [
    { emojis: '🧠💡🔬', answer: 'Bilim', options: ['Bilim', 'Felsefe', 'Buluş', 'Deney'] },
    { emojis: '⏰🏃💨', answer: 'Geç Kalmak', options: ['Geç Kalmak', 'Koşu', 'Acele', 'Yarış'] },
    { emojis: '🎯🏹👑', answer: 'Hedef', options: ['Hedef', 'Şampiyon', 'Avcı', 'Kral'] },
    { emojis: '🌱💧☀️', answer: 'Büyümek', options: ['Büyümek', 'Bahçe', 'Tarım', 'Doğa'] },
    { emojis: '💔😢🌧️', answer: 'Hüzün', options: ['Hüzün', 'Ayrılık', 'Yalnızlık', 'Ağlama'] },
    { emojis: '🦁👑🌍', answer: 'Aslan Kral', options: ['Aslan Kral', 'Safari', 'Afrika', 'Hayvanat'] },
  ],
};

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function EmojiGuess({ difficulty, onCorrect, onWrong }) {
  const puzzles = PUZZLES[difficulty] || PUZZLES[0];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState([]);

  useEffect(() => {
    setCurrentIdx(0);
    setAnswered(false);
  }, [difficulty]);

  useEffect(() => {
    const puzzle = puzzles[currentIdx % puzzles.length];
    setShuffledOptions(shuffleArray(puzzle.options));
    setAnswered(false);
  }, [currentIdx, difficulty]);

  const puzzle = puzzles[currentIdx % puzzles.length];

  const handleAnswer = (option) => {
    playTap();
    if (answered) return;
    setAnswered(true);
    if (option === puzzle.answer) {
      onCorrect();
      setTimeout(() => setCurrentIdx((i) => i + 1), 600);
    } else {
      onWrong();
      setTimeout(() => setAnswered(false), 500);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Bu emojiler ne anlatıyor?</Text>
      <Text style={styles.emojis}>{puzzle.emojis}</Text>
      <View style={styles.options}>
        {shuffledOptions.map((opt, i) => (
          <TouchableOpacity
            key={`${opt}-${i}`}
            style={[
              styles.optionBtn,
              answered && opt === puzzle.answer && styles.correct,
              answered && opt !== puzzle.answer && styles.wrong,
            ]}
            onPress={() => handleAnswer(opt)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.counter}>{(currentIdx % puzzles.length) + 1} / {puzzles.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 24 },
  emojis: { fontSize: 56, marginBottom: 40, textAlign: 'center' },
  options: { width: SW - 60, gap: 12 },
  optionBtn: {
    paddingVertical: 16, paddingHorizontal: 20,
    backgroundColor: COLORS.surface, borderRadius: 14,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight,
  },
  correct: { borderColor: '#22c55e', backgroundColor: '#22c55e20' },
  wrong: { borderColor: '#ef4444', backgroundColor: '#ef444420' },
  optionText: { color: COLORS.text, fontSize: 18, fontWeight: '600' },
  counter: { color: COLORS.textMuted, fontSize: 14, marginTop: 20 },
});
