import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const GAME_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e91e63', '#ff9800'];
const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { startLen: 2, showTime: 800, maxColors: 4 },
  1: { startLen: 3, showTime: 600, maxColors: 6 },
  2: { startLen: 4, showTime: 400, maxColors: 8 },
};

export default function ColorMemory({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [phase, setPhase] = useState('showing');
  const [activeIdx, setActiveIdx] = useState(-1);
  const [showingBlank, setShowingBlank] = useState(false);
  const [round, setRound] = useState(0);
  const availableColors = GAME_COLORS.slice(0, config.maxColors);
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  const generateSequence = useCallback((len) => {
    return Array.from({ length: len }, () =>
      Math.floor(Math.random() * config.maxColors)
    );
  }, [config.maxColors]);

  const startRound = useCallback(() => {
    clearTimers();
    const len = config.startLen + round;
    const seq = generateSequence(len);
    setSequence(seq);
    setUserInput([]);
    setPhase('showing');
    setActiveIdx(-1);
    setShowingBlank(false);

    const blankTime = 300;
    let delay = config.showTime;

    seq.forEach((_, i) => {
      timersRef.current.push(setTimeout(() => {
        setShowingBlank(false);
        setActiveIdx(i);
      }, delay));
      delay += config.showTime;
      timersRef.current.push(setTimeout(() => {
        setShowingBlank(true);
        setActiveIdx(-1);
      }, delay));
      delay += blankTime;
    });

    timersRef.current.push(setTimeout(() => {
      setActiveIdx(-1);
      setShowingBlank(false);
      setPhase('input');
    }, delay));
  }, [config, round, generateSequence]);

  useEffect(() => {
    startRound();
    return () => clearTimers();
  }, [round, difficulty]);

  const handlePress = (colorIdx) => {
    playTap();
    if (phase !== 'input') return;
    const newInput = [...userInput, colorIdx];
    setUserInput(newInput);

    const pos = newInput.length - 1;
    if (newInput[pos] !== sequence[pos]) {
      onWrong();
      setPhase('result');
      setTimeout(() => {
        setRound(0);
      }, 1000);
      return;
    }

    if (newInput.length === sequence.length) {
      onCorrect();
      setPhase('result');
      setTimeout(() => setRound((r) => r + 1), 800);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.info}>
        {phase === 'showing' ? 'Izle...' : phase === 'input' ? 'Tekrarla!' : ''}
      </Text>
      <Text style={styles.round}>Tur: {round + 1}</Text>
      <View style={styles.display}>
        {phase === 'showing' && activeIdx >= 0 && !showingBlank && (
          <View style={[styles.showBox, { backgroundColor: GAME_COLORS[sequence[activeIdx]] }]} />
        )}
        {phase === 'showing' && (activeIdx < 0 || showingBlank) && (
          <View style={[styles.showBox, { backgroundColor: COLORS.surface }]}>
            <Text style={styles.readyText}>{showingBlank ? '' : 'Hazir ol...'}</Text>
          </View>
        )}
        {phase === 'input' && (
          <View style={styles.progressRow}>
            {sequence.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  { backgroundColor: i < userInput.length ? '#22c55e' : COLORS.surfaceLight },
                ]}
              />
            ))}
          </View>
        )}
      </View>
      <View style={styles.grid}>
        {availableColors.map((color, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.colorBtn, { backgroundColor: color }]}
            onPress={() => handlePress(idx)}
            disabled={phase !== 'input'}
            activeOpacity={0.7}
          >
            <View style={phase !== 'input' ? styles.disabled : null} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const BTN_SIZE = (SW - 80) / 4;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  info: { color: COLORS.text, fontSize: 24, fontWeight: '700', marginBottom: 8 },
  round: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 20 },
  display: { height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  showBox: { width: 100, height: 100, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  readyText: { color: COLORS.textMuted, fontSize: 16 },
  progressRow: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 12, height: 12, borderRadius: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, maxWidth: SW - 40 },
  colorBtn: { width: BTN_SIZE, height: BTN_SIZE, borderRadius: 16 },
  disabled: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16 },
});
