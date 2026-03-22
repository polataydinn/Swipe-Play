import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, PanResponder } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');
const BOARD = 4;
const TILE_GAP = 6;
const BOARD_PAD = 10;
const BOARD_SIZE = Math.min(SW - 40, 340);
const TILE_SIZE = (BOARD_SIZE - BOARD_PAD * 2 - TILE_GAP * (BOARD - 1)) / BOARD;

const TILE_COLORS = {
  2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563',
  32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61',
  512: '#edc850', 1024: '#edc53f', 2048: '#edc22e',
};

const TILE_TEXT = {
  2: '#776e65', 4: '#776e65', 8: '#f9f6f2', 16: '#f9f6f2',
  32: '#f9f6f2', 64: '#f9f6f2', 128: '#f9f6f2', 256: '#f9f6f2',
  512: '#f9f6f2', 1024: '#f9f6f2', 2048: '#f9f6f2',
};

function emptyGrid() {
  return Array.from({ length: BOARD }, () => Array(BOARD).fill(0));
}

function addRandom(grid) {
  const empty = [];
  for (let r = 0; r < BOARD; r++)
    for (let c = 0; c < BOARD; c++)
      if (grid[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map(row => [...row]);
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
}

function slideRow(row) {
  let arr = row.filter(v => v !== 0);
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      arr[i + 1] = 0;
    }
  }
  arr = arr.filter(v => v !== 0);
  while (arr.length < BOARD) arr.push(0);
  return arr;
}

function moveGrid(grid, dir) {
  let newGrid = grid.map(row => [...row]);
  let moved = false;

  if (dir === 'left') {
    for (let r = 0; r < BOARD; r++) {
      const row = slideRow(newGrid[r]);
      if (row.some((v, i) => v !== newGrid[r][i])) moved = true;
      newGrid[r] = row;
    }
  } else if (dir === 'right') {
    for (let r = 0; r < BOARD; r++) {
      const row = slideRow([...newGrid[r]].reverse()).reverse();
      if (row.some((v, i) => v !== newGrid[r][i])) moved = true;
      newGrid[r] = row;
    }
  } else if (dir === 'up') {
    for (let c = 0; c < BOARD; c++) {
      const col = newGrid.map(row => row[c]);
      const row = slideRow(col);
      if (row.some((v, i) => v !== newGrid[i][c])) moved = true;
      for (let r = 0; r < BOARD; r++) newGrid[r][c] = row[r];
    }
  } else if (dir === 'down') {
    for (let c = 0; c < BOARD; c++) {
      const col = newGrid.map(row => row[c]).reverse();
      const row = slideRow(col).reverse();
      if (row.some((v, i) => v !== newGrid[i][c])) moved = true;
      for (let r = 0; r < BOARD; r++) newGrid[r][c] = row[r];
    }
  }

  return { grid: newGrid, moved };
}

function canMove(grid) {
  for (let r = 0; r < BOARD; r++)
    for (let c = 0; c < BOARD; c++) {
      if (grid[r][c] === 0) return true;
      if (c < BOARD - 1 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < BOARD - 1 && grid[r][c] === grid[r + 1][c]) return true;
    }
  return false;
}

function getMaxTile(grid) {
  let max = 0;
  for (let r = 0; r < BOARD; r++)
    for (let c = 0; c < BOARD; c++)
      if (grid[r][c] > max) max = grid[r][c];
  return max;
}

function getScore(grid) {
  let sum = 0;
  for (let r = 0; r < BOARD; r++)
    for (let c = 0; c < BOARD; c++)
      sum += grid[r][c];
  return sum;
}

