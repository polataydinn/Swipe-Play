import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playTick } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const EMOJIS = ['🎮', '🎲', '🎯', '🎪', '🎨', '🎭', '🎵', '🎸', '🏆', '⭐', '🌈', '🔥', '💎', '🍕', '🚀', '🦄', '🐱', '🌸'];

const DIFFICULTY_CONFIG = {
  0: { pairs: 4, cols: 4 },
  1: { pairs: 6, cols: 4 },
  2: { pairs: 8, cols: 4 },
};

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryMatch({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const lockRef = useRef(false);

  const initGame = useCallback(() => {
    const selected = shuffleArray(EMOJIS).slice(0, config.pairs);
    const deck = shuffleArray([...selected, ...selected]).map((emoji, i) => ({
      id: i,
      emoji,
    }));
    setCards(deck);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    lockRef.current = false;
  }, [config.pairs]);

  useEffect(() => {
    initGame();
  }, [difficulty]);

  const handleFlip = (id) => {
    if (lockRef.current) return;
    if (flipped.includes(id) || matched.has(id)) return;

    playTap();
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      lockRef.current = true;
      setMoves((m) => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        // Match!
        setTimeout(() => {
          setMatched((prev) => {
            const next = new Set(prev);
            next.add(first);
            next.add(second);
            if (next.size === cards.length) {
              // All matched — restart
              setTimeout(() => initGame(), 1000);
            }
            return next;
          });
          setFlipped([]);
          lockRef.current = false;
          onCorrect();
        }, 300);
      } else {
        setTimeout(() => {
          setFlipped([]);
          lockRef.current = false;
          onWrong();
        }, 800);
      }
    }
  };

  const cardSize = (SW - 60 - (config.cols - 1) * 8) / config.cols;

  return (
    <View style={styles.container}>
      <Text style={styles.moves}>Hamle: {moves}</Text>
      <View style={[styles.grid, { width: SW - 40 }]}>
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || matched.has(card.id);
          const isMatched = matched.has(card.id);
          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                { width: cardSize, height: cardSize },
                isMatched && styles.cardMatched,
                isFlipped && !isMatched && styles.cardFlipped,
              ]}
              onPress={() => handleFlip(card.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.cardText}>{isFlipped ? card.emoji : '?'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  moves: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surfaceLight,
  },
  cardFlipped: { borderColor: '#3498db', backgroundColor: COLORS.surfaceLight },
  cardMatched: { borderColor: '#22c55e', backgroundColor: '#22c55e15' },
  cardText: { fontSize: 28 },
});
