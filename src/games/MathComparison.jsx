import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { max: 20 }, 1: { max: 50 }, 2: { max: 100 } };
function genExpr(max) {
  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * (max / 2)) + 1;
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * (max > 30 ? 2 : 3))];
  const val = op === '+' ? a + b : op === '-' ? a - b : a * b;
  return { text: `${a} ${op} ${b}`, value: val };
}
export default function MathComparison({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [left, setLeft] = useState({ text: '', value: 0 });
  const [right, setRight] = useState({ text: '', value: 0 });
  const [streak, setStreak] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const next = () => {
    setLeft(genExpr(config.max)); setRight(genExpr(config.max));
    translateX.setValue(0); translateY.setValue(0);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const checkAnswer = (dir) => {
    playTap();
    const correct = left.value > right.value ? 'left' : left.value < right.value ? 'right' : 'equal';
    if (correct === dir) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    const toX = dir === 'left' ? -SW : dir === 'right' ? SW : 0;
    const toY = dir === 'equal' ? -200 : 0;
    Animated.timing(dir === 'equal' ? translateY : translateX, {
      toValue: dir === 'equal' ? toY : toX, duration: 200, useNativeDriver: true
    }).start(next);
  };
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10 || Math.abs(gs.dy) > 10,
      onPanResponderGrant: () => { onLockSwipe?.(); },
      onPanResponderMove: Animated.event([null, { dx: translateX, dy: translateY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gs) => {
        onUnlockSwipe?.();
        if (gs.dx > 80) checkAnswer('right');
        else if (gs.dx < -80) checkAnswer('left');
        else if (gs.dy < -80) checkAnswer('equal');
        else {
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => { onUnlockSwipe?.(); },
    })
  ).current;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <View style={styles.hints}>
        <Text style={styles.hintL}>← Sol büyük</Text>
        <Text style={styles.hintUp}>↑ Eşit</Text>
        <Text style={styles.hintR}>Sağ büyük →</Text>
      </View>
      <Animated.View style={[styles.card, { transform: [{ translateX }, { translateY }] }]} {...panResponder.panHandlers}>
        <View style={styles.exprRow}>
          <View style={styles.exprBox}><Text style={styles.exprText}>{left.text}</Text></View>
          <Text style={styles.vs}>VS</Text>
          <View style={styles.exprBox}><Text style={styles.exprText}>{right.text}</Text></View>
        </View>
      </Animated.View>
      <Text style={styles.tip}>Büyük tarafa kaydır, eşitse yukarı</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  hints: { flexDirection: 'row', justifyContent: 'space-between', width: SW - 40, marginBottom: 12 },
  hintL: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
  hintUp: { color: '#f59e0b', fontSize: 12, fontWeight: '700' },
  hintR: { color: '#22c55e', fontSize: 12, fontWeight: '700' },
  card: { width: SW - 50, backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.surfaceLight },
  exprRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  exprBox: { flex: 1, backgroundColor: COLORS.background, borderRadius: 14, padding: 16, alignItems: 'center' },
  exprText: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  vs: { color: COLORS.textMuted, fontSize: 18, fontWeight: '900' },
  tip: { color: COLORS.textMuted, fontSize: 12, marginTop: 20 },
});
