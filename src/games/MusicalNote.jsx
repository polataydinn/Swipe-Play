import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { COLORS } from '../constants/colors';

const { width: SW } = Dimensions.get('window');

const NOTES = [
  { label: 'Do', freq: 261.63, color: '#ef4444' },
  { label: 'Re', freq: 293.66, color: '#f97316' },
  { label: 'Mi', freq: 329.63, color: '#eab308' },
  { label: 'Fa', freq: 349.23, color: '#22c55e' },
  { label: 'Sol', freq: 392.00, color: '#3b82f6' },
  { label: 'La', freq: 440.00, color: '#8b5cf6' },
  { label: 'Si', freq: 493.88, color: '#ec4899' },
];

const MELODIES = [
  [0, 1, 2, 0, 0, 1, 2, 0],
  [2, 3, 4, 2, 3, 4],
  [4, 4, 5, 4, 0, 6],
  [0, 0, 4, 4, 5, 5, 4],
  [0, 2, 4, 2, 0],
  [4, 3, 2, 1, 0, 1, 2, 3],
];

function generateWAV(frequency, duration = 0.3, volume = 0.45) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE'); writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeStr(36, 'data'); view.setUint32(40, dataSize, true);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const p = i / numSamples;
    let s = Math.sin(2 * Math.PI * frequency * t) * 0.55
           + Math.sin(2 * Math.PI * frequency * 2 * t) * 0.25
           + Math.sin(2 * Math.PI * frequency * 3 * t) * 0.15
           + Math.sin(2 * Math.PI * frequency * 4 * t) * 0.05;
    s *= volume;
    if (p < 0.02) s *= p / 0.02;
    if (p > 0.7) s *= (1 - p) / 0.3;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 32767, true);
  }
  return buffer;
}

function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let b = '';
  for (let i = 0; i < bytes.byteLength; i++) b += String.fromCharCode(bytes[i]);
  return btoa(b);
}

const soundCache = {};
async function playNote(noteIdx) {
  try {
    const note = NOTES[noteIdx];
    if (!soundCache[noteIdx]) {
      const base64 = bufToBase64(generateWAV(note.freq));
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/wav;base64,${base64}` },
        { shouldPlay: false }
      );
      soundCache[noteIdx] = sound;
    }
    await soundCache[noteIdx].setPositionAsync(0);
    await soundCache[noteIdx].playAsync();
  } catch (e) { /* ignore */ }
}

export default function MusicalNote({ difficulty, onCorrect, onWrong }) {
  const [phase, setPhase] = useState('watch'); // watch | play | result
  const [melody, setMelody] = useState([]);
  const [activeNote, setActiveNote] = useState(-1);
  const [playerSeq, setPlayerSeq] = useState([]);
  const [pressedNote, setPressedNote] = useState(-1);
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0);
  const [streak, setStreak] = useState(0);
  const timeoutsRef = useRef([]);

  const startRound = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    const mel = MELODIES[Math.floor(Math.random() * MELODIES.length)];
    setMelody(mel);
    setPhase('watch');
    setActiveNote(-1);
    setPlayerSeq([]);
    setResult(null);

    const STEP = 600;
    mel.forEach((noteIdx, i) => {
      const t = setTimeout(() => {
        setActiveNote(noteIdx);
        playNote(noteIdx);
      }, i * STEP + 400);
      timeoutsRef.current.push(t);
      const t2 = setTimeout(() => setActiveNote(-1), i * STEP + 400 + 350);
      timeoutsRef.current.push(t2);
    });
    const endT = setTimeout(() => {
      setActiveNote(-1);
      setPhase('play');
    }, mel.length * STEP + 800);
    timeoutsRef.current.push(endT);
  };

  useEffect(() => {
    startRound();
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, [round, difficulty]);

  const handleNotePress = (noteIdx) => {
    playNote(noteIdx);
    setPressedNote(noteIdx);
    setTimeout(() => setPressedNote(-1), 150);
    if (phase !== 'play') return;

    const newSeq = [...playerSeq, noteIdx];
    setPlayerSeq(newSeq);

    if (newSeq.length >= melody.length) {
      let correct = 0;
      melody.forEach((n, i) => { if (newSeq[i] === n) correct++; });
      const passed = correct >= Math.ceil(melody.length * 0.7);
      setResult({ correct, total: melody.length, passed });
      setPhase('result');
      if (passed) { onCorrect(); setStreak(s => s + 1); }
      else { onWrong(); setStreak(0); }
    }
  };

  const BUTTON_SIZE = Math.min((SW - 56) / 4, 72);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Müzik Notası</Text>
      <Text style={styles.streak}>🔥 {streak}</Text>

      <Text style={styles.phaseText}>
        {phase === 'watch' ? 'Notaları dinle ve ezberle...' : phase === 'play' ? 'Şimdi sen çal!' : 'Sonuç'}
      </Text>

      {/* Melody dots */}
      <View style={styles.melodyRow}>
        {melody.map((n, i) => (
          <View key={i} style={[
            styles.melodyDot,
            { backgroundColor: NOTES[n].color },
            phase === 'play' && i < playerSeq.length && styles.melodyDotPlayed,
          ]} />
        ))}
      </View>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result.correct}/{result.total} doğru</Text>
          <Text style={styles.resultSub}>{result.passed ? 'Harika! 🎵' : 'Tekrar dene 💪'}</Text>
          <TouchableOpacity style={styles.nextBtn} onPress={() => setRound(r => r + 1)}>
            <Text style={styles.nextBtnText}>Sonraki</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Note buttons */}
      <View style={styles.notesGrid}>
        {NOTES.map((note, i) => {
          const isActive = activeNote === i;
          const isPressed = pressedNote === i;
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.noteBtn,
                { backgroundColor: note.color, width: BUTTON_SIZE, height: BUTTON_SIZE + 14 },
                (isActive || isPressed) && styles.noteBtnActive,
              ]}
              onPress={() => handleNotePress(i)}
              activeOpacity={0.6}
            >
              <Text style={styles.noteBtnLabel}>{note.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {phase === 'play' && (
        <Text style={styles.hintText}>{playerSeq.length}/{melody.length} nota girildi</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '900', marginBottom: 2 },
  streak: { color: COLORS.textSecondary, fontSize: 15, marginBottom: 6 },
  phaseText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600', marginBottom: 12 },
  melodyRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 14, minHeight: 22 },
  melodyDot: { width: 18, height: 18, borderRadius: 9 },
  melodyDotPlayed: { opacity: 0.25 },
  resultBox: { alignItems: 'center', marginBottom: 12, gap: 4 },
  resultText: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
  resultSub: { color: COLORS.textSecondary, fontSize: 15 },
  nextBtn: { marginTop: 8, backgroundColor: '#8b5cf6', paddingHorizontal: 28, paddingVertical: 10, borderRadius: 12 },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  notesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: SW - 32 },
  noteBtn: {
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  noteBtnActive: { transform: [{ scale: 1.2 }], shadowOpacity: 0.7, elevation: 8 },
  noteBtnLabel: { color: '#fff', fontSize: 17, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 3 },
  hintText: { color: COLORS.textMuted, fontSize: 12, marginTop: 10 },
});
