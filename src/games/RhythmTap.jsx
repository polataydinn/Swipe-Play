import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { COLORS } from '../constants/colors';
import { playTap, playTick } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { beats: 4, tempo: 600, tolerance: 200 },
  1: { beats: 6, tempo: 450, tolerance: 150 },
  2: { beats: 8, tempo: 350, tolerance: 100 },
};

function generatePattern(beats) {
  // Generate a rhythm pattern: 1 = beat, 0 = rest
  const pattern = [];
  for (let i = 0; i < beats; i++) {
    pattern.push(Math.random() > 0.3 ? 1 : 0);
  }
  // Ensure at least 3 beats
  if (pattern.filter(Boolean).length < 3) {
    pattern[0] = 1;
    pattern[1] = 1;
    pattern[Math.floor(beats / 2)] = 1;
  }
  return pattern;
}

export default function RhythmTap({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [phase, setPhase] = useState('watch'); // watch | play | result
  const [pattern, setPattern] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [tapTimes, setTapTimes] = useState([]);
  const [score, setScore] = useState(null);
  const [round, setRound] = useState(0);
  const patternTimesRef = useRef([]);
  const playStartRef = useRef(0);
  const timeoutsRef = useRef([]);

  const scale = useSharedValue(1);

  const startDemo = useCallback(() => {
    const pat = generatePattern(config.beats);
    setPattern(pat);
    setPhase('watch');
    setActiveIdx(-1);
    setTapTimes([]);
    setScore(null);

    // Record pattern beat times
    const times = [];
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    pat.forEach((beat, i) => {
      const t = setTimeout(() => {
        setActiveIdx(i);
        if (beat === 1) {
          times.push(i * config.tempo);
          scale.value = withSequence(
            withTiming(1.3, { duration: 80 }),
            withTiming(1, { duration: 80 })
          );
        }
      }, i * config.tempo);
      timeoutsRef.current.push(t);
    });

    const endT = setTimeout(() => {
      setActiveIdx(-1);
      patternTimesRef.current = times;
      setPhase('play');
      playStartRef.current = Date.now();
    }, pat.length * config.tempo + 300);
    timeoutsRef.current.push(endT);
  }, [config]);

  useEffect(() => {
    startDemo();
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, [difficulty, round]);

  const handleTap = () => {
    playTap();
    if (phase !== 'play') return;
    const elapsed = Date.now() - playStartRef.current;
    const newTaps = [...tapTimes, elapsed];
    setTapTimes(newTaps);

    scale.value = withSequence(
      withTiming(1.3, { duration: 60 }),
      withTiming(1, { duration: 60 })
    );

    const expectedBeats = patternTimesRef.current;
    if (newTaps.length >= expectedBeats.length) {
      // Evaluate
      let totalDiff = 0;
      expectedBeats.forEach((expected, i) => {
        totalDiff += Math.abs((newTaps[i] || 0) - expected);
      });
      const avgDiff = totalDiff / expectedBeats.length;
      const accuracy = Math.max(0, Math.round((1 - avgDiff / (config.tempo * 2)) * 100));
      setScore(accuracy);
      setPhase('result');

      if (accuracy >= 50) {
        onCorrect();
      } else {
        onWrong();
      }
    }
  };

  const padStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.phaseText}>
        {phase === 'watch' ? 'İzle ve Ezberle' : phase === 'play' ? 'Şimdi Sen Vur!' : 'Sonuç'}
      </Text>

      {/* Pattern visualization */}
      <View style={styles.patternRow}>
        {pattern.map((beat, i) => (
          <View
            key={i}
            style={[
              styles.beatDot,
              beat === 1 ? styles.beatActive : styles.beatRest,
              i === activeIdx && styles.beatCurrent,
            ]}
          />
        ))}
      </View>

      {phase === 'result' && score !== null && (
        <View style={styles.resultContainer}>
          <Text style={styles.scoreText}>{score}%</Text>
          <Text style={styles.resultLabel}>
            {score >= 80 ? 'Mükemmel! 🎵' : score >= 50 ? 'İyi! 👍' : 'Tekrar Dene 💪'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setRound((r) => r + 1)}>
            <Text style={styles.retryText}>Sonraki</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase !== 'result' && (
        <TouchableOpacity onPress={handleTap} disabled={phase !== 'play'} activeOpacity={0.7}>
          <Animated.View
            style={[
              styles.tapPad,
              phase === 'play' ? styles.tapPadActive : styles.tapPadInactive,
              padStyle,
            ]}
          >
            <Text style={styles.tapText}>
              {phase === 'play'
                ? `🥁 VUR!\n(${tapTimes.length}/${patternTimesRef.current.length})`
                : '👀'}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const PAD_SIZE = SW * 0.45;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  phaseText: { color: COLORS.text, fontSize: 22, fontWeight: '700', marginBottom: 24 },
  patternRow: { flexDirection: 'row', gap: 8, marginBottom: 30, flexWrap: 'wrap', justifyContent: 'center' },
  beatDot: { width: 20, height: 20, borderRadius: 10 },
  beatActive: { backgroundColor: '#8e24aa' },
  beatRest: { backgroundColor: COLORS.surfaceLight },
  beatCurrent: { borderWidth: 3, borderColor: '#fff' },
  tapPad: {
    width: PAD_SIZE, height: PAD_SIZE, borderRadius: PAD_SIZE / 2,
    justifyContent: 'center', alignItems: 'center',
  },
  tapPadActive: { backgroundColor: '#8e24aa' },
  tapPadInactive: { backgroundColor: COLORS.surface },
  tapText: { color: COLORS.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  resultContainer: { alignItems: 'center', gap: 12 },
  scoreText: { color: COLORS.text, fontSize: 56, fontWeight: '800' },
  resultLabel: { color: COLORS.textSecondary, fontSize: 18 },
  retryBtn: { backgroundColor: '#8e24aa', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20, marginTop: 12 },
  retryText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
});
