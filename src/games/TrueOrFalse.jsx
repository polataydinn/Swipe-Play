import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const STATEMENTS = [
  { text: 'Dünya güneşin etrafında döner', answer: true },
  { text: 'Su 50°C de kaynar', answer: false },
  { text: 'İnsan vücudunda 206 kemik vardır', answer: true },
  { text: 'Ay kendi ışığını üretir', answer: false },
  { text: 'Bir yılda 365 gün vardır', answer: true },
  { text: 'Mars güneşe en yakın gezegendir', answer: false },
  { text: 'DNA çift sarmal yapıdadır', answer: true },
  { text: 'Penguen bir memeli hayvandır', answer: false },
  { text: 'Işık sesten hızlıdır', answer: true },
  { text: 'Brezilya Avrupa kıtasındadır', answer: false },
  { text: 'Oksijen sembolü O dir', answer: true },
  { text: 'Kare 5 kenarlıdır', answer: false },
  { text: 'Türkiye iki kıtada yer alır', answer: true },
  { text: 'Balıklar akciğerle nefes alır', answer: false },
  { text: 'Pi sayısı 3.14 ile başlar', answer: true },
  { text: 'Güneş bir gezegendir', answer: false },
  { text: 'Everest dünyanın en yüksek dağıdır', answer: true },
  { text: 'Arılar bal üretir', answer: true },
  { text: 'İstanbul Türkiyenin başkentidir', answer: false },
  { text: 'Altının sembolü Au dur', answer: true },
];
export default function TrueOrFalse({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const [current, setCurrent] = useState(0);
  const [streak, setStreak] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const next = () => {
    setCurrent(Math.floor(Math.random() * STATEMENTS.length));
    translateX.setValue(0); opacity.setValue(1);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleSwipe = (isTrue) => {
    playTap();
    const correct = STATEMENTS[current].answer === isTrue;
    Animated.parallel([
      Animated.timing(translateX, { toValue: isTrue ? SW : -SW, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      if (correct) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
      next();
    });
  };
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10,
      onPanResponderGrant: () => { onLockSwipe?.(); },
      onPanResponderMove: Animated.event([null, { dx: translateX }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gs) => {
        onUnlockSwipe?.();
        if (gs.dx > 80) handleSwipe(true);
        else if (gs.dx < -80) handleSwipe(false);
        else Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
      onPanResponderTerminate: () => { onUnlockSwipe?.(); },
    })
  ).current;
  const rotate = translateX.interpolate({ inputRange: [-SW, 0, SW], outputRange: ['-15deg', '0deg', '15deg'] });
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <View style={styles.hints}>
        <Text style={styles.hintL}>← YANLIŞ</Text>
        <Text style={styles.hintR}>DOĞRU →</Text>
      </View>
      <Animated.View style={[styles.card, { transform: [{ translateX }, { rotate }], opacity }]} {...panResponder.panHandlers}>
        <Text style={styles.statement}>{STATEMENTS[current].text}</Text>
      </Animated.View>
      <Text style={styles.tip}>Kartı sağa (doğru) veya sola (yanlış) kaydır</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 20 },
  hints: { flexDirection: 'row', justifyContent: 'space-between', width: SW - 60, marginBottom: 16 },
  hintL: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
  hintR: { color: '#22c55e', fontSize: 14, fontWeight: '700' },
  card: { width: SW - 60, paddingVertical: 48, paddingHorizontal: 24, backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.surfaceLight, alignItems: 'center' },
  statement: { color: COLORS.text, fontSize: 22, fontWeight: '700', textAlign: 'center', lineHeight: 32 },
  tip: { color: COLORS.textMuted, fontSize: 12, marginTop: 20 },
});
