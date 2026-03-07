import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const QUESTIONS = {
  0: [
    { q: 'Hangisi daha büyük?', a: 'Fil', b: 'Kedi', answer: 'a' },
    { q: 'Hangisi daha hızlı?', a: 'Araba', b: 'Bisiklet', answer: 'a' },
    { q: 'Hangisi daha ağır?', a: 'Taş', b: 'Tüy', answer: 'a' },
    { q: 'Hangisi daha sıcak?', a: 'Güneş', b: 'Ay', answer: 'a' },
    { q: 'Hangisi daha yüksek?', a: 'Everest', b: 'Ağrı Dağı', answer: 'a' },
    { q: 'Hangisi daha uzun?', a: 'Zürafa', b: 'At', answer: 'a' },
    { q: 'Hangisinde daha çok bacak var?', a: 'Örümcek', b: 'Karınca', answer: 'a' },
    { q: 'Hangisi daha soğuk?', a: 'Antarktika', b: 'İstanbul', answer: 'a' },
    { q: 'Hangisi daha eski?', a: 'Piramitler', b: 'Eyfel Kulesi', answer: 'a' },
    { q: 'Hangisi daha büyük?', a: 'Okyanus', b: 'Göl', answer: 'a' },
    { q: 'Hangisi daha hafif?', a: 'Balon', b: 'Tuğla', answer: 'a' },
    { q: 'Hangisi daha yavaş?', a: 'Kaplumbağa', b: 'Tavşan', answer: 'a' },
    { q: 'Hangisinde daha çok kalori var?', a: 'Hamburger', b: 'Salata', answer: 'a' },
    { q: 'Hangisi daha uzak?', a: 'Mars', b: 'Ay', answer: 'a' },
    { q: 'Hangisi daha küçük?', a: 'Karınca', b: 'Kedi', answer: 'a' },
  ],
  1: [
    { q: 'Hangisi daha kalabalık?', a: 'Çin', b: 'Almanya', answer: 'a' },
    { q: 'Hangisi daha geniş?', a: 'Rusya', b: 'Kanada', answer: 'a' },
    { q: 'Hangisi daha derin?', a: 'Mariana Çukuru', b: 'Boğaziçi', answer: 'a' },
    { q: 'Hangisi daha uzun?', a: 'Nil Nehri', b: 'Tuna Nehri', answer: 'a' },
    { q: 'Hangisi daha ağır?', a: 'Altın', b: 'Gümüş', answer: 'a' },
    { q: 'Hangisi daha hızlı?', a: 'Çita', b: 'Aslan', answer: 'a' },
    { q: 'Hangisi daha yüksek?', a: 'Burj Khalifa', b: 'Eiffel Kulesi', answer: 'a' },
    { q: 'Hangisi daha eski?', a: 'Roma', b: 'New York', answer: 'a' },
    { q: 'Hangisinin ömrü daha uzun?', a: 'Kaplumbağa', b: 'Köpek', answer: 'a' },
    { q: 'Hangisi daha sert?', a: 'Elmas', b: 'Cam', answer: 'a' },
    { q: 'Hangisi daha büyük?', a: 'Jupiter', b: 'Dünya', answer: 'a' },
    { q: 'Hangisi daha hafif?', a: 'Hidrojen', b: 'Oksijen', answer: 'a' },
    { q: 'Hangisi daha geniş?', a: 'Pasifik', b: 'Atlantik', answer: 'a' },
    { q: 'Hangisinde daha çok kemik var?', a: 'Bebek', b: 'Yetişkin', answer: 'a' },
    { q: 'Hangisi daha hızlı?', a: 'Işık', b: 'Ses', answer: 'a' },
  ],
  2: [
    { q: 'Hangisi daha yoğun?', a: 'Altın', b: 'Demir', answer: 'a' },
    { q: 'Hangisi daha eski?', a: 'Göbeklitepe', b: 'Piramitler', answer: 'a' },
    { q: 'Hangisi daha sıcak?', a: 'Venüs', b: 'Merkür', answer: 'a' },
    { q: 'Hangisinin kalbi daha hızlı atar?', a: 'Sinek kuşu', b: 'İnsan', answer: 'a' },
    { q: 'Hangisi daha büyük?', a: 'Grönland', b: 'Madagaskar', answer: 'a' },
    { q: 'Hangisi daha hızlı?', a: 'Şahin', b: 'Kartal', answer: 'a' },
    { q: 'Hangisinin DNA\'sı insana daha yakın?', a: 'Şempanze', b: 'Köpek', answer: 'a' },
    { q: 'Hangisi daha ağır?', a: 'Ozmiyum', b: 'Kurşun', answer: 'a' },
    { q: 'Hangisi daha eski?', a: 'Evren', b: 'Dünya', answer: 'a' },
    { q: 'Hangisi daha kısa?', a: 'Merkür yılı', b: 'Dünya yılı', answer: 'a' },
    { q: 'Hangisi daha büyük?', a: 'Güneş', b: 'Jupiter', answer: 'a' },
    { q: 'Hangisi daha soğuk?', a: 'Plüton', b: 'Mars', answer: 'a' },
    { q: 'Hangisi daha yüksek?', a: 'K2', b: 'Mont Blanc', answer: 'a' },
    { q: 'Hangisi daha uzun?', a: 'Amazon', b: 'Fırat', answer: 'a' },
    { q: 'Hangisi daha kalabalık?', a: 'Tokyo', b: 'Londra', answer: 'a' },
  ],
};

const DIFFICULTY_CONFIG = {
  0: { time: 8000 },
  1: { time: 5000 },
  2: { time: 3000 },
};

export default function BinaryChoice({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const questions = QUESTIONS[difficulty] || QUESTIONS[0];
  const [qIdx, setQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.time);
  const [streak, setStreak] = useState(0);
  const [swapped, setSwapped] = useState(false);
  const intervalRef = useRef(null);

  const next = () => {
    setQIdx(Math.floor(Math.random() * questions.length));
    setSwapped(Math.random() > 0.5);
    setTimeLeft(config.time);
  };

  useEffect(() => { next(); setStreak(0); }, [difficulty]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 100) { onWrong(); setStreak(0); next(); return config.time; } return t - 100; });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [qIdx, config.time, swapped]);

  const q = questions[qIdx];
  const left = swapped ? q.b : q.a;
  const right = swapped ? q.a : q.b;
  const correctSide = swapped ? 'right' : 'left';

  const handleAnswer = (side) => {
    playTap();
    if (side === correctSide) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };

  const progress = timeLeft / config.time;

  return (
    <View style={styles.container}>
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: progress > 0.3 ? '#22c55e' : '#ef4444' }]} />
      </View>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.question}>{q.q}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={() => handleAnswer('left')} activeOpacity={0.7}>
          <Text style={styles.btnText}>{left}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => handleAnswer('right')} activeOpacity={0.7}>
          <Text style={styles.btnText}>{right}</Text>
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
  question: { color: COLORS.text, fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 30 },
  buttons: { flexDirection: 'row', gap: 16 },
  btn: { flex: 1, maxWidth: (SW - 76) / 2, height: 80, backgroundColor: COLORS.surface, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
});
