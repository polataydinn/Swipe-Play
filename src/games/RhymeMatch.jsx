import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const RHYME_SETS = [
  { word: 'AY', rhyme: 'SAY', wrongs: ['GÖL', 'KUŞ', 'TAŞ'] },
  { word: 'KAR', rhyme: 'YAR', wrongs: ['GÖL', 'DENİZ', 'BAL'] },
  { word: 'GÜL', rhyme: 'BÜL', wrongs: ['TAŞ', 'KUŞ', 'SEL'] },
  { word: 'GÖZ', rhyme: 'SÖZ', wrongs: ['BAL', 'GÜN', 'YOL'] },
  { word: 'YOL', rhyme: 'KOL', wrongs: ['GÜL', 'DAĞ', 'AY'] },
  { word: 'DAĞ', rhyme: 'BAĞ', wrongs: ['GÖL', 'SEL', 'KAR'] },
  { word: 'SEL', rhyme: 'BEL', wrongs: ['AY', 'TAŞ', 'KUŞ'] },
  { word: 'KUŞ', rhyme: 'MUŞ', wrongs: ['GÜL', 'BAL', 'YOL'] },
  { word: 'BAL', rhyme: 'SAL', wrongs: ['GÖZ', 'KAR', 'DAĞ'] },
  { word: 'TAŞ', rhyme: 'BAŞ', wrongs: ['SEL', 'GÜN', 'YOL'] },
  { word: 'GÜN', rhyme: 'TÜN', wrongs: ['KUŞ', 'BAL', 'DAĞ'] },
  { word: 'DİŞ', rhyme: 'BİŞ', wrongs: ['GÖZ', 'TAŞ', 'AY'] },
  { word: 'KAP', rhyme: 'SAP', wrongs: ['GÜN', 'DAĞ', 'SEL'] },
  { word: 'SU', rhyme: 'BU', wrongs: ['GÖL', 'KAR', 'TAŞ'] },
  { word: 'AT', rhyme: 'SAT', wrongs: ['GÜL', 'YOL', 'KUŞ'] },
];

const DIFFICULTY_CONFIG = {
  0: { optionCount: 3 },
  1: { optionCount: 4 },
  2: { optionCount: 4 },
};

export default function RhymeMatch({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [current, setCurrent] = useState(RHYME_SETS[0]);
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);

  const next = () => {
    const set = RHYME_SETS[Math.floor(Math.random() * RHYME_SETS.length)];
    setCurrent(set);
    const wrongs = set.wrongs.sort(() => Math.random() - 0.5).slice(0, config.optionCount - 1);
    setOptions([set.rhyme, ...wrongs].sort(() => Math.random() - 0.5));
  };

  useEffect(() => { next(); setStreak(0); }, [difficulty]);

  const handleAnswer = (val) => {
    playTap();
    if (val === current.rhyme) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Hangi kelime kafiyeli?</Text>
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
  word: { color: COLORS.text, fontSize: 48, fontWeight: '800', marginBottom: 30 },
  options: { width: SW - 60, gap: 12 },
  btn: { paddingVertical: 16, backgroundColor: COLORS.surface, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 22, fontWeight: '600' },
});
