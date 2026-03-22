import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

// W=wall, .=floor, B=box, T=target, P=player, *=box on target, +=player on target
const LEVELS = [
  // Easy
  [
    'WWWWWW',
    'W....W',
    'W.BT.W',
    'W.P..W',
    'W....W',
    'WWWWWW',
  ],
  [
    'WWWWWWW',
    'W.....W',
    'W.BTB.W',
    'W..P..W',
    'W..T..W',
    'W.....W',
    'WWWWWWW',
  ],
  // Medium
  [
    'WWWWWWW',
    'W.....W',
    'W.BBB.W',
    'W.....W',
    'W.TTT.W',
    'W.....W',
    'W..P..W',
    'WWWWWWW',
  ],
  [
    'WWWWWWWW',
    'W......W',
    'W.WBTW.W',
    'W.B..B.W',
    'W.TP.T.W',
    'W......W',
    'WWWWWWWW',
  ],
  // Hard
  [
    'WWWWWWWW',
    'W....T.W',
    'W.WW.W.W',
    'W.B..B.W',
    'W.TWWT.W',
    'W..BP..W',
    'W......W',
    'WWWWWWWW',
  ],
];

const DIFFICULTY_CONFIG = {
  0: { levels: [0, 1] },
  1: { levels: [2, 3] },
  2: { levels: [3, 4] },
};

function parseLevel(lvl) {
  const grid = [];
  let player = { r: 0, c: 0 };
  const boxes = [];
  const targets = [];
  for (let r = 0; r < lvl.length; r++) {
    const row = [];
    for (let c = 0; c < lvl[r].length; c++) {
      const ch = lvl[r][c];
      if (ch === 'W') row.push('wall');
      else row.push('floor');
      if (ch === 'P' || ch === '+') player = { r, c };
      if (ch === 'B' || ch === '*') boxes.push({ r, c });
      if (ch === 'T' || ch === '*' || ch === '+') targets.push({ r, c });
    }
    grid.push(row);
  }
  return { grid, player, boxes, targets };
}

export default function SokobanPuzzle({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [levelIdx, setLevelIdx] = useState(0);
  const [state, setState] = useState(null);
  const [moves, setMoves] = useState(0);

  const loadLevel = (idx) => {
    const actualIdx = config.levels[idx] || config.levels[0];
    const parsed = parseLevel(LEVELS[actualIdx]);
    setState(parsed);
    setMoves(0);
    setLevelIdx(idx);
  };

  useEffect(() => { loadLevel(0); }, [difficulty]);

  const checkWin = (boxes, targets) => {
    return targets.every(t => boxes.some(b => b.r === t.r && b.c === t.c));
  };

  const move = (dr, dc) => {
    if (!state) return;
    playTap();
    const { grid, player, boxes, targets } = state;
    const nr = player.r + dr;
    const nc = player.c + dc;

    if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) return;
    if (grid[nr][nc] === 'wall') return;

    const boxIdx = boxes.findIndex(b => b.r === nr && b.c === nc);
    if (boxIdx >= 0) {
      const bnr = nr + dr;
      const bnc = nc + dc;
      if (bnr < 0 || bnr >= grid.length || bnc < 0 || bnc >= grid[0].length) return;
      if (grid[bnr][bnc] === 'wall') return;
      if (boxes.some(b => b.r === bnr && b.c === bnc)) return;

      const newBoxes = boxes.map((b, i) => i === boxIdx ? { r: bnr, c: bnc } : b);
      const newState = { grid, player: { r: nr, c: nc }, boxes: newBoxes, targets };
      setState(newState);
      setMoves(m => m + 1);

      if (checkWin(newBoxes, targets)) {
        if (levelIdx < config.levels.length - 1) {
          setTimeout(() => loadLevel(levelIdx + 1), 600);
        } else {
          onCorrect();
        }
      }
    } else {
      setState({ grid, player: { r: nr, c: nc }, boxes, targets });
      setMoves(m => m + 1);
    }
  };

  if (!state) return null;

  const { grid, player, boxes, targets } = state;
  const rows = grid.length;
  const cols = grid[0].length;
  const cellSize = Math.floor(Math.min((SW - 60) / cols, 280 / rows));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sokoban</Text>
      <Text style={styles.sub}>Seviye {levelIdx + 1} / {config.levels.length} | Hamle: {moves}</Text>

      <View style={[styles.board, { width: cols * cellSize, height: rows * cellSize }]}>
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isTarget = targets.some(t => t.r === r && t.c === c);
            const isBox = boxes.some(b => b.r === r && b.c === c);
            const isPlayer = player.r === r && player.c === c;
            const boxOnTarget = isBox && isTarget;
            return (
              <View key={`${r}-${c}`} style={[
                styles.cell,
                { width: cellSize, height: cellSize, top: r * cellSize, left: c * cellSize },
                cell === 'wall' && styles.wall,
              ]}>
                {isTarget && !isBox && <View style={styles.target} />}
                {isBox && <View style={[styles.box, boxOnTarget && styles.boxDone]} />}
                {isPlayer && <View style={styles.player} />}
              </View>
            );
          })
        )}
      </View>

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.dpad} onPress={() => move(-1, 0)}>
            <Text style={styles.dpadText}>▲</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.dpad} onPress={() => move(0, -1)}>
            <Text style={styles.dpadText}>◀</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dpadCenter} onPress={() => loadLevel(levelIdx)}>
            <Text style={styles.dpadTextSmall}>↺</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dpad} onPress={() => move(0, 1)}>
            <Text style={styles.dpadText}>▶</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.dpad} onPress={() => move(1, 0)}>
            <Text style={styles.dpadText}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 20, margin: 10, backgroundColor: COLORS.surface },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '900', marginBottom: 2 },
  sub: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 10 },
  board: { backgroundColor: '#1a1a2e', borderRadius: 10, position: 'relative', overflow: 'hidden' },
  cell: { position: 'absolute', justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.03)' },
  wall: { backgroundColor: '#3d3d5c' },
  target: { width: '40%', height: '40%', borderRadius: 100, backgroundColor: 'rgba(239,68,68,0.4)', borderWidth: 2, borderColor: '#ef4444' },
  box: { width: '70%', height: '70%', borderRadius: 4, backgroundColor: '#f59e0b' },
  boxDone: { backgroundColor: '#22c55e' },
  player: { width: '60%', height: '60%', borderRadius: 100, backgroundColor: '#3b82f6' },
  controls: { marginTop: 14, alignItems: 'center' },
  controlRow: { flexDirection: 'row', gap: 4 },
  dpad: { width: 52, height: 44, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  dpadCenter: { width: 52, height: 44, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  dpadText: { color: COLORS.text, fontSize: 20 },
  dpadTextSmall: { color: COLORS.textMuted, fontSize: 18 },
});
