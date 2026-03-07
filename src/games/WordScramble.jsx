import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const WORDS = {
  0: ['ELMA', 'ARMA', 'KALE', 'MASA', 'YÜCE', 'BABA', 'DOST', 'GÜCE', 'OKUL', 'ADIM', 'TAZE', 'GECE', 'YÜZÜ', 'KAPI', 'DERE'],
  1: ['DÜNYA', 'KITAP', 'BAHÇE', 'GÜNEŞ', 'HAYAT', 'RENGI', 'MUTLU', 'BULUT', 'DENIZ', 'KÖPRÜ', 'SINIF', 'DEVAM', 'MERAK', 'SEBEP', 'HAFTA'],
  2: ['BILGISAYAR', 'KÜTÜPHANE', 'ÜNIVERSITE', 'ÖĞRETMEN', 'HASTANE', 'TELEVIZYON', 'HAYVANAT', 'DÜŞÜNCE', 'SORUMLULUK', 'ARAŞTIRMA', 'ÇALIŞKAN', 'BAŞARILI', 'GÜVENLIK', 'DÜZENLEME', 'PAYLAŞIM'],
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export default function WordScramble({ difficulty, onCorrect, onWrong }) {
  const words = WORDS[difficulty] || WORDS[0];
  const [word, setWord] = useState('');
  const [scrambled, setScrambled] = useState([]);
  const [selected, setSelected] = useState([]);
  const [available, setAvailable] = useState([]);

  const newRound = () => {
    const w = words[Math.floor(Math.random() * words.length)];
    setWord(w);
    const s = shuffle(w.split(''));
    setScrambled(s);
    setAvailable(s.map((_, i) => i));
    setSelected([]);
  };

  useEffect(() => { newRound(); }, [difficulty]);

  const handleSelect = (idx) => {
    playTap();
    const newSel = [...selected, scrambled[idx]];
    setSelected(newSel);
    setAvailable(available.filter(i => i !== idx));
    if (newSel.length === word.length) {
      if (newSel.join('') === word) { onCorrect(); } else { onWrong(); }
      setTimeout(newRound, 500);
    }
  };

  const handleUndo = () => {
    playTap();
    if (selected.length === 0) return;
    const lastLetter = selected[selected.length - 1];
    const lastIdx = scrambled.findIndex((l, i) => l === lastLetter && !available.includes(i));
    setSelected(selected.slice(0, -1));
    setAvailable([...available, lastIdx].sort((a, b) => a - b));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>Harfleri doğru sıraya diz!</Text>
      <View style={styles.answer}>
        {word.split('').map((_, i) => (
          <View key={i} style={[styles.slot, selected[i] && styles.slotFilled]}>
            <Text style={styles.slotText}>{selected[i] || ''}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity onPress={handleUndo} style={styles.undoBtn} activeOpacity={0.7}>
        <Text style={styles.undoText}>↩ Geri Al</Text>
      </TouchableOpacity>
      <View style={styles.letters}>
        {scrambled.map((l, i) => (
          <TouchableOpacity key={i} style={[styles.letterBtn, !available.includes(i) && styles.letterUsed]} onPress={() => handleSelect(i)} activeOpacity={0.7} disabled={!available.includes(i)}>
            <Text style={styles.letterText}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  instruction: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 24 },
  answer: { flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' },
  slot: { width: 38, height: 44, backgroundColor: COLORS.surface, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  slotFilled: { borderColor: '#22c55e' },
  slotText: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  undoBtn: { marginBottom: 20 },
  undoText: { color: COLORS.textMuted, fontSize: 14 },
  letters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  letterBtn: { width: 44, height: 50, backgroundColor: COLORS.surfaceLight, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  letterUsed: { opacity: 0.2 },
  letterText: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
});
