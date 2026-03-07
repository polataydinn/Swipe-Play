import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { minCount: 3, maxCount: 7, showTime: 2000 },
  1: { minCount: 5, maxCount: 12, showTime: 1500 },
  2: { minCount: 8, maxCount: 20, showTime: 800 },
};

const DOT_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

function generateDots(count) {
  const dots = [];
  for (let i = 0; i < count; i++) {
    dots.push({
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      color: DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)],
      size: 14 + Math.random() * 16,
    });
  }
  return dots;
}

export default function QuickCount({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [dots, setDots] = useState([]);
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState('show');
  const [options, setOptions] = useState([]);

  const newRound = () => {
    const c = Math.floor(Math.random() * (config.maxCount - config.minCount + 1)) + config.minCount;
    setCount(c);
    setDots(generateDots(c));
    setPhase('show');
    const opts = new Set([c]);
    while (opts.size < 4) {
      const off = Math.floor(Math.random() * 6) - 3;
      const v = c + (off === 0 ? (Math.random() > 0.5 ? 1 : -1) : off);
      if (v > 0) opts.add(v);
    }
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };

  useEffect(() => { newRound(); }, [difficulty]);

  useEffect(() => {
    if (phase === 'show') {
      const t = setTimeout(() => setPhase('guess'), config.showTime);
      return () => clearTimeout(t);
    }
  }, [phase, config.showTime]);

  const handleAnswer = (val) => {
    playTap();
    if (val === count) { onCorrect(); } else { onWrong(); }
    setTimeout(newRound, 400);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>{phase === 'show' ? 'Say!' : 'Kaç tane vardı?'}</Text>
      <View style={styles.dotArea}>
        {phase === 'show' && dots.map((d, i) => (
          <View key={i} style={[styles.dot, { left: `${d.x}%`, top: `${d.y}%`, backgroundColor: d.color, width: d.size, height: d.size, borderRadius: d.size / 2 }]} />
        ))}
        {phase === 'guess' && <Text style={styles.questionMark}>?</Text>}
      </View>
      {phase === 'guess' && (
        <View style={styles.options}>
          {options.map((opt, i) => (
            <TouchableOpacity key={i} style={styles.optionBtn} onPress={() => handleAnswer(opt)} activeOpacity={0.7}>
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  instruction: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 20 },
  dotArea: { width: SW - 60, height: SW - 60, backgroundColor: COLORS.surface, borderRadius: 20, position: 'relative', marginBottom: 20, overflow: 'hidden' },
  dot: { position: 'absolute' },
  questionMark: { color: COLORS.textMuted, fontSize: 60, fontWeight: '800', textAlign: 'center', lineHeight: SW - 60 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  optionBtn: { width: (SW - 80) / 2, height: 56, backgroundColor: COLORS.surface, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  optionText: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
});
