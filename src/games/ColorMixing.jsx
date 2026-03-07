import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playTick } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const COLOR_MIXES = [
  { result: '#FFA500', resultName: 'Turuncu', colors: ['Kırmızı', 'Sarı'], colorCodes: ['#FF0000', '#FFFF00'] },
  { result: '#800080', resultName: 'Mor', colors: ['Kırmızı', 'Mavi'], colorCodes: ['#FF0000', '#0000FF'] },
  { result: '#008000', resultName: 'Yeşil', colors: ['Mavi', 'Sarı'], colorCodes: ['#0000FF', '#FFFF00'] },
  { result: '#FFC0CB', resultName: 'Pembe', colors: ['Kırmızı', 'Beyaz'], colorCodes: ['#FF0000', '#FFFFFF'] },
  { result: '#808080', resultName: 'Gri', colors: ['Siyah', 'Beyaz'], colorCodes: ['#000000', '#FFFFFF'] },
  { result: '#A52A2A', resultName: 'Kahverengi', colors: ['Kırmızı', 'Yeşil'], colorCodes: ['#FF0000', '#008000'] },
];

const ALL_COLORS = [
  { name: 'Kırmızı', code: '#FF0000' },
  { name: 'Mavi', code: '#0000FF' },
  { name: 'Sarı', code: '#FFFF00' },
  { name: 'Beyaz', code: '#FFFFFF' },
  { name: 'Siyah', code: '#000000' },
  { name: 'Yeşil', code: '#008000' },
];

const DIFFICULTY_CONFIG = {
  0: { optionCount: 3, time: 15000 },
  1: { optionCount: 4, time: 10000 },
  2: { optionCount: 6, time: 6000 },
};

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ColorMixing({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [currentMix, setCurrentMix] = useState(null);
  const [selected, setSelected] = useState([]);
  const [options, setOptions] = useState([]);
  const [round, setRound] = useState(0);

  const loadRound = useCallback(() => {
    const mix = COLOR_MIXES[Math.floor(Math.random() * COLOR_MIXES.length)];
    // Build options: include correct colors + random others
    const correctColors = mix.colors.map((name) => ALL_COLORS.find((c) => c.name === name));
    const wrongColors = shuffleArray(ALL_COLORS.filter((c) => !mix.colors.includes(c.name)));
    const optList = shuffleArray([...correctColors, ...wrongColors.slice(0, config.optionCount - 2)]);
    setCurrentMix(mix);
    setOptions(optList);
    setSelected([]);
  }, [config.optionCount]);

  useEffect(() => {
    loadRound();
  }, [difficulty, round]);

  const handleSelect = (color) => {
    playTap();
    if (selected.length >= 2) return;
    const newSelected = [...selected, color];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      const names = newSelected.map((c) => c.name).sort();
      const correct = [...currentMix.colors].sort();
      if (names[0] === correct[0] && names[1] === correct[1]) {
        onCorrect();
        setTimeout(() => setRound((r) => r + 1), 800);
      } else {
        onWrong();
        setTimeout(() => setSelected([]), 500);
      }
    }
  };

  if (!currentMix) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.question}>Bu rengi elde etmek için{'\n'}hangi 2 rengi karıştırmalısın?</Text>
      <View style={[styles.targetColor, { backgroundColor: currentMix.result }]}>
        <Text style={[styles.targetText, { color: currentMix.result === '#000000' ? '#fff' : '#000' }]}>
          {currentMix.resultName}
        </Text>
      </View>
      <View style={styles.selectedRow}>
        {[0, 1].map((i) => (
          <View
            key={i}
            style={[
              styles.selectedSlot,
              selected[i] && { backgroundColor: selected[i].code, borderColor: selected[i].code },
            ]}
          >
            <Text style={styles.selectedText}>{selected[i]?.name || '?'}</Text>
          </View>
        ))}
        <Text style={styles.plus}>+</Text>
      </View>
      <View style={styles.optionsGrid}>
        {options.map((color, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.optionBtn, { backgroundColor: color.code }]}
            onPress={() => handleSelect(color)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, {
              color: ['#FFFF00', '#FFFFFF'].includes(color.code) ? '#000' : '#fff',
            }]}>
              {color.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  question: { color: COLORS.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 20 },
  targetColor: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  targetText: { fontSize: 14, fontWeight: '700' },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 30 },
  selectedSlot: {
    width: 80, height: 60, borderRadius: 12,
    backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
  },
  selectedText: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  plus: { color: COLORS.textMuted, fontSize: 24, fontWeight: '700' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  optionBtn: {
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12,
    minWidth: 90, alignItems: 'center',
  },
  optionText: { fontSize: 14, fontWeight: '700' },
});
