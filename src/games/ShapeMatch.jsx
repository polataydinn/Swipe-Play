import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const SHAPES = ['●', '■', '▲', '◆', '★', '⬟', '▼', '◀', '▶', '⬤'];

const DIFFICULTY_CONFIG = {
  0: { optionCount: 4 },
  1: { optionCount: 6 },
  2: { optionCount: 8 },
};

export default function ShapeMatch({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [target, setTarget] = useState('');
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);

  const next = () => {
    const t = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    setTarget(t);
    const opts = new Set([t]);
    while (opts.size < config.optionCount) opts.add(SHAPES[Math.floor(Math.random() * SHAPES.length)]);
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };

  useEffect(() => { next(); setStreak(0); }, [difficulty]);

  const handlePress = (s) => {
    playTap();
    if (s === target) { onCorrect(); setStreak(x => x + 1); } else { onWrong(); setStreak(0); }
    next();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Aynı şekli bul!</Text>
      <Text style={styles.target}>{target}</Text>
      <View style={styles.options}>
        {options.map((s, i) => (
          <TouchableOpacity key={i} style={styles.btn} onPress={() => handlePress(s)} activeOpacity={0.7}>
            <Text style={styles.btnText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 10 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 },
  target: { fontSize: 80, marginBottom: 30 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  btn: { width: 70, height: 70, backgroundColor: COLORS.surface, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { fontSize: 36 },
});
