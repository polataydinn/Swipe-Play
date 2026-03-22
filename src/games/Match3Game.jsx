import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');
const GEMS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '💣'];
const BOMB = 6;

// Fixed config (medium difficulty)
const CONFIG = { rows: 7, cols: 6, colors: 5, moves: 25, target: 50 };

function createBoard(rows, cols, colors) {
  let board;
  do {
    board = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.floor(Math.random() * colors))
    );
  } while (findMatches(board).length > 0);
  return board;
}

function findMatches(board) {
  const matches = new Set();
  const rows = board.length, cols = board[0].length;
  // Horizontal
  for (let r = 0; r < rows; r++) {
    let run = 1;
    for (let c = 1; c <= cols; c++) {
      if (c < cols && board[r][c] >= 0 && board[r][c] !== BOMB && board[r][c] === board[r][c-1] && board[r][c-1] !== BOMB) {
        run++;
      } else {
        if (run >= 3) {
          for (let k = c - run; k < c; k++) matches.add(`${r},${k}`);
        }
        run = 1;
      }
    }
  }
  // Vertical
  for (let c = 0; c < cols; c++) {
    let run = 1;
    for (let r = 1; r <= rows; r++) {
      if (r < rows && board[r][c] >= 0 && board[r][c] !== BOMB && board[r][c] === board[r-1][c] && board[r-1][c] !== BOMB) {
        run++;
      } else {
        if (run >= 3) {
          for (let k = r - run; k < r; k++) matches.add(`${k},${c}`);
        }
        run = 1;
      }
    }
  }
  return [...matches].map(s => { const [r, c] = s.split(',').map(Number); return { r, c }; });
}

// Expand matches: if bomb is in the match area, explode 3x3 around it
function expandWithBombs(board, matchSet) {
  const expanded = new Set(matchSet.map(m => `${m.r},${m.c}`));
  const rows = board.length, cols = board[0].length;
  let changed = true;
  while (changed) {
    changed = false;
    for (const key of [...expanded]) {
      const [r, c] = key.split(',').map(Number);
      if (board[r][c] === BOMB) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !expanded.has(`${nr},${nc}`)) {
              expanded.add(`${nr},${nc}`);
              changed = true;
            }
          }
        }
      }
    }
  }
  return [...expanded].map(s => { const [r, c] = s.split(',').map(Number); return { r, c }; });
}

function removeAndDrop(board, matches, colors) {
  const rows = board.length, cols = board[0].length;
  const nb = board.map(r => [...r]);
  // Track if any match had 4+ in a row to spawn bomb
  for (const { r, c } of matches) nb[r][c] = -1;
  // Drop
  for (let c = 0; c < cols; c++) {
    let write = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      if (nb[r][c] >= 0) {
        nb[write][c] = nb[r][c];
        if (write !== r) nb[r][c] = -1;
        write--;
      }
    }
    for (let r = write; r >= 0; r--) {
      nb[r][c] = Math.floor(Math.random() * colors);
    }
  }
  return nb;
}

function countMaxRun(board, matches) {
  // Find max run length in the match set
  if (matches.length >= 5) return 5;
  if (matches.length >= 4) return 4;
  return 3;
}

function swapCells(board, r1, c1, r2, c2) {
  const nb = board.map(r => [...r]);
  [nb[r1][c1], nb[r2][c2]] = [nb[r2][c2], nb[r1][c1]];
  return nb;
}

