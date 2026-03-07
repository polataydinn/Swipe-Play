import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const PAIRS = [
  { inventor: 'Edison', invention: 'Ampul' }, { inventor: 'Bell', invention: 'Telefon' },
  { inventor: 'Tesla', invention: 'AC Motor' }, { inventor: 'Wright', invention: 'Uçak' },
  { inventor: 'Gutenberg', invention: 'Matbaa' }, { inventor: 'Nobel', invention: 'Dinamit' },
  { inventor: 'Marconi', invention: 'Radyo' }, { inventor: 'Watt', invention: 'Buhar Makinesi' },
  { inventor: 'Morse', invention: 'Telgraf' }, { inventor: 'Pasteur', invention: 'Pastörizasyon' },
];
const DIFFICULTY_CONFIG = { 0: { count: 3 }, 1: { count: 4 }, 2: { count: 5 } };
export default function InventorMatch({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [streak, setStreak] = useState(0);
  const newGame = () => {
    const pool = [...PAIRS].sort(() => Math.random() - 0.5).slice(0, config.count);
    const items = [];
    pool.forEach((p, i) => {
      items.push({ id: i * 2, text: p.inventor, pairId: i, type: 'inventor' });
      items.push({ id: i * 2 + 1, text: p.invention, pairId: i, type: 'invention' });
    });
    setCards(items.sort(() => Math.random() - 0.5));
    setFlipped([]); setMatched(new Set());
  };
  useEffect(() => { newGame(); setStreak(0); }, [difficulty]);
  const handleTap = (card) => {
    if (matched.has(card.pairId) || flipped.includes(card.id) || flipped.length >= 2) return;
    playTap();
    const nf = [...flipped, card.id];
    setFlipped(nf);
    if (nf.length === 2) {
      const c1 = cards.find(c => c.id === nf[0]);
      const c2 = cards.find(c => c.id === nf[1]);
      if (c1.pairId === c2.pairId && c1.type !== c2.type) {
        const nm = new Set(matched); nm.add(c1.pairId); setMatched(nm);
        setFlipped([]);
        if (nm.size === config.count) { onCorrect(); setStreak(s => s + 1); setTimeout(newGame, 600); }
      } else {
        setTimeout(() => { setFlipped([]); }, 600);
      }
    }
  };
  const isFlipped = (id) => flipped.includes(id);
  const isMatched = (pairId) => matched.has(pairId);
  const cardW = (SW - 56) / 2 - 4;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Mucit ve icadı eşleştir!</Text>
      <View style={styles.grid}>
        {cards.map(card => (
          <TouchableOpacity key={card.id} style={[styles.card, { width: cardW }, isMatched(card.pairId) && styles.matchedCard, isFlipped(card.id) && styles.flippedCard]} onPress={() => handleTap(card)} activeOpacity={0.7} disabled={isMatched(card.pairId)}>
            {isFlipped(card.id) || isMatched(card.pairId) ? (
              <>
                <Text style={[styles.cardText, card.type === 'inventor' ? styles.inventorText : styles.inventionText]}>{card.text}</Text>
                <Text style={styles.typeLabel}>{card.type === 'inventor' ? '👤 Mucit' : '💡 İcat'}</Text>
              </>
            ) : (
              <Text style={styles.hidden}>?</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  card: { height: 70, backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight, padding: 8 },
  flippedCard: { borderColor: '#3b82f6' },
  matchedCard: { backgroundColor: '#22c55e20', borderColor: '#22c55e' },
  cardText: { fontSize: 14, fontWeight: '700' },
  inventorText: { color: '#3b82f6' },
  inventionText: { color: '#f59e0b' },
  typeLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  hidden: { color: COLORS.textMuted, fontSize: 28, fontWeight: '800' },
});
