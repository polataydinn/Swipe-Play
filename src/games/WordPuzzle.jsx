import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playTick } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');

const WORDS = {
  0: [
    { word: 'GÜNEŞ', hint: 'Gökyüzündeki ışık kaynağı' },
    { word: 'DENIZ', hint: 'Tuzlu su kütlesi' },
    { word: 'KITAP', hint: 'Okumak için sayfalı nesne' },
    { word: 'BULUT', hint: 'Gökyüzündeki beyaz şekiller' },
    { word: 'ÇIÇEK', hint: 'Bahçedeki renkli bitki' },
  ],
  1: [
    { word: 'KELEBEK', hint: 'Renkli kanatlı böcek' },
    { word: 'DEPREM', hint: 'Yer kabuğunun sarsılması' },
    { word: 'ORKESTRA', hint: 'Müzik topluluğu' },
    { word: 'MACERA', hint: 'Heyecanlı deneyim' },
    { word: 'GEZEGEN', hint: 'Güneş etrafında döner' },
  ],
  2: [
    { word: 'ASTRONOT', hint: 'Uzaya giden kişi' },
    { word: 'FELSEFE', hint: 'Düşünce bilimi' },
    { word: 'NOSTALJI', hint: 'Geçmişe özlem' },
    { word: 'MELODI', hint: 'Müzikal nota dizisi' },
    { word: 'VOLKAN', hint: 'Lav püskürten dağ' },
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

export default function WordPuzzle({ difficulty, onCorrect, onWrong }) {
  const wordList = WORDS[difficulty] || WORDS[0];
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState([]);
  const [letters, setLetters] = useState([]);
  const [solved, setSolved] = useState(false);

  const loadWord = useCallback((idx) => {
    const word = wordList[idx % wordList.length];
    const extra = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';
    const wordLetters = word.word.split('');
    const extraCount = Math.max(3, 6 - wordLetters.length);
    const extraLetters = Array.from({ length: extraCount }, () =>
      extra[Math.floor(Math.random() * extra.length)]
    );
    setLetters(shuffleArray([...wordLetters, ...extraLetters]).map((l, i) => ({ letter: l, id: i, used: false })));
    setSelected([]);
    setSolved(false);
  }, [wordList]);

  useEffect(() => {
    loadWord(0);
    setCurrent(0);
  }, [difficulty]);

  const wordData = wordList[current % wordList.length];

  // Dynamic slot size based on word length
  const wordLen = wordData.word.length;
  const maxSlotWidth = Math.floor((SW - 40 - (wordLen - 1) * 4) / wordLen);
  const slotSize = Math.min(40, maxSlotWidth);

  const handleLetterPress = (item) => {
    playTap();
    if (item.used || solved) return;
    const newSelected = [...selected, item];
    setSelected(newSelected);
    setLetters((prev) => prev.map((l) => (l.id === item.id ? { ...l, used: true } : l)));

    const guess = newSelected.map((s) => s.letter).join('');
    if (guess === wordData.word) {
      setSolved(true);
      onCorrect();
      setTimeout(() => {
        setCurrent((c) => c + 1);
        loadWord(current + 1);
      }, 800);
    } else if (guess.length >= wordData.word.length) {
      onWrong();
      setLetters((prev) => prev.map((l) => ({ ...l, used: false })));
      setSelected([]);
    }
  };

  const handleRemoveLast = () => {
    playTap();
    if (selected.length === 0) return;
    const last = selected[selected.length - 1];
    setSelected((prev) => prev.slice(0, -1));
    setLetters((prev) => prev.map((l) => (l.id === last.id ? { ...l, used: false } : l)));
  };

  // Dynamic letter button size
  const totalLetters = letters.length;
  const cols = Math.min(totalLetters, 6);
  const letterBtnSize = Math.min(44, Math.floor((SW - 40 - (cols - 1) * 8) / cols));

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>💡 {wordData.hint}</Text>
      <View style={styles.wordSlots}>
        {wordData.word.split('').map((_, i) => (
          <View key={i} style={[styles.slot, { width: slotSize, height: slotSize }, solved && styles.slotCorrect]}>
            <Text style={[styles.slotText, { fontSize: slotSize * 0.5 }]}>{selected[i]?.letter || ''}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity onPress={handleRemoveLast} style={styles.undoBtn}>
        <Text style={styles.undoText}>← Geri Al</Text>
      </TouchableOpacity>
      <View style={styles.letterGrid}>
        {letters.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.letterBtn,
              { width: letterBtnSize, height: letterBtnSize },
              item.used && styles.letterUsed,
            ]}
            onPress={() => handleLetterPress(item)}
            disabled={item.used}
            activeOpacity={0.7}
          >
            <Text style={[styles.letterText, { fontSize: letterBtnSize * 0.4 }, item.used && styles.letterTextUsed]}>
              {item.letter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.counter}>{(current % wordList.length) + 1} / {wordList.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  hint: { color: COLORS.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 20 },
  wordSlots: { flexDirection: 'row', gap: 4, marginBottom: 14, flexWrap: 'wrap', justifyContent: 'center' },
  slot: {
    backgroundColor: COLORS.surface, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.surfaceLight,
  },
  slotCorrect: { borderColor: '#22c55e', backgroundColor: '#22c55e20' },
  slotText: { color: COLORS.text, fontWeight: '700' },
  undoBtn: { marginBottom: 16 },
  undoText: { color: COLORS.textMuted, fontSize: 14 },
  letterGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: SW - 32 },
  letterBtn: {
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight, justifyContent: 'center', alignItems: 'center',
  },
  letterUsed: { backgroundColor: COLORS.surface, opacity: 0.3 },
  letterText: { color: COLORS.text, fontWeight: '600' },
  letterTextUsed: { color: COLORS.textMuted },
  counter: { color: COLORS.textMuted, fontSize: 13, marginTop: 16 },
});
