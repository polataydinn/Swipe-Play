import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const WORDS = {
  0: ['ARABA', 'KITAP', 'KALEM', 'BAHÇE', 'GÜNEŞ', 'OKUL', 'MASA', 'DEFTER', 'BULUT', 'DENİZ'],
  1: ['BİLGİSAYAR', 'KÜTÜPHANE', 'ÖĞRETMEN', 'HASTANE', 'MÜZİK', 'TÜRKÇE', 'MARKET', 'FUTBOL', 'RESTORAN', 'SİNEMA'],
  2: ['ÜNİVERSİTE', 'TELEVİZYON', 'SORUMLULUK', 'ARAŞTIRMA', 'GÜVENLİK', 'BİLGİSAYAR', 'HELIKOPTER', 'MATEMATİK', 'FİZYOLOJİ', 'LABORATUVAR'],
};

const DIFFICULTY_CONFIG = {
  0: { maxWrong: 6 },
  1: { maxWrong: 5 },
  2: { maxWrong: 4 },
};

const ALPHABET = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

export default function HangmanGame({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const wordList = WORDS[difficulty] || WORDS[0];
  const [word, setWord] = useState('');
  const [guessed, setGuessed] = useState(new Set());
  const [wrongCount, setWrongCount] = useState(0);

  const newRound = () => {
    setWord(wordList[Math.floor(Math.random() * wordList.length)]);
    setGuessed(new Set());
    setWrongCount(0);
  };

  useEffect(() => { newRound(); }, [difficulty]);

  const handleGuess = (letter) => {
    playTap();
    if (guessed.has(letter)) return;
    const newGuessed = new Set(guessed);
    newGuessed.add(letter);
    setGuessed(newGuessed);

    if (!word.includes(letter)) {
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      if (newWrong >= config.maxWrong) {
        onWrong();
        setTimeout(newRound, 800);
      }
    } else {
      const allFound = word.split('').every(l => newGuessed.has(l));
      if (allFound) {
        onCorrect();
        setTimeout(newRound, 800);
      }
    }
  };

  const display = word.split('').map(l => guessed.has(l) ? l : '_').join(' ');
  const hangmanParts = ['😵', '🫁', '💪', '🤚', '🦵', '🦶'];

  return (
    <View style={styles.container}>
      <Text style={styles.lives}>{'❤️'.repeat(config.maxWrong - wrongCount)}{'🖤'.repeat(wrongCount)}</Text>
      <Text style={styles.word}>{display}</Text>
      <View style={styles.keyboard}>
        {ALPHABET.map(l => (
          <TouchableOpacity key={l} style={[styles.key, guessed.has(l) && (word.includes(l) ? styles.keyCorrect : styles.keyWrong)]} onPress={() => handleGuess(l)} activeOpacity={0.7} disabled={guessed.has(l)}>
            <Text style={[styles.keyText, guessed.has(l) && styles.keyTextUsed]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  lives: { fontSize: 18, marginBottom: 16 },
  word: { color: COLORS.text, fontSize: 32, fontWeight: '800', letterSpacing: 4, marginBottom: 30, textAlign: 'center' },
  keyboard: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: SW - 40 },
  key: { width: 36, height: 40, backgroundColor: COLORS.surface, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  keyCorrect: { backgroundColor: '#22c55e30' },
  keyWrong: { backgroundColor: '#ef444430' },
  keyText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  keyTextUsed: { opacity: 0.4 },
});
