import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { speed: 2, goal: 5 }, 1: { speed: 3, goal: 7 }, 2: { speed: 4, goal: 10 } };
const BLOCK_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#a855f7'];
export default function StackBuilder({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [stack, setStack] = useState([]);
  const [posX, setPosX] = useState(0);
  const [dir, setDir] = useState(1);
  const intervalRef = useRef(null);
  const areaW = SW - 60;
  const blockW = 80;
  const newGame = () => { setStack([]); setPosX(0); setDir(1); };
  useEffect(() => { newGame(); }, [difficulty]);
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setPosX(x => {
        const nx = x + dir * config.speed;
        if (nx >= areaW - blockW || nx <= 0) setDir(d => -d);
        return Math.max(0, Math.min(areaW - blockW, nx));
      });
    }, 16);
    return () => clearInterval(intervalRef.current);
  }, [dir, config.speed]);
  const handleDrop = () => {
    playTap();
    if (stack.length === 0) { setStack([{ x: posX, w: blockW }]); return; }
    const prev = stack[stack.length - 1];
    const overlap = Math.min(posX + blockW, prev.x + prev.w) - Math.max(posX, prev.x);
    if (overlap <= 0) { onWrong(); setTimeout(newGame, 500); return; }
    const newX = Math.max(posX, prev.x);
    const ns = [...stack, { x: newX, w: overlap }];
    setStack(ns);
    if (ns.length >= config.goal) { onCorrect(); setTimeout(newGame, 800); }
  };
  const blockH = 20;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{stack.length}/{config.goal} blok yığ!</Text>
      <View style={[styles.area, { width: areaW, height: 300 }]}>
        <View style={[styles.moving, { left: posX, width: blockW, top: 10, backgroundColor: BLOCK_COLORS[stack.length % BLOCK_COLORS.length] }]} />
        {stack.map((b, i) => (
          <View key={i} style={[styles.block, { left: b.x, width: b.w, bottom: i * blockH, backgroundColor: BLOCK_COLORS[i % BLOCK_COLORS.length] }]} />
        ))}
      </View>
      <TouchableOpacity style={styles.dropBtn} onPress={handleDrop} activeOpacity={0.7}><Text style={styles.dropText}>BIRAK</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 12 },
  area: { backgroundColor: COLORS.surface, borderRadius: 16, position: 'relative', overflow: 'hidden', marginBottom: 16 },
  moving: { position: 'absolute', height: 20, borderRadius: 4 },
  block: { position: 'absolute', height: 20, borderRadius: 4 },
  dropBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16 },
  dropText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
