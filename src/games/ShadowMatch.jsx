import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const SHAPES = [
  { emoji: '⭐', name: 'Yıldız' }, { emoji: '❤️', name: 'Kalp' }, { emoji: '🔷', name: 'Elmas' },
  { emoji: '🔶', name: 'Turuncu Elmas' }, { emoji: '⬛', name: 'Kare' }, { emoji: '🔺', name: 'Üçgen' },
  { emoji: '⚡', name: 'Şimşek' }, { emoji: '🌙', name: 'Ay' }, { emoji: '☁️', name: 'Bulut' },
  { emoji: '🍀', name: 'Yonca' }, { emoji: '🎈', name: 'Balon' }, { emoji: '🔔', name: 'Çan' },
];
const DIFFICULTY_CONFIG = { 0: { options: 3 }, 1: { options: 4 }, 2: { options: 5 } };
export default function ShadowMatch({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [target, setTarget] = useState(null);
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const pool = [...SHAPES].sort(() => Math.random() - 0.5).slice(0, config.options);
    const t = pool[Math.floor(Math.random() * pool.length)];
    setTarget(t);
    setOptions(pool.sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleAnswer = (shape) => {
    playTap();
    if (shape.name === target.name) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };
  if (!target) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Gölgenin sahibi hangisi?</Text>
      <View style={styles.shadowBox}>
        <Text style={styles.shadow}>{target.emoji}</Text>
      </View>
      <View style={styles.options}>
        {options.map((s, i) => (
          <TouchableOpacity key={i} style={styles.optBtn} onPress={() => handleAnswer(s)} activeOpacity={0.7}>
            <Text style={styles.optEmoji}>{s.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 20 },
  shadowBox: { width: 100, height: 100, backgroundColor: '#1a1a2e', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  shadow: { fontSize: 48, opacity: 0.15 },
  options: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  optBtn: { width: 64, height: 64, backgroundColor: COLORS.surface, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  optEmoji: { fontSize: 32 },
});
