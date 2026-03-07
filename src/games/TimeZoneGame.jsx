import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const CITIES = [
  { name: 'İstanbul', offset: 3 }, { name: 'Londra', offset: 0 }, { name: 'New York', offset: -5 },
  { name: 'Tokyo', offset: 9 }, { name: 'Paris', offset: 1 }, { name: 'Dubai', offset: 4 },
  { name: 'Sydney', offset: 11 }, { name: 'Los Angeles', offset: -8 }, { name: 'Moskova', offset: 3 },
  { name: 'Pekin', offset: 8 }, { name: 'Berlin', offset: 1 }, { name: 'Kahire', offset: 2 },
];
const DIFFICULTY_CONFIG = { 0: { cities: 4 }, 1: { cities: 8 }, 2: { cities: 12 } };
export default function TimeZoneGame({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [hour, setHour] = useState(12);
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const pool = CITIES.slice(0, config.cities);
    const f = pool[Math.floor(Math.random() * pool.length)];
    let t = pool[Math.floor(Math.random() * pool.length)];
    while (t.name === f.name) t = pool[Math.floor(Math.random() * pool.length)];
    const h = Math.floor(Math.random() * 24);
    setFrom(f); setTo(t); setHour(h);
    const diff = t.offset - f.offset;
    const correct = ((h + diff) % 24 + 24) % 24;
    const opts = new Set([correct]);
    while (opts.size < 4) opts.add(Math.floor(Math.random() * 24));
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleAnswer = (ans) => {
    playTap();
    const diff = to.offset - from.offset;
    const correct = ((hour + diff) % 24 + 24) % 24;
    if (ans === correct) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };
  const fmt = (h) => `${String(h).padStart(2, '0')}:00`;
  if (!from || !to) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.emoji}>🌍</Text>
      <Text style={styles.q}>{from.name}'da saat {fmt(hour)}</Text>
      <Text style={styles.q2}>{to.name}'da saat kaç?</Text>
      <View style={styles.options}>
        {options.map((o, i) => (
          <TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(o)} activeOpacity={0.7}>
            <Text style={styles.btnText}>{fmt(o)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  emoji: { fontSize: 48, marginBottom: 12 },
  q: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  q2: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 24 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  btn: { backgroundColor: COLORS.surface, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.surfaceLight, minWidth: 90, alignItems: 'center' },
  btnText: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
});
