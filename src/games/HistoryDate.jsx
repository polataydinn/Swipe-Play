import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const EVENTS = [
  { event: 'İstanbul\'un Fethi', year: 1453 },
  { event: 'Cumhuriyetin İlanı', year: 1923 },
  { event: 'Fransız Devrimi', year: 1789 },
  { event: 'Amerika\'nın Keşfi', year: 1492 },
  { event: 'I. Dünya Savaşı Başlangıcı', year: 1914 },
  { event: 'II. Dünya Savaşı Sonu', year: 1945 },
  { event: 'Ay\'a İlk Adım', year: 1969 },
  { event: 'Berlin Duvarı\'nın Yıkılması', year: 1989 },
  { event: 'Matbaanın İcadı', year: 1440 },
  { event: 'Sanayi Devrimi Başlangıcı', year: 1760 },
  { event: 'Çanakkale Savaşı', year: 1915 },
  { event: 'Kurtuluş Savaşı Başlangıcı', year: 1919 },
];
const TIMELINE_W = SW - 60;
const DIFFICULTY_CONFIG = { 0: { min: 1400, max: 2000, tolerance: 30 }, 1: { min: 1400, max: 2000, tolerance: 20 }, 2: { min: 1400, max: 2000, tolerance: 10 } };
export default function HistoryDate({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [event, setEvent] = useState(EVENTS[0]);
  const [pinX, setPinX] = useState(TIMELINE_W / 2);
  const [submitted, setSubmitted] = useState(false);
  const [streak, setStreak] = useState(0);
  const next = () => {
    setEvent(EVENTS[Math.floor(Math.random() * EVENTS.length)]);
    setPinX(TIMELINE_W / 2); setSubmitted(false);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const range = config.max - config.min;
  const userYear = Math.round(config.min + (pinX / TIMELINE_W) * range);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { onLockSwipe?.(); },
      onPanResponderMove: (_, gs) => { setPinX(x => Math.max(0, Math.min(TIMELINE_W, x + gs.dx))); },
      onPanResponderRelease: () => {
        onUnlockSwipe?.();
        playTap(); setSubmitted(true);
        if (Math.abs(userYear - event.year) <= config.tolerance) { onCorrect(); setStreak(s => s + 1); }
        else { onWrong(); setStreak(0); }
        setTimeout(next, 1200);
      },
      onPanResponderTerminate: () => { onUnlockSwipe?.(); },
    })
  ).current;
  const correctX = ((event.year - config.min) / range) * TIMELINE_W;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.eventText}>{event.event}</Text>
      <Text style={styles.yearDisplay}>{userYear}</Text>
      <View style={styles.timeline} {...panResponder.panHandlers}>
        <View style={styles.timelineLine} />
        {[1400, 1500, 1600, 1700, 1800, 1900, 2000].map(y => (
          <View key={y} style={[styles.tick, { left: ((y - config.min) / range) * TIMELINE_W - 1 }]}>
            <View style={styles.tickMark} />
            <Text style={styles.tickLabel}>{y}</Text>
          </View>
        ))}
        <View style={[styles.pin, { left: pinX - 10 }]}>
          <Text style={styles.pinIcon}>📍</Text>
        </View>
        {submitted && (
          <View style={[styles.correctPin, { left: correctX - 6 }]}>
            <View style={styles.correctDot} />
          </View>
        )}
      </View>
      <Text style={styles.hint}>📍 Pimi kaydırarak doğru yılı bul</Text>
      {submitted && <Text style={styles.answer}>Doğru: {event.year}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  eventText: { color: COLORS.text, fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  yearDisplay: { color: '#f59e0b', fontSize: 48, fontWeight: '900', marginBottom: 24 },
  timeline: { width: TIMELINE_W, height: 60, position: 'relative', marginBottom: 20 },
  timelineLine: { position: 'absolute', top: 20, left: 0, right: 0, height: 4, backgroundColor: COLORS.surfaceLight, borderRadius: 2 },
  tick: { position: 'absolute', top: 10, alignItems: 'center' },
  tickMark: { width: 2, height: 24, backgroundColor: COLORS.surfaceLight },
  tickLabel: { color: COLORS.textMuted, fontSize: 9, marginTop: 2 },
  pin: { position: 'absolute', top: 0 },
  pinIcon: { fontSize: 24 },
  correctPin: { position: 'absolute', top: 16, alignItems: 'center' },
  correctDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e' },
  hint: { color: COLORS.textMuted, fontSize: 12, marginBottom: 8 },
  answer: { color: COLORS.textSecondary, fontSize: 16 },
});
