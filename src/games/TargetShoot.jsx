import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { size: 70, showTime: 2000, rounds: 8 },
  1: { size: 50, showTime: 1200, rounds: 12 },
  2: { size: 35, showTime: 700, rounds: 16 },
};

export default function TargetShoot({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [visible, setVisible] = useState(true);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const timeoutRef = useRef(null);

  const areaW = SW - 60;
  const areaH = 400;

  const showTarget = () => {
    setPos({ x: Math.random() * (areaW - config.size), y: Math.random() * (areaH - config.size) });
    setVisible(true);
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      onWrong();
      setRound(r => r + 1);
    }, config.showTime);
  };

  useEffect(() => { setScore(0); setRound(0); showTarget(); return () => clearTimeout(timeoutRef.current); }, [difficulty]);

  useEffect(() => {
    if (round > 0 && round < config.rounds) {
      const t = setTimeout(showTarget, 400);
      return () => clearTimeout(t);
    }
  }, [round]);

  const handleHit = () => {
    playTap();
    clearTimeout(timeoutRef.current);
    setVisible(false);
    setScore(s => s + 1);
    onCorrect();
    setRound(r => r + 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.score}>🎯 {score}/{round < config.rounds ? round : config.rounds}</Text>
      <View style={[styles.area, { width: areaW, height: areaH }]}>
        {visible && (
          <TouchableOpacity style={[styles.target, { width: config.size, height: config.size, borderRadius: config.size / 2, left: pos.x, top: pos.y }]} onPress={handleHit} activeOpacity={0.7}>
            <Text style={[styles.targetText, { fontSize: config.size * 0.5 }]}>🎯</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  score: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 16 },
  area: { backgroundColor: COLORS.surface, borderRadius: 20, position: 'relative', overflow: 'hidden' },
  target: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  targetText: { textAlign: 'center' },
});
