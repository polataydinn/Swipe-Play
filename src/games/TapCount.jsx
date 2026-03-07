import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { minTarget: 5, maxTarget: 10, tolerance: 1, timeLimit: 0 },
  1: { minTarget: 10, maxTarget: 20, tolerance: 0, timeLimit: 10000 },
  2: { minTarget: 20, maxTarget: 40, tolerance: 0, timeLimit: 8000 },
};

export default function TapCount({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [target, setTarget] = useState(0);
  const [taps, setTaps] = useState(0);
  const [phase, setPhase] = useState('play');
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const intervalRef = useRef(null);

  const newRound = () => {
    const t = Math.floor(Math.random() * (config.maxTarget - config.minTarget + 1)) + config.minTarget;
    setTarget(t);
    setTaps(0);
    setPhase('play');
    setTimeLeft(config.timeLimit);
  };

  useEffect(() => { newRound(); }, [difficulty]);

  useEffect(() => {
    if (config.timeLimit > 0 && phase === 'play') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 100) {
            clearInterval(intervalRef.current);
            onWrong();
            setTimeout(newRound, 500);
            return 0;
          }
          return t - 100;
        });
      }, 100);
      return () => clearInterval(intervalRef.current);
    }
  }, [phase, difficulty]);

  const handleTap = () => {
    playTap();
    setTaps(t => t + 1);
  };

  const handleSubmit = () => {
    playTap();
    if (Math.abs(taps - target) <= config.tolerance) {
      onCorrect();
    } else {
      onWrong();
    }
    setTimeout(newRound, 500);
  };

  const progress = config.timeLimit > 0 ? timeLeft / config.timeLimit : 1;

  return (
    <View style={styles.container}>
      {config.timeLimit > 0 && (
        <View style={styles.timerBar}>
          <View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: progress > 0.3 ? '#22c55e' : '#ef4444' }]} />
        </View>
      )}
      <Text style={styles.instruction}>Tam {target} kez dokun!</Text>
      <TouchableOpacity style={styles.tapArea} onPress={handleTap} activeOpacity={0.7}>
        <Text style={styles.tapCount}>{taps}</Text>
        <Text style={styles.tapHint}>Dokunmaya devam et</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.7}>
        <Text style={styles.submitText}>Gönder</Text>
      </TouchableOpacity>
      {config.tolerance > 0 && <Text style={styles.toleranceText}>±{config.tolerance} tolerans</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  timerBar: { width: SW - 60, height: 6, backgroundColor: COLORS.surface, borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 3 },
  instruction: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 20 },
  tapArea: { width: SW - 80, height: 200, backgroundColor: COLORS.surface, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight, marginBottom: 20 },
  tapCount: { color: COLORS.text, fontSize: 64, fontWeight: '800' },
  tapHint: { color: COLORS.textMuted, fontSize: 14, marginTop: 8 },
  submitBtn: { backgroundColor: '#22c55e', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  toleranceText: { color: COLORS.textMuted, fontSize: 14, marginTop: 12 },
});
