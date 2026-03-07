import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];
const DIFFICULTY_CONFIG = { 0: { type: 'select' }, 1: { type: 'count' }, 2: { type: 'both' } };
export default function CalendarMath({ difficulty, onCorrect, onWrong }) {
  const [month, setMonth] = useState(0);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(0);
  const [selectedDays, setSelectedDays] = useState(new Set());
  const [mode, setMode] = useState('select');
  const [streak, setStreak] = useState(0);
  const next = () => {
    const m = Math.floor(Math.random() * 12);
    setMonth(m); setSelectedDays(new Set());
    const type = Math.floor(Math.random() * 2);
    if (type === 0) {
      const dayOfWeek = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
      const dow = Math.floor(Math.random() * 7);
      const firstDay = Math.floor(Math.random() * 7);
      let count = 0;
      for (let d = 1; d <= DAYS_IN_MONTH[m]; d++) {
        if ((firstDay + d - 1) % 7 === dow) count++;
      }
      setQuestion(`${MONTHS[m]} ayında kaç ${dayOfWeek[dow]} var?`);
      setAnswer(count); setMode('count');
    } else {
      setQuestion(`${MONTHS[m]} ayının son gününü bul!`);
      setAnswer(DAYS_IN_MONTH[m]); setMode('select');
    }
  };
  useEffect(() => { next(); setStreak(0); }, [difficulty]);
  const [counter, setCounter] = useState(0);
  const inc = () => { playTap(); setCounter(c => c + 1); };
  const dec = () => { playTap(); setCounter(c => Math.max(0, c - 1)); };
  const check = () => {
    playTap();
    const userAns = mode === 'count' ? counter : (selectedDays.size > 0 ? Math.max(...selectedDays) : 0);
    if (userAns === answer) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    setCounter(0); setTimeout(next, 500);
  };
  const handleDayTap = (day) => {
    playTap();
    if (day === answer) { onCorrect(); setStreak(s => s + 1); setTimeout(next, 400); }
    else { onWrong(); setStreak(0); setTimeout(next, 400); }
  };
  const cellSize = (SW - 72) / 7;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.question}>{question}</Text>
      {mode === 'select' ? (
        <View style={styles.calendar}>
          {['Pt','Sa','Ça','Pe','Cu','Ct','Pa'].map((d,i) => (
            <View key={i} style={[styles.dayHeader, { width: cellSize }]}><Text style={styles.dayHeaderText}>{d}</Text></View>
          ))}
          {Array.from({ length: DAYS_IN_MONTH[month] }).map((_, i) => (
            <TouchableOpacity key={i} style={[styles.dayCell, { width: cellSize, height: cellSize }]} onPress={() => handleDayTap(i + 1)} activeOpacity={0.7}>
              <Text style={styles.dayText}>{i + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.counterRow}>
          <TouchableOpacity style={styles.cBtn} onPress={dec} activeOpacity={0.7}><Text style={styles.cBtnText}>−</Text></TouchableOpacity>
          <Text style={styles.counterVal}>{counter}</Text>
          <TouchableOpacity style={styles.cBtn} onPress={inc} activeOpacity={0.7}><Text style={styles.cBtnText}>+</Text></TouchableOpacity>
          <TouchableOpacity style={styles.sendBtn} onPress={check} activeOpacity={0.7}><Text style={styles.sendText}>✓</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  question: { color: COLORS.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  calendar: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, maxWidth: SW - 40, marginBottom: 16 },
  dayHeader: { height: 28, justifyContent: 'center', alignItems: 'center' },
  dayHeaderText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  dayCell: { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 8 },
  dayText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  cBtnText: { color: COLORS.text, fontSize: 28, fontWeight: '700' },
  counterVal: { color: COLORS.text, fontSize: 48, fontWeight: '900', minWidth: 60, textAlign: 'center' },
  sendBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  sendText: { color: '#fff', fontSize: 24, fontWeight: '800' },
});
