import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const CHOICES = [{ name: 'Taş', emoji: '✊' }, { name: 'Kağıt', emoji: '✋' }, { name: 'Makas', emoji: '✌️' }];
const DIFFICULTY_CONFIG = { 0: { winsNeeded: 2 }, 1: { winsNeeded: 3 }, 2: { winsNeeded: 4 } };
function getResult(player, ai) {
  if (player === ai) return 'draw';
  if ((player === 0 && ai === 2) || (player === 1 && ai === 0) || (player === 2 && ai === 1)) return 'win';
  return 'lose';
}
export default function RockPaperScissors({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [playerWins, setPlayerWins] = useState(0);
  const [aiWins, setAiWins] = useState(0);
  const [lastResult, setLastResult] = useState('');
  const [aiChoice, setAiChoice] = useState(-1);
  const newGame = () => { setPlayerWins(0); setAiWins(0); setLastResult(''); setAiChoice(-1); };
  useEffect(() => { newGame(); }, [difficulty]);
  const handleChoice = (idx) => {
    playTap();
    const ai = Math.floor(Math.random() * 3);
    setAiChoice(ai);
    const result = getResult(idx, ai);
    setLastResult(result);
    if (result === 'win') {
      const newW = playerWins + 1;
      setPlayerWins(newW);
      if (newW >= config.winsNeeded) { onCorrect(); setTimeout(newGame, 800); }
    } else if (result === 'lose') {
      const newL = aiWins + 1;
      setAiWins(newL);
      if (newL >= config.winsNeeded) { onWrong(); setTimeout(newGame, 800); }
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.score}>Sen {playerWins} - {aiWins} Rakip</Text>
      <Text style={styles.target}>{config.winsNeeded} galibiyet gerekli</Text>
      {aiChoice >= 0 && (<View style={styles.result}><Text style={styles.aiEmoji}>{CHOICES[aiChoice].emoji}</Text><Text style={styles.resultText}>{lastResult === 'win' ? '✅ Kazandın!' : lastResult === 'lose' ? '❌ Kaybettin!' : '🤝 Berabere'}</Text></View>)}
      <Text style={styles.label}>Seçimini yap!</Text>
      <View style={styles.choices}>
        {CHOICES.map((c, i) => (
          <TouchableOpacity key={i} style={styles.choiceBtn} onPress={() => handleChoice(i)} activeOpacity={0.7}>
            <Text style={styles.choiceEmoji}>{c.emoji}</Text>
            <Text style={styles.choiceName}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  score: { color: COLORS.text, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  target: { color: COLORS.textMuted, fontSize: 14, marginBottom: 20 },
  result: { alignItems: 'center', marginBottom: 20 },
  aiEmoji: { fontSize: 60, marginBottom: 8 },
  resultText: { color: COLORS.text, fontSize: 18, fontWeight: '600' },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 },
  choices: { flexDirection: 'row', gap: 16 },
  choiceBtn: { width: 90, height: 100, backgroundColor: COLORS.surface, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  choiceEmoji: { fontSize: 36, marginBottom: 4 },
  choiceName: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
});
