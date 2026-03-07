import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const DIFFICULTY_CONFIG = { 0: { max: 5 }, 1: { max: 7 }, 2: { max: 8 } };
export default function FactorialGuess({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [num, setNum] = useState(3);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [runningProduct, setRunningProduct] = useState(1);
  const [streak, setStreak] = useState(0);
  const next = () => {
    const n = Math.floor(Math.random() * (config.max - 1)) + 2;
    setNum(n);
    const s = [];
    for (let i = n; i >= 1; i--) s.push(i);
    setSteps(s); setCurrentStep(0); setRunningProduct(1);
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const handleMultiply = () => {
    playTap();
    const newProduct = runningProduct * steps[currentStep];
    setRunningProduct(newProduct);
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    if (nextStep >= steps.length) {
      onCorrect(); setStreak(s => s + 1); setTimeout(next, 800);
    }
  };
  const factorial = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.title}>{num}! = ?</Text>
      <View style={styles.chain}>
        {steps.map((s, i) => (
          <View key={i} style={styles.stepRow}>
            {i > 0 && <Text style={styles.times}>×</Text>}
            <View style={[styles.stepBox, i < currentStep && styles.doneStep, i === currentStep && styles.currentStepBox]}>
              <Text style={[styles.stepText, i < currentStep && styles.doneStepText]}>{s}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.productRow}>
        <Text style={styles.productLabel}>Sonuç:</Text>
        <Text style={styles.productValue}>{runningProduct}</Text>
      </View>
      {currentStep < steps.length && (
        <TouchableOpacity style={styles.multiplyBtn} onPress={handleMultiply} activeOpacity={0.7}>
          <Text style={styles.multiplyText}>{runningProduct} × {steps[currentStep]} = {runningProduct * steps[currentStep]}</Text>
        </TouchableOpacity>
      )}
      {currentStep >= steps.length && (
        <Text style={styles.result}>{num}! = {factorial(num)}</Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  title: { color: COLORS.text, fontSize: 36, fontWeight: '900', marginBottom: 20 },
  chain: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 24, justifyContent: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  times: { color: COLORS.textMuted, fontSize: 20, fontWeight: '700' },
  stepBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  doneStep: { backgroundColor: '#22c55e20', borderColor: '#22c55e' },
  currentStepBox: { borderColor: '#3b82f6', borderWidth: 2 },
  stepText: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  doneStepText: { color: '#22c55e' },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  productLabel: { color: COLORS.textSecondary, fontSize: 16 },
  productValue: { color: '#f59e0b', fontSize: 32, fontWeight: '900' },
  multiplyBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16 },
  multiplyText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  result: { color: '#22c55e', fontSize: 24, fontWeight: '800' },
});
