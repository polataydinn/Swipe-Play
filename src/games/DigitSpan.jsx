import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { length: 4, showSpeed: 800 },
  1: { length: 6, showSpeed: 600 },
  2: { length: 8, showSpeed: 400 },
};

function generateSequence(len) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 10));
}

export default function DigitSpan({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [sequence, setSequence] = useState([]);
  const [phase, setPhase] = useState('show');
  const [showIdx, setShowIdx] = useState(-1);
  const [showingBlank, setShowingBlank] = useState(false);
  const [input, setInput] = useState([]);
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  const newRound = () => {
    clearTimers();
    const seq = generateSequence(config.length);
    setSequence(seq);
    setInput([]);
    setPhase('show');
    setShowIdx(-1);
    setShowingBlank(false);

    const blankTime = 200;
    let delay = config.showSpeed;

    seq.forEach((_, i) => {
      timersRef.current.push(setTimeout(() => {
        setShowingBlank(false);
        setShowIdx(i);
      }, delay));
      delay += config.showSpeed;
      timersRef.current.push(setTimeout(() => {
        setShowingBlank(true);
        setShowIdx(-1);
      }, delay));
      delay += blankTime;
    });

    timersRef.current.push(setTimeout(() => {
      setShowIdx(-1);
      setShowingBlank(false);
      setPhase('input');
    }, delay));
  };

  useEffect(() => { newRound(); return () => clearTimers(); }, [difficulty]);

  const handleDigit = (d) => {
    playTap();
    const newInput = [...input, d];
    setInput(newInput);
    if (newInput.length === sequence.length) {
      const correct = newInput.every((v, i) => v === sequence[i]);
      if (correct) { onCorrect(); } else { onWrong(); }
      setTimeout(newRound, 600);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>{phase === 'show' ? 'Izle ve ezberle!' : 'Sirayla gir'}</Text>
      <View style={styles.display}>
        {phase === 'show' && showIdx >= 0 && !showingBlank && (
          <Text style={styles.bigDigit}>{sequence[showIdx]}</Text>
        )}
        {phase === 'show' && (showIdx < 0 || showingBlank) && (
          <View style={styles.blankBox} />
        )}
        {phase === 'input' && (
          <View style={styles.inputRow}>
            {sequence.map((_, i) => (
              <View key={i} style={[styles.slot, input.length > i && styles.slotFilled]}>
                <Text style={styles.slotText}>{input[i] !== undefined ? input[i] : '?'}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {phase === 'input' && (
        <View style={styles.keypad}>
          {[1,2,3,4,5,6,7,8,9,null,0,null].map((key, i) => (
            <TouchableOpacity key={i} style={[styles.key, key === null && styles.keyHidden]} onPress={() => key !== null && handleDigit(key)} activeOpacity={0.7} disabled={key === null}>
              <Text style={styles.keyText}>{key !== null ? key : ''}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {phase === 'show' && showIdx >= 0 && (
        <Text style={styles.counter}>{showIdx + 1} / {sequence.length}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  instruction: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 24 },
  display: { height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  bigDigit: { color: COLORS.text, fontSize: 72, fontWeight: '800' },
  blankBox: { width: 80, height: 80, borderRadius: 16, backgroundColor: COLORS.surface },
  inputRow: { flexDirection: 'row', gap: 8 },
  slot: { width: 40, height: 48, backgroundColor: COLORS.surface, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  slotFilled: { borderColor: '#22c55e' },
  slotText: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 240, justifyContent: 'center', gap: 8 },
  key: { width: 70, height: 50, backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  keyHidden: { backgroundColor: 'transparent' },
  keyText: { color: COLORS.text, fontSize: 22, fontWeight: '600' },
  counter: { color: COLORS.textMuted, fontSize: 14, marginTop: 20 },
});
