import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playTick } from '../utils/sounds';

const DIFFICULTY_CONFIG = {
  0: { targetTime: 500, rounds: 3 },
  1: { targetTime: 350, rounds: 5 },
  2: { targetTime: 200, rounds: 7 },
};

export default function ReactionSpeed({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [phase, setPhase] = useState('wait'); // wait | ready | go | result | early
  const [reactionTime, setReactionTime] = useState(0);
  const [bestTime, setBestTime] = useState(null);
  const [round, setRound] = useState(0);
  const startRef = useRef(0);
  const timeoutRef = useRef(null);

  const startRound = () => {
    setPhase('ready');
    const delay = 1500 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      startRef.current = Date.now();
      setPhase('go');
    }, delay);
  };

  useEffect(() => {
    setRound(0);
    setBestTime(null);
    setPhase('wait');
    return () => clearTimeout(timeoutRef.current);
  }, [difficulty]);

  const handleTap = () => {
    playTap();
    if (phase === 'wait') {
      startRound();
    } else if (phase === 'ready') {
      // Tapped too early!
      clearTimeout(timeoutRef.current);
      setPhase('early');
      onWrong();
    } else if (phase === 'go') {
      const time = Date.now() - startRef.current;
      setReactionTime(time);
      if (time <= config.targetTime) {
        onCorrect();
      }
      setBestTime((prev) => (prev === null ? time : Math.min(prev, time)));
      setRound((r) => r + 1);
      setPhase('result');
    } else if (phase === 'result' || phase === 'early') {
      startRound();
    }
  };

  const getColor = () => {
    switch (phase) {
      case 'wait': return COLORS.surface;
      case 'ready': return '#e74c3c';
      case 'go': return '#2ecc71';
      case 'early': return '#e67e22';
      case 'result': return COLORS.surface;
      default: return COLORS.surface;
    }
  };

  const getMessage = () => {
    switch (phase) {
      case 'wait': return 'Başlamak için dokun';
      case 'ready': return 'Bekle...';
      case 'go': return 'ŞİMDİ DOKUN!';
      case 'early': return 'Çok erken! Tekrar dene';
      case 'result': return `${reactionTime} ms`;
      default: return '';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: getColor() }]}
      onPress={handleTap}
      activeOpacity={0.9}
    >
      <Text style={styles.mainText}>{getMessage()}</Text>
      {phase === 'result' && (
        <View style={styles.info}>
          <Text style={styles.infoText}>
            {reactionTime <= config.targetTime ? '✅ Harika!' : '⚡ Daha hızlı ol!'}
          </Text>
          <Text style={styles.infoText}>Hedef: {config.targetTime}ms altı</Text>
          {bestTime !== null && <Text style={styles.bestText}>En iyi: {bestTime}ms</Text>}
          <Text style={styles.infoText}>Tur: {round}/{config.rounds}</Text>
          <Text style={styles.tapText}>Devam etmek için dokun</Text>
        </View>
      )}
      {phase === 'wait' && (
        <Text style={styles.subText}>Ekran yeşile dönünce mümkün olan en hızlı şekilde dokun!</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    margin: 10,
  },
  mainText: { color: COLORS.text, fontSize: 36, fontWeight: '800', textAlign: 'center' },
  subText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 16, paddingHorizontal: 40 },
  info: { alignItems: 'center', marginTop: 20, gap: 8 },
  infoText: { color: COLORS.textSecondary, fontSize: 16 },
  bestText: { color: '#f39c12', fontSize: 18, fontWeight: '700' },
  tapText: { color: COLORS.textMuted, fontSize: 14, marginTop: 12 },
});
