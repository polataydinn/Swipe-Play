import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { gates: 1 }, 1: { gates: 2 }, 2: { gates: 3 } };
const GATE_TYPES = ['AND', 'OR', 'NOT', 'XOR'];
function evalGate(type, a, b) {
  if (type === 'AND') return a && b ? 1 : 0;
  if (type === 'OR') return a || b ? 1 : 0;
  if (type === 'NOT') return a ? 0 : 1;
  if (type === 'XOR') return a !== b ? 1 : 0;
  return 0;
}
export default function LogicGate({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [inputs, setInputs] = useState([0, 0, 0]);
  const [gates, setGates] = useState(['AND']);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const g = [];
    for (let i = 0; i < config.gates; i++) g.push(GATE_TYPES[Math.floor(Math.random() * (i === 0 ? 4 : 3))]);
    setGates(g);
    setInputs([Math.round(Math.random()), Math.round(Math.random()), Math.round(Math.random())]);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const toggleInput = (idx) => {
    playTap();
    const ni = [...inputs]; ni[idx] = ni[idx] ? 0 : 1; setInputs(ni);
  };
  const getOutput = () => {
    let val = evalGate(gates[0], inputs[0], inputs[1]);
    for (let i = 1; i < gates.length; i++) val = evalGate(gates[i], val, inputs[Math.min(i + 1, inputs.length - 1)]);
    return val;
  };
  const output = getOutput();
  const [targetOutput, setTargetOutput] = useState(1);
  useEffect(() => { setTargetOutput(Math.round(Math.random())); }, [gates]);
  const checkCircuit = () => {
    playTap();
    if (output === targetOutput) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    setTimeout(next, 500);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Çıkışı <Text style={styles.targetVal}>{targetOutput}</Text> yap!</Text>
      <View style={styles.circuit}>
        <View style={styles.inputCol}>
          {inputs.slice(0, 2).map((v, i) => (
            <TouchableOpacity key={i} style={[styles.inputBtn, v ? styles.inputOn : styles.inputOff]} onPress={() => toggleInput(i)} activeOpacity={0.7}>
              <Text style={styles.inputText}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.gatesCol}>
          {gates.map((g, i) => (
            <View key={i} style={styles.gateBox}>
              <Text style={styles.gateText}>{g}</Text>
            </View>
          ))}
        </View>
        <View style={styles.outputCol}>
          <View style={[styles.outputBox, output === targetOutput ? styles.outputCorrect : styles.outputWrong]}>
            <Text style={styles.outputText}>{output}</Text>
          </View>
        </View>
      </View>
      <View style={styles.wires}>
        <Text style={styles.wireHint}>Girişlere dokunarak 0/1 değiştir</Text>
      </View>
      <TouchableOpacity style={styles.checkBtn} onPress={checkCircuit} activeOpacity={0.7}>
        <Text style={styles.checkText}>Devreyi Test Et</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 20 },
  targetVal: { color: '#22c55e', fontWeight: '900', fontSize: 24 },
  circuit: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20, backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.surfaceLight },
  inputCol: { gap: 16 },
  inputBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  inputOn: { backgroundColor: '#22c55e20', borderColor: '#22c55e' },
  inputOff: { backgroundColor: '#ef444420', borderColor: '#ef4444' },
  inputText: { fontSize: 24, fontWeight: '900', color: COLORS.text },
  gatesCol: { gap: 12 },
  gateBox: { backgroundColor: '#3b82f620', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#3b82f6' },
  gateText: { color: '#3b82f6', fontSize: 18, fontWeight: '900' },
  outputCol: {},
  outputBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  outputCorrect: { backgroundColor: '#22c55e20', borderColor: '#22c55e' },
  outputWrong: { backgroundColor: '#ef444420', borderColor: '#ef4444' },
  outputText: { fontSize: 24, fontWeight: '900', color: COLORS.text },
  wires: { marginBottom: 16 },
  wireHint: { color: COLORS.textMuted, fontSize: 12 },
  checkBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  checkText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