export default function Match3Game({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const [phase, setPhase] = useState('idle');
  const [board, setBoard] = useState(() => createBoard(CONFIG.rows, CONFIG.cols, CONFIG.colors));
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(CONFIG.moves);
  const [clearing, setClearing] = useState(new Set());
  const [swapping, setSwapping] = useState(null); // { from, to }
  const clearAnim = useRef(new Animated.Value(1)).current;
  // Swap anims: from cell moves toward to, to cell moves toward from
  const swapFromX = useRef(new Animated.Value(0)).current;
  const swapFromY = useRef(new Animated.Value(0)).current;
  const swapToX = useRef(new Animated.Value(0)).current;
  const swapToY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => { if (onUnlockSwipe) onUnlockSwipe(); };
  }, []);

  const resetBoard = useCallback(() => {
    setBoard(createBoard(CONFIG.rows, CONFIG.cols, CONFIG.colors));
    setSelected(null);
    setScore(0);
    setMovesLeft(CONFIG.moves);
    setClearing(new Set());
    setSwapping(null);
    clearAnim.setValue(1);
  }, []);

  const handleStart = () => { resetBoard(); setPhase('playing'); if (onLockSwipe) onLockSwipe(); };
  const handleStop = () => { setPhase('idle'); setSelected(null); if (onUnlockSwipe) onUnlockSwipe(); };
  const handlePlayAgain = () => { resetBoard(); setPhase('playing'); if (onLockSwipe) onLockSwipe(); };

  const animateClear = (matchSet, afterClear) => {
    setClearing(matchSet);
    clearAnim.setValue(1);
    Animated.timing(clearAnim, { toValue: 0, duration: 280, useNativeDriver: false }).start(() => {
      setClearing(new Set());
      clearAnim.setValue(1);
      afterClear();
    });
  };

  const processBoard = (b, currentScore, currentMoves) => {
    let matches = findMatches(b);
    if (matches.length === 0) {
      setBoard(b);
      if (currentMoves <= 0 && currentScore < CONFIG.target) {
        setPhase('lost');
        if (onUnlockSwipe) onUnlockSwipe();
        onWrong();
      }
      return;
    }

    const maxRun = countMaxRun(b, matches);
    // Expand for bombs
    const expandedMatches = expandWithBombs(b, matches);
    const matchSet = new Set(expandedMatches.map(m => `${m.r},${m.c}`));

    setBoard(b);
    animateClear(matchSet, () => {
      let newBoard = removeAndDrop(b, expandedMatches, CONFIG.colors);
      const totalCleared = expandedMatches.length;
      const newScore = currentScore + totalCleared;
      setScore(newScore);

      // Spawn bomb if 4+ match
      if (maxRun >= 4 && Math.random() < 0.6) {
        const bombPos = matches[Math.floor(matches.length / 2)];
        if (newBoard[bombPos.r][bombPos.c] >= 0 && newBoard[bombPos.r][bombPos.c] !== BOMB) {
          newBoard = newBoard.map(r => [...r]);
          newBoard[bombPos.r][bombPos.c] = BOMB;
        }
      }

      if (newScore >= CONFIG.target) {
        setBoard(newBoard);
        setPhase('won');
        if (onUnlockSwipe) onUnlockSwipe();
        onCorrect();
        return;
      }

      const nextMatches = findMatches(newBoard);
      if (nextMatches.length > 0) {
        processBoard(newBoard, newScore, currentMoves);
      } else {
        setBoard(newBoard);
        if (currentMoves <= 0 && newScore < CONFIG.target) {
          setPhase('lost');
          if (onUnlockSwipe) onUnlockSwipe();
          onWrong();
        }
      }
    });
  };

  const cellSize = Math.floor(Math.min((SW - 50) / CONFIG.cols, 48));

  const doSwapAnimation = (r1, c1, r2, c2, onDone) => {
    const dx = (c2 - c1) * (cellSize + 4);
    const dy = (r2 - r1) * (cellSize + 4);
    swapFromX.setValue(0); swapFromY.setValue(0);
    swapToX.setValue(0); swapToY.setValue(0);
    setSwapping({ from: { r: r1, c: c1 }, to: { r: r2, c: c2 } });
    Animated.parallel([
      Animated.timing(swapFromX, { toValue: dx, duration: 140, useNativeDriver: true }),
      Animated.timing(swapFromY, { toValue: dy, duration: 140, useNativeDriver: true }),
      Animated.timing(swapToX, { toValue: -dx, duration: 140, useNativeDriver: true }),
      Animated.timing(swapToY, { toValue: -dy, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setSwapping(null);
      swapFromX.setValue(0); swapFromY.setValue(0);
      swapToX.setValue(0); swapToY.setValue(0);
      onDone();
    });
  };

  const handleTap = (r, c) => {
    if (phase !== 'playing' || swapping) return;
    playTap();

    if (selected === null) {
      setSelected({ r, c });
      return;
    }

    const dr = Math.abs(selected.r - r);
    const dc = Math.abs(selected.c - c);

    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      const { r: r1, c: c1 } = selected;
      setSelected(null);

      doSwapAnimation(r1, c1, r, c, () => {
        const swapped = swapCells(board, r1, c1, r, c);
        const matches = findMatches(swapped);
        if (matches.length > 0) {
          const newMoves = movesLeft - 1;
          setMovesLeft(newMoves);
          processBoard(swapped, score, newMoves);
        } else {
          setBoard(board); // no match, revert (already shown via state)
        }
      });
    } else {
      setSelected({ r, c });
    }
  };

  const isActive = phase === 'playing';
  const isEnded = phase === 'won' || phase === 'lost';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Match 3</Text>

      {isActive && (
        <TouchableOpacity style={styles.stopBtn} onPress={handleStop} activeOpacity={0.7}>
          <Text style={styles.stopBtnText}>Durdur</Text>
        </TouchableOpacity>
      )}

      <View style={styles.info}>
        <Text style={styles.infoText}>Skor: {score}/{CONFIG.target}</Text>
        <Text style={styles.infoText}>Hamle: {movesLeft}</Text>
      </View>

      <View style={[styles.board, { width: CONFIG.cols * (cellSize + 4), opacity: phase === 'idle' ? 0.5 : 1 }]}>
        {board.map((row, r) =>
          row.map((val, c) => {
            const isSel = selected && selected.r === r && selected.c === c;
            const isClearing = clearing.has(`${r},${c}`);
            const isSwapFrom = swapping && swapping.from.r === r && swapping.from.c === c;
            const isSwapTo = swapping && swapping.to.r === r && swapping.to.c === c;

            const animStyle = isClearing
              ? { opacity: clearAnim, transform: [{ scale: clearAnim }] }
              : isSwapFrom
              ? { transform: [{ translateX: swapFromX }, { translateY: swapFromY }] }
              : isSwapTo
              ? { transform: [{ translateX: swapToX }, { translateY: swapToY }] }
              : {};

            const Wrapper = (isClearing || isSwapFrom || isSwapTo) ? Animated.View : View;

            return (
              <TouchableOpacity
                key={`${r}-${c}`}
                style={[styles.cell, { width: cellSize, height: cellSize }, isSel && styles.cellSelected, val === BOMB && styles.cellBomb]}
                onPress={() => handleTap(r, c)}
                disabled={!isActive}
                activeOpacity={isActive ? 0.6 : 1}
              >
                <Wrapper style={animStyle}>
                  <Text style={{ fontSize: cellSize * 0.55 }}>{val >= 0 ? GEMS[val] : ''}</Text>
                </Wrapper>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {phase === 'idle' && (
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.7}>
          <Text style={styles.startBtnText}>Başla</Text>
        </TouchableOpacity>
      )}

      {isEnded && (
        <View style={styles.endOverlay}>
          <Text style={styles.endText}>
            {phase === 'won' ? 'Harika! Kazandın!' : 'Hamle bitti!'}
          </Text>
          <TouchableOpacity style={styles.restartBtn} onPress={handlePlayAgain}>
            <Text style={styles.restartBtnText}>Tekrar Oyna</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'idle' && (
        <Text style={styles.hintText}>💣 4'lü eşleşme = Bomba!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 10, borderRadius: 20, margin: 10, backgroundColor: COLORS.surface,
  },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '900', marginBottom: 4 },
  stopBtn: { backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 6, borderRadius: 8, marginBottom: 6 },
  stopBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  info: { flexDirection: 'row', gap: 20, marginBottom: 10 },
  infoText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  board: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  cell: {
    backgroundColor: '#1a1a2e', borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.05)',
  },
  cellSelected: { borderColor: '#facc15', backgroundColor: '#1e2a40' },
  cellBomb: { borderColor: '#ef4444', backgroundColor: '#2a1020' },
  startBtn: { marginTop: 16, backgroundColor: '#8b5cf6', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  endOverlay: { marginTop: 14, alignItems: 'center' },
  endText: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginBottom: 10 },
  restartBtn: { backgroundColor: '#8b5cf6', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  restartBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  hintText: { color: COLORS.textMuted, fontSize: 12, marginTop: 10 },
});