export default function Game2048({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  // phase: 'idle' | 'playing' | 'paused' | 'gameover'
  const [phase, setPhase] = useState('idle');
  const [grid, setGrid] = useState(emptyGrid());
  const [score, setScore] = useState(0);
  const [maxTile, setMaxTile] = useState(0);
  const gridRef = useRef(emptyGrid());
  const phaseRef = useRef('idle');

  const updatePhase = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const initGame = () => {
    let g = emptyGrid();
    g = addRandom(g);
    g = addRandom(g);
    gridRef.current = g;
    setGrid(g);
    setScore(getScore(g));
    setMaxTile(getMaxTile(g));
    updatePhase('playing');
    if (onLockSwipe) onLockSwipe();
  };

  const handlePause = () => {
    updatePhase('paused');
    if (onUnlockSwipe) onUnlockSwipe();
  };

  const handleResume = () => {
    updatePhase('playing');
    if (onLockSwipe) onLockSwipe();
  };

  const handleStop = () => {
    updatePhase('idle');
    if (onUnlockSwipe) onUnlockSwipe();
  };

  // Reset to idle when difficulty changes (swiped to this game again)
  useEffect(() => {
    gridRef.current = emptyGrid();
    setGrid(emptyGrid());
    setScore(0);
    setMaxTile(0);
    updatePhase('idle');
  }, [difficulty]);

  // Cleanup: unlock on unmount
  useEffect(() => {
    return () => { if (onUnlockSwipe) onUnlockSwipe(); };
  }, []);

  const handleMove = useCallback((dir) => {
    if (phaseRef.current !== 'playing') return;
    const currentGrid = gridRef.current;
    const { grid: newGrid, moved } = moveGrid(currentGrid, dir);
    if (!moved) return;
    playTap();
    const withNew = addRandom(newGrid);
    gridRef.current = withNew;
    setGrid(withNew);
    setScore(getScore(withNew));
    setMaxTile(getMaxTile(withNew));

    if (getMaxTile(withNew) >= 2048) {
      updatePhase('gameover');
      if (onUnlockSwipe) onUnlockSwipe();
      onCorrect();
      return;
    }
    if (!canMove(withNew)) {
      updatePhase('gameover');
      if (onUnlockSwipe) onUnlockSwipe();
      onWrong();
    }
  }, [onCorrect, onWrong, onUnlockSwipe]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
      onPanResponderRelease: (_, gs) => {
        const { dx, dy } = gs;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (Math.max(absDx, absDy) < 20) return;
        if (absDx > absDy) {
          handleMove(dx > 0 ? 'right' : 'left');
        } else {
          handleMove(dy > 0 ? 'down' : 'up');
        }
      },
    })
  ).current;

  // Idle screen - start button
  if (phase === 'idle') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>2048</Text>
        <Text style={styles.desc}>Aynı sayıları birleştirerek 2048'e ulaş!</Text>
        <View style={styles.previewBoard}>
          {[2, 4, 8, 16, 32, 64, 128, 256].map((val, i) => (
            <View key={i} style={[styles.previewTile, { backgroundColor: TILE_COLORS[val] }]}>
              <Text style={[styles.previewTileText, { color: TILE_TEXT[val] }]}>{val}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.startBtn} onPress={initGame}>
          <Text style={styles.startBtnText}>Başla</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Oyun başlayınca kaydırma kilitlenir</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titleSmall}>2048</Text>
          <Text style={styles.scoreText}>Skor: {score}</Text>
        </View>
        {phase === 'playing' && (
          <TouchableOpacity style={styles.pauseBtn} onPress={handlePause}>
            <Text style={styles.pauseBtnText}>Durdur</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Board */}
      <View style={styles.board} {...(phase === 'playing' ? panResponder.panHandlers : {})}>
        {grid.map((row, r) =>
          row.map((val, c) => (
            <View
              key={`${r}-${c}`}
              style={[
                styles.tile,
                {
                  top: BOARD_PAD + r * (TILE_SIZE + TILE_GAP),
                  left: BOARD_PAD + c * (TILE_SIZE + TILE_GAP),
                  backgroundColor: val ? (TILE_COLORS[val] || '#3c3a32') : 'rgba(255,255,255,0.05)',
                },
              ]}
            >
              {val > 0 && (
                <Text style={[styles.tileText, { color: TILE_TEXT[val] || '#f9f6f2', fontSize: val >= 1024 ? 18 : val >= 128 ? 22 : 28 }]}>
                  {val}
                </Text>
              )}
            </View>
          ))
        )}

        {/* Pause overlay */}
        {phase === 'paused' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Duraklatıldı</Text>
            <TouchableOpacity style={styles.resumeBtn} onPress={handleResume}>
              <Text style={styles.resumeBtnText}>Devam Et</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quitBtn} onPress={handleStop}>
              <Text style={styles.quitBtnText}>Çık</Text>
            </TouchableOpacity>
            <Text style={styles.pauseHint}>Veya kaydırarak başka oyuna geç</Text>
          </View>
        )}

        {/* Game over overlay */}
        {phase === 'gameover' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>{maxTile >= 2048 ? 'Kazandın!' : 'Oyun Bitti'}</Text>
            <Text style={styles.overlayScore}>En yüksek: {maxTile}</Text>
            <TouchableOpacity style={styles.resumeBtn} onPress={initGame}>
              <Text style={styles.resumeBtnText}>Tekrar Oyna</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quitBtn} onPress={handleStop}>
              <Text style={styles.quitBtnText}>Çık</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 20, margin: 10, backgroundColor: COLORS.surface },

  // Idle screen
  title: { color: COLORS.text, fontSize: 48, fontWeight: '900', marginBottom: 8 },
  desc: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  previewBoard: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 28, maxWidth: 200 },
  previewTile: { width: 44, height: 44, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  previewTileText: { fontWeight: '800', fontSize: 14 },
  startBtn: { backgroundColor: '#edc22e', paddingHorizontal: 48, paddingVertical: 16, borderRadius: 14 },
  startBtnText: { color: '#776e65', fontSize: 22, fontWeight: '900' },
  hint: { color: COLORS.textMuted, fontSize: 12, marginTop: 16 },

  // Playing screen
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: BOARD_SIZE, marginBottom: 12 },
  titleSmall: { color: COLORS.text, fontSize: 28, fontWeight: '900' },
  scoreText: { color: COLORS.textSecondary, fontSize: 13 },
  pauseBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  pauseBtnText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },

  // Board
  board: { width: BOARD_SIZE, height: BOARD_SIZE, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, position: 'relative' },
  tile: { position: 'absolute', width: TILE_SIZE, height: TILE_SIZE, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  tileText: { fontWeight: '800' },

  // Overlays
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, zIndex: 10 },
  overlayTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  overlayScore: { color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 20 },
  resumeBtn: { backgroundColor: '#edc22e', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10, marginTop: 14 },
  resumeBtnText: { color: '#776e65', fontSize: 16, fontWeight: '700' },
  quitBtn: { paddingHorizontal: 32, paddingVertical: 10, marginTop: 10 },
  quitBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600' },
  pauseHint: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 16 },
});
