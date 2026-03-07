import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const SYMBOLS = [
  { symbol: 'I', value: 1 }, { symbol: 'V', value: 5 }, { symbol: 'X', value: 10 },
  { symbol: 'L', value: 50 }, { symbol: 'C', value: 100 }, { symbol: 'D', value: 500 }, { symbol: 'M', value: 1000 },
];
function toRoman(n) {
  const vals = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let r = ''; for (const [v, s] of vals) while (n >= v) { r += s; n -= v; } return r;
}
function fromRoman(s) {
  const map = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
  let t = 0; for (let i = 0; i < s.length; i++) { if (i+1 < s.length && map[s[i]] < map[s[i+1]]) t -= map[s[i]]; else t += map[s[i]]; } return t;
}
const DIFFICULTY_CONFIG = { 0: { max: 20, symbols: 3 }, 1: { max: 100, symbols: 5 }, 2: { max: 500, symbols: 7 } };
export default function RomanNumerals({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [target, setTarget] = useState(1);
  const [built, setBuilt] = useState('');
  const [streak, setStreak] = useState(0);
  const next = () => { setTarget(Math.floor(Math.random() * config.max) + 1); setBuilt(''); };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const addSymbol = (s) => { playTap(); setBuilt(b => b + s); };
  const removeLast = () => { playTap(); setBuilt(b => b.slice(0, -1)); };
  const check = () => {
    playTap();
    if (built === toRoman(target)) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    setTimeout(next, 500);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Roma rakamıyla yaz:</Text>
      <Text style={styles.target}>{target}</Text>
      <View style={styles.display}>
        <Text style={styles.built}>{built || '...'}</Text>
        {built ? <Text style={styles.builtValue}>= {fromRoman(built)}</Text> : null}
      </View>
      <View style={styles.symbols}>
        {SYMBOLS.slice(0, config.symbols).map((s, i) => (
          <TouchableOpacity key={i} style={styles.symBtn} onPress={() => addSymbol(s.symbol)} activeOpacity={0.7}>
            <Text style={styles.symText}>{s.symbol}</Text>
            <Text style={styles.symVal}>{s.value}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.delBtn} onPress={removeLast} activeOpacity={0.7}>
          <Text style={styles.delText}>⌫</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkBtn} onPress={check} activeOpacity={0.7}>
          <Text style={styles.checkText}>Gönder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 8 },
  target: { color: '#f59e0b', fontSize: 56, fontWeight: '900', marginBottom: 16 },
  display: { backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 16, marginBottom: 20, minWidth: 200, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  built: { color: COLORS.text, fontSize: 32, fontWeight: '800', letterSpacing: 4 },
  builtValue: { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },
  symbols: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' },
  symBtn: { width: 52, height: 60, backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  symText: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  symVal: { color: COLORS.textMuted, fontSize: 10 },
  actions: { flexDirection: 'row', gap: 12 },
  delBtn: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.surfaceLight },
  delText: { color: '#ef4444', fontSize: 20, fontWeight: '700' },
  checkBtn: { paddingHorizontal: 24, paddingVertical: 14, backgroundColor: '#22c55e', borderRadius: 14 },
  checkText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
