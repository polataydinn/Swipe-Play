import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DISK_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6'];
const DIFFICULTY_CONFIG = { 0: { disks: 3 }, 1: { disks: 4 }, 2: { disks: 5 } };
export default function TowerOfHanoi({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [pegs, setPegs] = useState([[], [], []]);
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState(0);
  const newGame = () => {
    const disks = Array.from({ length: config.disks }, (_, i) => config.disks - i);
    setPegs([disks, [], []]); setSelected(null); setMoves(0);
  };
  useEffect(() => { newGame(); }, [difficulty]);
  const handlePeg = (pegIdx) => {
    playTap();
    if (selected === null) {
      if (pegs[pegIdx].length > 0) setSelected(pegIdx);
    } else {
      if (selected === pegIdx) { setSelected(null); return; }
      const from = [...pegs[selected]], to = [...pegs[pegIdx]];
      const disk = from[from.length - 1];
      if (to.length > 0 && to[to.length - 1] < disk) { setSelected(null); return; }
      from.pop(); to.push(disk);
      const np = [...pegs]; np[selected] = from; np[pegIdx] = to;
      setPegs(np); setSelected(null); setMoves(m => m + 1);
      if (np[2].length === config.disks) { onCorrect(); setTimeout(newGame, 800); }
    }
  };
  const pegW = (SW - 60) / 3;
  const maxH = 160;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tüm diskleri sağ direğe taşı</Text>
      <Text style={styles.moves}>Hamle: {moves}</Text>
      <View style={styles.pegsRow}>
        {pegs.map((peg, pi) => (
          <TouchableOpacity key={pi} style={[styles.peg, { width: pegW }, selected === pi && styles.selectedPeg]} onPress={() => handlePeg(pi)} activeOpacity={0.7}>
            <View style={styles.pegPole} />
            <View style={styles.diskStack}>
              {peg.map((disk, di) => (
                <View key={di} style={[styles.disk, { width: disk * (pegW / (config.disks + 1)), backgroundColor: DISK_COLORS[disk - 1] }]} />
              ))}
            </View>
            <View style={styles.pegBase} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 8 },
  moves: { color: COLORS.textMuted, fontSize: 14, marginBottom: 16 },
  pegsRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  peg: { height: 180, alignItems: 'center', justifyContent: 'flex-end', backgroundColor: COLORS.surface, borderRadius: 12, padding: 4 },
  selectedPeg: { borderWidth: 2, borderColor: '#3b82f6' },
  pegPole: { position: 'absolute', top: 10, width: 4, height: 140, backgroundColor: COLORS.surfaceLight, borderRadius: 2 },
  diskStack: { alignItems: 'center', justifyContent: 'flex-end', flex: 1, paddingBottom: 4, gap: 2 },
  disk: { height: 14, borderRadius: 7 },
  pegBase: { width: '90%', height: 6, backgroundColor: COLORS.surfaceLight, borderRadius: 3 },
});
