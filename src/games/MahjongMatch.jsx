import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { pairs: 8, cols: 4, timeLimit: 60000 },
  1: { pairs: 12, cols: 4, timeLimit: 50000 },
  2: { pairs: 18, cols: 6, timeLimit: 45000 },
};

const ALL_TILES = [
  '🀇','🀈','🀉','🀊','🀋','🀌','🀍','🀎','🀏',
  '🀙','🀚','🀛','🀜','🀝','🀞','🀟','🀠','🀡',
  '🀀','🀁','🀂','🀃','🀄','🎴','🃏','🎲',
  '🌸','🍀','🔮','🎯','🎪','🎭','🎨','🎬',
  '🦊','🐉','🦋','🌙',
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MahjongMatch({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [tiles, setTiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [gameOver, setGameOver] = useState(false);
  const intervalRef = useRef(null);
  const lockRef = useRef(false);

  const initGame = () => {
    const symbols = shuffle(ALL_TILES).slice(0, config.pairs);
    const board = shuffle([...symbols, ...symbols]).map((emoji, i) => ({ id: i, emoji }));
    setTiles(board);
    setSelected(null);
    setMatched(new Set());
    setTimeLeft(config.timeLimit);
    setGameOver(false);
    lockRef.current = false;
  };

  useEffect(() => { initGame(); }, [difficulty]);

  useEffect(() => {
    if (gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 100) {
          clearInterval(intervalRef.current);
          setGameOver(true);
          onWrong();
          return 0;
        }
        return t - 100;
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [gameOver, difficulty]);

  const handleTap = (id) => {
    if (gameOver || lockRef.current || matched.has(id)) return;
    playTap();

    if (selected === null) {
      setSelected(id);
    } else if (selected === id) {
      setSelected(null);
    } else {
      const t1 = tiles.find(t => t.id === selected);
      const t2 = tiles.find(t => t.id === id);
      if (t1.emoji === t2.emoji) {
        const newMatched = new Set(matched);
        newMatched.add(t1.id);
        newMatched.add(t2.id);
        setMatched(newMatched);
        setSelected(null);
        if (newMatched.size === tiles.length) {
          clearInterval(intervalRef.current);
          setGameOver(true);
          onCorrect();
        }
      } else {
        lockRef.current = true;
        setSelected(id);
        setTimeout(() => {
          setSelected(null);
          lockRef.current = false;
        }, 500);
      }
    }
  };

  const cols = config.cols;
  const tileSize = Math.floor((Math.min(SW - 50, 340) - (cols - 1) * 6) / cols);
  const progress = timeLeft / config.timeLimit;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mahjong Eşle</Text>
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: progress > 0.3 ? '#22c55e' : '#ef4444' }]} />
      </View>
      <Text style={styles.sub}>{matched.size / 2} / {config.pairs} çift</Text>

      <View style={[styles.grid, { width: cols * (tileSize + 6) }]}>
        {tiles.map(tile => {
          const isMatched = matched.has(tile.id);
          const isSelected = selected === tile.id;
          return (
            <TouchableOpacity
              key={tile.id}
              style={[
                styles.tile,
                { width: tileSize, height: tileSize },
                isMatched && styles.tileMatched,
                isSelected && styles.tileSelected,
              ]}
              onPress={() => handleTap(tile.id)}
              disabled={isMatched}
            >
              <Text style={[styles.tileText, { fontSize: tileSize * 0.45 }, isMatched && { opacity: 0.3 }]}>
                {tile.emoji}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {gameOver && matched.size < tiles.length && (
        <TouchableOpacity style={styles.restart} onPress={initGame}>
          <Text style={styles.restartText}>Tekrar Oyna</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 20, margin: 10, backgroundColor: COLORS.surface },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '900', marginBottom: 6 },
  timerBar: { width: '85%', height: 5, backgroundColor: COLORS.background, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  timerFill: { height: '100%', borderRadius: 3 },
  sub: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  tile: { backgroundColor: '#1a2744', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)' },
  tileSelected: { borderColor: '#facc15', backgroundColor: '#1e3050' },
  tileMatched: { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.3)' },
  tileText: { textAlign: 'center' },
  restart: { marginTop: 16, backgroundColor: '#8b5cf6', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  restartText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
