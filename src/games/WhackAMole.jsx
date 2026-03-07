import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { gridSize: 3, showTime: 1500, rounds: 10 },
  1: { gridSize: 4, showTime: 1000, rounds: 15 },
  2: { gridSize: 5, showTime: 600, rounds: 20 },
};

const MOLE_EMOJIS = ['🐹', '🐭', '🐿️'];

export default function WhackAMole({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const total = config.gridSize * config.gridSize;
  const [activeIdx, setActiveIdx] = useState(-1);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [tapped, setTapped] = useState(false);
  const timeoutRef = useRef(null);

  const showMole = () => {
    setActiveIdx(Math.floor(Math.random() * total));
    setTapped(false);
    timeoutRef.current = setTimeout(() => {
      setActiveIdx(-1);
      setRound(r => r + 1);
    }, config.showTime);
  };

  useEffect(() => { setScore(0); setRound(0); showMole(); return () => clearTimeout(timeoutRef.current); }, [difficulty]);

  useEffect(() => {
    if (round > 0 && round < config.rounds) {
      const t = setTimeout(showMole, 300);
      return () => clearTimeout(t);
    }
  }, [round]);

  const handleTap = (idx) => {
    playTap();
    if (idx === activeIdx && !tapped) {
      setTapped(true);
      setScore(s => s + 1);
      onCorrect();
      clearTimeout(timeoutRef.current);
      setActiveIdx(-1);
      setRound(r => r + 1);
    } else if (idx !== activeIdx) {
      onWrong();
    }
  };

  const cellSize = Math.floor((SW - 60 - (config.gridSize - 1) * 8) / config.gridSize);

  return (
    <View style={styles.container}>
      <Text style={styles.score}>⭐ {score}/{round < config.rounds ? round : config.rounds}</Text>
      <Text style={styles.instruction}>Köstebekleri yakala!</Text>
      <View style={[styles.grid, { width: config.gridSize * (cellSize + 8) }]}>
        {Array.from({ length: total }).map((_, i) => (
          <TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }, activeIdx === i && styles.activeCell]} onPress={() => handleTap(i)} activeOpacity={0.7}>
            <Text style={{ fontSize: cellSize * 0.4 }}>{activeIdx === i ? MOLE_EMOJIS[i % MOLE_EMOJIS.length] : '🕳️'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  score: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 10 },
  instruction: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  cell: { backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  activeCell: { backgroundColor: '#422006' },
});
