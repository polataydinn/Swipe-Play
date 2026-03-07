import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const BUCKET_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];
const DIFFICULTY_CONFIG = { 0: { buckets: 2, speed: 30 }, 1: { buckets: 3, speed: 20 }, 2: { buckets: 4, speed: 15 } };
export default function GravityDrop({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [ballColor, setBallColor] = useState(0);
  const [ballPos, setBallPos] = useState(0);
  const [ballY, setBallY] = useState(0);
  const [score, setScore] = useState(0);
  const intervalRef = useRef(null);
  const bucketW = Math.floor((SW - 40) / config.buckets);

  const newBall = () => {
    const c = Math.floor(Math.random() * config.buckets);
    setBallColor(c);
    setBallPos(Math.floor(Math.random() * config.buckets));
    setBallY(0);
  };

  useEffect(() => { setScore(0); newBall(); }, [difficulty]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setBallY(y => {
        if (y >= 280) {
          if (ballPos === ballColor) { onCorrect(); setScore(s => s + 1); }
          else { onWrong(); }
          setTimeout(newBall, 200);
          return 0;
        }
        return y + config.speed;
      });
    }, 50);
    return () => clearInterval(intervalRef.current);
  }, [ballColor, ballPos, config.speed]);

  const moveLeft = () => { playTap(); setBallPos(p => Math.max(0, p - 1)); };
  const moveRight = () => { playTap(); setBallPos(p => Math.min(config.buckets - 1, p + 1)); };

  return (
    <View style={styles.container}>
      <Text style={styles.score}>⭐ {score}</Text>
      <View style={styles.area}>
        <View style={[styles.ball, { left: ballPos * bucketW + bucketW / 2 - 15, top: ballY, backgroundColor: BUCKET_COLORS[ballColor] }]} />
        <View style={styles.buckets}>
          {Array.from({ length: config.buckets }).map((_, i) => (
            <View key={i} style={[styles.bucket, { width: bucketW - 8, backgroundColor: BUCKET_COLORS[i] + '40', borderColor: BUCKET_COLORS[i] }]} />
          ))}
        </View>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.ctrlBtn} onPress={moveLeft} activeOpacity={0.7}><Text style={styles.ctrlText}>←</Text></TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={moveRight} activeOpacity={0.7}><Text style={styles.ctrlText}>→</Text></TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  score: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  area: { width: SW - 40, height: 320, backgroundColor: COLORS.surface, borderRadius: 20, position: 'relative', overflow: 'hidden', marginBottom: 16 },
  ball: { position: 'absolute', width: 30, height: 30, borderRadius: 15 },
  buckets: { position: 'absolute', bottom: 0, flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  bucket: { height: 40, borderRadius: 8, borderWidth: 2, borderTopWidth: 0 },
  controls: { flexDirection: 'row', gap: 20 },
  ctrlBtn: { width: 70, height: 70, backgroundColor: COLORS.surface, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  ctrlText: { color: COLORS.text, fontSize: 32, fontWeight: '700' },
});
