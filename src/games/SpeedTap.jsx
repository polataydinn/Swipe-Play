import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { time: 5000, target: 15 },
  1: { time: 3000, target: 15 },
  2: { time: 2000, target: 15 },
};

export default function SpeedTap({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [taps, setTaps] = useState(0);
  const [phase, setPhase] = useState('ready');
  const [timeLeft, setTimeLeft] = useState(config.time);
  const intervalRef = useRef(null);

  const startGame = () => {
    setTaps(0);
    setPhase('play');
    setTimeLeft(config.time);
  };

  useEffect(() => { setPhase('ready'); setTaps(0); }, [difficulty]);

  useEffect(() => {
    if (phase === 'play') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 100) {
            clearInterval(intervalRef.current);
            setPhase('result');
            return 0;
          }
          return t - 100;
        });
      }, 100);
      return () => clearInterval(intervalRef.current);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'result') {
      if (taps >= config.target) { onCorrect(); } else { onWrong(); }
    }
  }, [phase]);

  const handleTap = () => {
    playTap();
    if (phase === 'ready') { startGame(); return; }
    if (phase === 'result') { startGame(); return; }
    setTaps(t => t + 1);
  };

  const progress = timeLeft / config.time;

  return (
    <TouchableOpacity style={styles.container} onPress={handleTap} activeOpacity={0.9}>
      {phase === 'play' && (
        <View style={styles.timerBar}>
          <View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: progress > 0.3 ? '#22c55e' : '#ef4444' }]} />
        </View>
      )}
      {phase === 'ready' && (
        <>
          <Text style={styles.mainText}>Hızlı Dokun!</Text>
          <Text style={styles.subText}>Başlamak için dokun</Text>
        </>
      )}
      {phase === 'play' && (
        <>
          <Text style={styles.taps}>{taps}</Text>
          <Text style={styles.subText}>Hedef: {config.target}</Text>
        </>
      )}
      {phase === 'result' && (
        <>
          <Text style={styles.mainText}>{taps} dokunuş!</Text>
          <Text style={styles.subText}>{taps >= config.target ? '✅ Harika!' : '❌ Hedef: ' + config.target}</Text>
          <Text style={styles.hint}>Tekrar oynamak için dokun</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, borderRadius: 20, margin: 10, backgroundColor: COLORS.surface },
  timerBar: { width: SW - 60, height: 6, backgroundColor: COLORS.background, borderRadius: 3, marginBottom: 30, overflow: 'hidden', position: 'absolute', top: 20 },
  timerFill: { height: '100%', borderRadius: 3 },
  mainText: { color: COLORS.text, fontSize: 32, fontWeight: '800', textAlign: 'center' },
  taps: { color: COLORS.text, fontSize: 80, fontWeight: '800' },
  subText: { color: COLORS.textSecondary, fontSize: 16, marginTop: 12 },
  hint: { color: COLORS.textMuted, fontSize: 14, marginTop: 20 },
});
