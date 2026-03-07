import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const SYMBOLS = ['♠', '♥', '♦', '♣', '☆', '○', '□', '△', '◇', '⊕', '⊗', '⊙'];

const DIFFICULTY_CONFIG = {
  0: { pairCount: 3, cols: 3 },
  1: { pairCount: 4, cols: 4 },
  2: { pairCount: 6, cols: 4 },
};

function generatePairs(count) {
  const symbols = SYMBOLS.sort(() => Math.random() - 0.5).slice(0, count);
  const cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
  return cards.map((s, i) => ({ id: i, symbol: s, matched: false, flipped: false }));
}

export default function SymbolMatch({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);

  const newRound = () => {
    setCards(generatePairs(config.pairCount));
    setFlipped([]);
  };

  useEffect(() => { newRound(); }, [difficulty]);

  const handleTap = (idx) => {
    playTap();
    if (cards[idx].matched || flipped.includes(idx) || flipped.length >= 2) return;
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      const [a, b] = newFlipped;
      if (cards[a].symbol === cards[b].symbol) {
        const newCards = [...cards];
        newCards[a] = { ...newCards[a], matched: true };
        newCards[b] = { ...newCards[b], matched: true };
        setCards(newCards);
        setFlipped([]);
        if (newCards.every(c => c.matched)) {
          onCorrect();
          setTimeout(newRound, 500);
        }
      } else {
        onWrong();
        setTimeout(() => setFlipped([]), 600);
      }
    }
  };

  const cellSize = Math.floor((SW - 60 - (config.cols - 1) * 8) / config.cols);

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>Eşleşen sembolleri bul!</Text>
      <View style={[styles.grid, { width: config.cols * (cellSize + 8) }]}>
        {cards.map((card, i) => {
          const show = card.matched || flipped.includes(i);
          return (
            <TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }, card.matched && styles.matched]} onPress={() => handleTap(i)} activeOpacity={0.7}>
              <Text style={styles.cellText}>{show ? card.symbol : '?'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  instruction: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  cell: { backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  matched: { backgroundColor: '#22c55e20', borderColor: '#22c55e' },
  cellText: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
});
