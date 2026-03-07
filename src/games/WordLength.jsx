import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const WORDS = ['EV', 'ARABA', 'GÜNEŞ', 'BAHÇE', 'KİTAP', 'OKUL', 'KALEM', 'DENİZ', 'KELEBEK', 'ÖĞRETMEN',
  'BİLGİSAYAR', 'KÜTÜPHANE', 'MATEMATİK', 'HASTANE', 'SİNEMA', 'AY', 'BAL', 'TAŞ', 'YOL', 'GÜN',
  'ÜNİVERSİTE', 'TELEVİZYON', 'PORTAKAL', 'FUTBOL', 'MÜZİK'];

const DIFFICULTY_CONFIG = {
  0: { time: 5000 },
  1: { time: 3000 },
  2: { time: 2000 },
};

export default function WordLength({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [word, setWord] = useState('');
  const [target, setTarget] = useState(5);
  const [timeLeft, setTimeLeft] = useState(config.time);
  const [streak, setStreak] = useState(0);
  const intervalRef = useRef(null);

  const next = () => {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(w);
    const t = w.length + (Math.random() > 0.5 ? Math.floor(Math.random() * 3) - 1 : 0);
    setTarget(Math.max(1, t));
    setTimeLeft(config.time);
  };

  useEffect(() => { next(); setStreak(0); }, [difficulty]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 100) { onWrong(); setStreak(0); next(); return config.time; } return t - 100; });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [word, config.time]);

  const handleAnswer = (more) => {
    playTap();
    const correct = more ? word.length > target : word.length <= target;
    if (correct) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };

  const progress = timeLeft / config.time;

  return (
    <View style={styles.container}>
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: progress > 0.3 ? '#22c55e' : '#ef4444' }]} />
      </View>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.word}>{word}</Text>
      <Text style={styles.question}>{target} harften fazla mı?</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#22c55e' }]} onPress={() => handleAnswer(true)} activeOpacity={0.7}>
          <Text style={styles.btnText}>Evet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#ef4444' }]} onPress={() => handleAnswer(false)} activeOpacity={0.7}>
          <Text style={styles.btnText}>Hayır</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  timerBar: { width: SW - 60, height: 6, backgroundColor: COLORS.surface, borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 3 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  word: { color: COLORS.text, fontSize: 40, fontWeight: '800', marginBottom: 12 },
  question: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 30 },
  buttons: { flexDirection: 'row', gap: 20 },
  btn: { paddingHorizontal: 36, paddingVertical: 16, borderRadius: 16 },
  btnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
