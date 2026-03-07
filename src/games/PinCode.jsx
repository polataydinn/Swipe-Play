import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { length: 3, showTime: 3000 },
  1: { length: 4, showTime: 2000 },
  2: { length: 6, showTime: 1500 },
};

function generatePin(len) {
  let pin = '';
  for (let i = 0; i < len; i++) pin += Math.floor(Math.random() * 10);
  return pin;
}

export default function PinCode({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [pin, setPin] = useState('');
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('show');

  const newRound = () => {
    setPin(generatePin(config.length));
    setInput('');
    setPhase('show');
  };

  useEffect(() => { newRound(); }, [difficulty]);

  useEffect(() => {
    if (phase === 'show') {
      const t = setTimeout(() => setPhase('input'), config.showTime);
      return () => clearTimeout(t);
    }
  }, [phase, config.showTime]);

  const handleDigit = (d) => {
    playTap();
    const newInput = input + d;
    setInput(newInput);
    if (newInput.length === pin.length) {
      if (newInput === pin) { onCorrect(); } else { onWrong(); }
      setTimeout(newRound, 500);
    }
  };

  const handleDelete = () => {
    playTap();
    setInput(input.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>{phase === 'show' ? 'PIN\'i ezberle!' : 'PIN\'i gir'}</Text>
      <View style={styles.display}>
        {Array.from({ length: pin.length }).map((_, i) => (
          <View key={i} style={[styles.dot, input.length > i && styles.dotFilled]}>
            <Text style={styles.dotText}>
              {phase === 'show' ? pin[i] : (input[i] || '')}
            </Text>
          </View>
        ))}
      </View>
      {phase === 'input' && (
        <View style={styles.keypad}>
          {[1,2,3,4,5,6,7,8,9,null,0,'⌫'].map((key, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.key, key === null && styles.keyHidden]}
              onPress={() => key === '⌫' ? handleDelete() : key !== null && handleDigit(String(key))}
              activeOpacity={0.7}
              disabled={key === null}
            >
              <Text style={styles.keyText}>{key !== null ? key : ''}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  instruction: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 24 },
  display: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  dot: { width: 48, height: 56, backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.surfaceLight },
  dotFilled: { borderColor: '#22c55e' },
  dotText: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 240, justifyContent: 'center', gap: 8 },
  key: { width: 70, height: 50, backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  keyHidden: { backgroundColor: 'transparent' },
  keyText: { color: COLORS.text, fontSize: 22, fontWeight: '600' },
});
