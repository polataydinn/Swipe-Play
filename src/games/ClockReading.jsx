import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { minuteStep: 60 }, 1: { minuteStep: 30 }, 2: { minuteStep: 5 } };
export default function ClockReading({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [hour, setHour] = useState(3); const [minute, setMinute] = useState(0);
  const [options, setOptions] = useState([]); const [streak, setStreak] = useState(0);
  const next = () => {
    const h = Math.floor(Math.random() * 12) + 1;
    const m = Math.floor(Math.random() * (60 / config.minuteStep)) * config.minuteStep;
    setHour(h); setMinute(m);
    const answer = `${h}:${String(m).padStart(2, '0')}`;
    const opts = new Set([answer]);
    while (opts.size < 4) {
      const rh = Math.floor(Math.random() * 12) + 1;
      const rm = Math.floor(Math.random() * (60 / config.minuteStep)) * config.minuteStep;
      opts.add(`${rh}:${String(rm).padStart(2, '0')}`);
    }
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleAnswer = (val) => {
    playTap();
    const answer = `${hour}:${String(minute).padStart(2, '0')}`;
    if (val === answer) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };
  const hourAngle = (hour % 12) * 30 + minute * 0.5;
  const minuteAngle = minute * 6;
  const clockSize = 160;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Saat kaç?</Text>
      <View style={[styles.clock, { width: clockSize, height: clockSize, borderRadius: clockSize / 2 }]}>
        {[12,3,6,9].map(n => {
          const a = (n === 12 ? 0 : n === 3 ? 90 : n === 6 ? 180 : 270) * Math.PI / 180;
          return <Text key={n} style={[styles.clockNum, { left: clockSize/2 - 8 + Math.sin(a) * (clockSize/2 - 20), top: clockSize/2 - 10 - Math.cos(a) * (clockSize/2 - 20) }]}>{n}</Text>;
        })}
        <View style={[styles.hand, styles.hourHand, { transform: [{ rotate: `${hourAngle}deg` }] }]} />
        <View style={[styles.hand, styles.minuteHand, { transform: [{ rotate: `${minuteAngle}deg` }] }]} />
        <View style={styles.center} />
      </View>
      <View style={styles.options}>
        {options.map((opt, i) => (<TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(opt)} activeOpacity={0.7}><Text style={styles.btnText}>{opt}</Text></TouchableOpacity>))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 10 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 },
  clock: { backgroundColor: COLORS.surface, borderWidth: 3, borderColor: COLORS.surfaceLight, marginBottom: 30, position: 'relative' },
  clockNum: { position: 'absolute', color: COLORS.text, fontSize: 14, fontWeight: '600' },
  hand: { position: 'absolute', bottom: '50%', left: '50%', transformOrigin: 'bottom' },
  hourHand: { width: 4, height: 40, backgroundColor: COLORS.text, marginLeft: -2, borderRadius: 2 },
  minuteHand: { width: 2, height: 55, backgroundColor: '#3b82f6', marginLeft: -1, borderRadius: 1 },
  center: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.text, top: '50%', left: '50%', marginLeft: -5, marginTop: -5 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  btn: { width: (SW - 80) / 2, height: 56, backgroundColor: COLORS.surface, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
});
