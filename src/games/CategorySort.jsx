import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const CATEGORIES = {
  0: {
    cats: ['Meyve', 'Sebze'],
    items: [
      { name: '🍎 Elma', cat: 'Meyve' }, { name: '🥕 Havuç', cat: 'Sebze' },
      { name: '🍌 Muz', cat: 'Meyve' }, { name: '🥦 Brokoli', cat: 'Sebze' },
      { name: '🍇 Üzüm', cat: 'Meyve' }, { name: '🍅 Domates', cat: 'Sebze' },
      { name: '🍊 Portakal', cat: 'Meyve' }, { name: '🥒 Salatalık', cat: 'Sebze' },
      { name: '🍓 Çilek', cat: 'Meyve' }, { name: '🌽 Mısır', cat: 'Sebze' },
      { name: '🍑 Şeftali', cat: 'Meyve' }, { name: '🧅 Soğan', cat: 'Sebze' },
    ],
  },
  1: {
    cats: ['Hayvan', 'Bitki'],
    items: [
      { name: '🐕 Köpek', cat: 'Hayvan' }, { name: '🌹 Gül', cat: 'Bitki' },
      { name: '🐈 Kedi', cat: 'Hayvan' }, { name: '🌻 Ayçiçeği', cat: 'Bitki' },
      { name: '🐘 Fil', cat: 'Hayvan' }, { name: '🌲 Çam', cat: 'Bitki' },
      { name: '🦁 Aslan', cat: 'Hayvan' }, { name: '🌸 Kiraz Çiçeği', cat: 'Bitki' },
      { name: '🐟 Balık', cat: 'Hayvan' }, { name: '🌵 Kaktüs', cat: 'Bitki' },
      { name: '🦅 Kartal', cat: 'Hayvan' }, { name: '🍀 Yonca', cat: 'Bitki' },
    ],
  },
  2: {
    cats: ['Ülke', 'Şehir'],
    items: [
      { name: 'Türkiye', cat: 'Ülke' }, { name: 'İstanbul', cat: 'Şehir' },
      { name: 'Fransa', cat: 'Ülke' }, { name: 'Paris', cat: 'Şehir' },
      { name: 'Japonya', cat: 'Ülke' }, { name: 'Tokyo', cat: 'Şehir' },
      { name: 'Brezilya', cat: 'Ülke' }, { name: 'Roma', cat: 'Şehir' },
      { name: 'Almanya', cat: 'Ülke' }, { name: 'Londra', cat: 'Şehir' },
      { name: 'Mısır', cat: 'Ülke' }, { name: 'Berlin', cat: 'Şehir' },
    ],
  },
};

const DIFFICULTY_CONFIG = {
  0: { time: 6000 },
  1: { time: 4000 },
  2: { time: 3000 },
};

export default function CategorySort({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const catConfig = CATEGORIES[difficulty] || CATEGORIES[0];
  const [item, setItem] = useState(null);
  const [timeLeft, setTimeLeft] = useState(config.time);
  const [streak, setStreak] = useState(0);
  const intervalRef = useRef(null);

  const next = () => {
    setItem(catConfig.items[Math.floor(Math.random() * catConfig.items.length)]);
    setTimeLeft(config.time);
  };

  useEffect(() => { next(); setStreak(0); }, [difficulty]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 100) { onWrong(); setStreak(0); next(); return config.time; } return t - 100; });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [item, config.time]);

  const handleAnswer = (cat) => {
    playTap();
    if (item && cat === item.cat) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };

  const progress = timeLeft / config.time;

  return (
    <View style={styles.container}>
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: progress > 0.3 ? '#22c55e' : '#ef4444' }]} />
      </View>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.item}>{item?.name}</Text>
      <Text style={styles.label}>Hangi kategoriye ait?</Text>
      <View style={styles.buttons}>
        {catConfig.cats.map((cat, i) => (
          <TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(cat)} activeOpacity={0.7}>
            <Text style={styles.btnText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  timerBar: { width: SW - 60, height: 6, backgroundColor: COLORS.surface, borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 3 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  item: { color: COLORS.text, fontSize: 32, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 30 },
  buttons: { flexDirection: 'row', gap: 16 },
  btn: { flex: 1, maxWidth: (SW - 76) / 2, paddingVertical: 20, backgroundColor: COLORS.surface, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
});
