import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const NOTES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
const KEY_COLORS = { white: '#f8f8f8', black: '#1a1a2e' };
const PIANO_KEYS = [
  { note: 'Do', black: false }, { note: 'Re', black: false }, { note: 'Mi', black: false },
  { note: 'Fa', black: false }, { note: 'Sol', black: false }, { note: 'La', black: false }, { note: 'Si', black: false },
];
const DIFFICULTY_CONFIG = { 0: { type: 'single' }, 1: { type: 'sequence2' }, 2: { type: 'sequence3' } };
export default function MusicalNote({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [targetNotes, setTargetNotes] = useState([]);
  const [pressed, setPressed] = useState([]);
  const [showingTarget, setShowingTarget] = useState(true);
  const [streak, setStreak] = useState(0);
  const seqLen = config.type === 'single' ? 1 : config.type === 'sequence2' ? 2 : 3;
  const next = () => {
    const notes = [];
    for (let i = 0; i < seqLen; i++) notes.push(NOTES[Math.floor(Math.random() * NOTES.length)]);
    setTargetNotes(notes); setPressed([]); setShowingTarget(true);
    setTimeout(() => setShowingTarget(false), seqLen * 800 + 500);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleKey = (note) => {
    if (showingTarget) return;
    playTap();
    const np = [...pressed, note];
    setPressed(np);
    if (np.length === targetNotes.length) {
      const correct = np.every((n, i) => n === targetNotes[i]);
      if (correct) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
      setTimeout(next, 600);
    }
  };
  const keyW = (SW - 56) / 7;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>{showingTarget ? 'Notaları ezberle!' : 'Şimdi çal!'}</Text>
      <View style={styles.noteDisplay}>
        {targetNotes.map((n, i) => (
          <View key={i} style={[styles.noteBubble, showingTarget ? styles.noteBubbleVisible : styles.noteBubbleHidden]}>
            <Text style={styles.noteText}>{showingTarget ? n : (pressed[i] || '?')}</Text>
          </View>
        ))}
      </View>
      <View style={styles.piano}>
        {PIANO_KEYS.map((key, i) => {
          const isTarget = showingTarget && targetNotes.includes(key.note);
          const isPressed = pressed.includes(key.note);
          return (
            <TouchableOpacity key={i} style={[styles.pianoKey, { width: keyW }, isTarget && styles.targetKey, isPressed && styles.pressedKey]} onPress={() => handleKey(key.note)} activeOpacity={0.7}>
              <Text style={[styles.keyLabel, isTarget && styles.targetKeyLabel]}>{key.note}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 20 },
  noteDisplay: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  noteBubble: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  noteBubbleVisible: { backgroundColor: '#3b82f6' },
  noteBubbleHidden: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.surfaceLight },
  noteText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  piano: { flexDirection: 'row', gap: 4 },
  pianoKey: { height: 120, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  targetKey: { backgroundColor: '#3b82f6' },
  pressedKey: { backgroundColor: '#22c55e' },
  keyLabel: { color: '#333', fontSize: 12, fontWeight: '700' },
  targetKeyLabel: { color: '#fff' },
});
