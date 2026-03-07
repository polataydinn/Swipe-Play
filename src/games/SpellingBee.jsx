import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const WORDS = {
  0: ['GÜNEŞ', 'BAHÇE', 'KITAP', 'BULUT', 'DENİZ', 'OKUL', 'ÇIÇEK', 'KUZU', 'ARABA', 'KAPAK'],
  1: ['KELEBEK', 'ÖĞRETMEN', 'HASTANE', 'MÜZİK', 'TÜRKÇE', 'FUTBOL', 'KARDEŞ', 'BİLGİ', 'SİNEMA', 'MİLLET'],
  2: ['BİLGİSAYAR', 'KÜTÜPHANE', 'ÜNİVERSİTE', 'TELEVİZYON', 'MATEMATİK', 'LABORATUVAR', 'MÜHENDİS', 'ARAŞTIRMA', 'SORUMLU', 'GÜVENLİK'],
};

const DIFFICULTY_CONFIG = {
  0: { showTime: 3000 },
  1: { showTime: 2000 },
  2: { showTime: 1500 },
};

const ALPHABET = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

export default function SpellingBee({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const wordList = WORDS[difficulty] || WORDS[0];
  const [word, setWord] = useState('');
  const [phase, setPhase] = useState('show');
  const [input, setInput] = useState('');

  const newRound = () => {
    setWord(wordList[Math.floor(Math.random() * wordList.length)]);
    setInput('');
    setPhase('show');
  };

  useEffect(() => { newRound(); }, [difficulty]);

  useEffect(() => {
    if (phase === 'show') {
      const t = setTimeout(() => setPhase('spell'), config.showTime);
      return () => clearTimeout(t);
    }
  }, [phase, config.showTime]);

  const handleLetter = (l) => {
    playTap();
    const newInput = input + l;
    setInput(newInput);
    if (newInput.length === word.length) {
      if (newInput === word) { onCorrect(); } else { onWrong(); }
      setTimeout(newRound, 500);
    }
  };

  const handleDelete = () => {
    playTap();
    setInput(input.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      {phase === 'show' && (
        <>
          <Text style={styles.label}>Bu kelimeyi ezberle!</Text>
          <Text style={styles.word}>{word}</Text>
        </>
      )}
      {phase === 'spell' && (
        <>
          <Text style={styles.label}>Kelimeyi yaz!</Text>
          <View style={styles.inputRow}>
            {word.split('').map((_, i) => (
              <View key={i} style={[styles.slot, input[i] && styles.slotFilled]}>
                <Text style={styles.slotText}>{input[i] || ''}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}><Text style={styles.deleteText}>⌫ Sil</Text></TouchableOpacity>
          <View style={styles.keyboard}>
            {ALPHABET.map(l => (
              <TouchableOpacity key={l} style={styles.key} onPress={() => handleLetter(l)} activeOpacity={0.7}>
                <Text style={styles.keyText}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 16 },
  word: { color: COLORS.text, fontSize: 40, fontWeight: '800' },
  inputRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' },
  slot: { width: 34, height: 40, backgroundColor: COLORS.surface, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  slotFilled: { borderColor: '#22c55e' },
  slotText: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  deleteBtn: { marginBottom: 12 },
  deleteText: { color: COLORS.textMuted, fontSize: 14 },
  keyboard: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', maxWidth: SW - 40 },
  key: { width: 32, height: 36, backgroundColor: COLORS.surface, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  keyText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
});
