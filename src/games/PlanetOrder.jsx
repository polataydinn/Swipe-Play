import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const PLANETS = ['Merkür', 'Venüs', 'Dünya', 'Mars', 'Jüpiter', 'Satürn', 'Uranüs', 'Neptün'];
const PLANETS_SIZE = ['Jüpiter', 'Satürn', 'Uranüs', 'Neptün', 'Dünya', 'Venüs', 'Mars', 'Merkür'];
const DIFFICULTY_CONFIG = { 0: { count: 4, mode: 'distance' }, 1: { count: 6, mode: 'distance' }, 2: { count: 6, mode: 'size' } };
function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
export default function PlanetOrder({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const correctOrder = config.mode === 'distance' ? PLANETS : PLANETS_SIZE;
  const [planets, setPlanets] = useState([]); const [selected, setSelected] = useState([]); const [nextIdx, setNextIdx] = useState(0);
  const newRound = () => {
    const subset = correctOrder.slice(0, config.count);
    setPlanets(shuffle(subset)); setSelected([]); setNextIdx(0);
  };
  useEffect(() => { newRound(); }, [difficulty]);
  const handlePress = (name) => {
    playTap();
    const correct = correctOrder.slice(0, config.count);
    if (name === correct[nextIdx]) {
      setSelected([...selected, name]); const n = nextIdx + 1; setNextIdx(n);
      if (n === config.count) { onCorrect(); setTimeout(newRound, 500); }
    } else { onWrong(); setSelected([]); setNextIdx(0); }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{config.mode === 'distance' ? 'Güneşe en yakından uzağa sırala!' : 'En büyükten küçüğe sırala!'}</Text>
      <View style={styles.selected}>{selected.map((p, i) => (<View key={i} style={styles.selItem}><Text style={styles.selText}>{i + 1}. {p}</Text></View>))}</View>
      <View style={styles.opts}>
        {planets.map((p, i) => {
          const used = selected.includes(p);
          return (<TouchableOpacity key={i} style={[styles.btn, used && styles.btnUsed]} onPress={() => handlePress(p)} activeOpacity={0.7} disabled={used}><Text style={[styles.btnText, used && styles.btnTextUsed]}>{p}</Text></TouchableOpacity>);
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 20, textAlign: 'center' },
  selected: { gap: 4, marginBottom: 20 },
  selItem: { backgroundColor: '#22c55e20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  selText: { color: '#22c55e', fontSize: 16, fontWeight: '600' },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  btn: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnUsed: { opacity: 0.3 },
  btnText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  btnTextUsed: { color: COLORS.textMuted },
});
