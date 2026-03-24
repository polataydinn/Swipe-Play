import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, TouchableOpacity, Text, StyleSheet,
  Dimensions, Image, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

// ── Assets ───────────────────────────────────────────────────────────────────
const MONSTERS = [
  require('../assets/petparty/monster0.png'),
  require('../assets/petparty/monster1.png'),
  require('../assets/petparty/monster2.png'),
  require('../assets/petparty/monster3.png'),
  require('../assets/petparty/monster4.png'),
  require('../assets/petparty/monster5.png'),
];
const BG_IMG  = require('../assets/petparty/bg.jpg');
const LVL_BG  = require('../assets/petparty/level_bg.png');

// ── Layout constants ─────────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 16, 380);
const GAME_H = Math.min(SH * 0.68, 520);

const COLS      = 7;
const ROWS      = 7;
const PET_TYPES = 6;
const CELL      = Math.floor(GAME_W / COLS);   // ≈ 54 px

// ── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'petparty_progress';

// ── Level definitions ────────────────────────────────────────────────────────
const LEVELS = [
  { target:  800,  moves: 25 },
  { target: 1200,  moves: 22 },
  { target: 1600,  moves: 22 },
  { target: 2000,  moves: 20 },
  { target: 2500,  moves: 18 },
  { target: 3000,  moves: 18 },
  { target: 3800,  moves: 16 },
  { target: 4500,  moves: 15 },
  { target: 5500,  moves: 15 },
  { target: 6500,  moves: 12 },
  { target: 7500,  moves: 12 },
  { target: 9000,  moves: 10 },
  { target: 10500, moves: 10 },
  { target: 12000, moves:  8 },
  { target: 15000, moves:  8 },
];

// ── Grid helpers ─────────────────────────────────────────────────────────────
function createGrid() {
  const g = new Array(COLS * ROWS);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      let v;
      do {
        v = Math.floor(Math.random() * PET_TYPES);
      } while (
        (c >= 2 && g[i - 1] === v && g[i - 2] === v) ||
        (r >= 2 && g[i - COLS] === v && g[i - 2 * COLS] === v)
      );
      g[i] = v;
    }
  }
  return g;
}

function findMatches(g) {
  const m = new Set();
  // horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 3; c++) {
      const v = g[r * COLS + c];
      if (v < 0) continue;
      if (g[r * COLS + c + 1] === v && g[r * COLS + c + 2] === v) {
        let e = c + 2;
        while (e + 1 < COLS && g[r * COLS + e + 1] === v) e++;
        for (let i = c; i <= e; i++) m.add(r * COLS + i);
        c = e;
      }
    }
  }
  // vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 3; r++) {
      const v = g[r * COLS + c];
      if (v < 0) continue;
      if (g[(r + 1) * COLS + c] === v && g[(r + 2) * COLS + c] === v) {
        let e = r + 2;
        while (e + 1 < ROWS && g[(e + 1) * COLS + c] === v) e++;
        for (let i = r; i <= e; i++) m.add(i * COLS + c);
        r = e;
      }
    }
  }
  return m;
}

function removeAndDrop(g, matched) {
  const ng = [...g];
  for (const i of matched) ng[i] = -1;
  // compact each column downward, refill from top
  for (let c = 0; c < COLS; c++) {
    let w = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (ng[r * COLS + c] >= 0) {
        ng[w * COLS + c] = ng[r * COLS + c];
        if (w !== r) ng[r * COLS + c] = -1;
        w--;
      }
    }
    for (let r = w; r >= 0; r--) {
      ng[r * COLS + c] = Math.floor(Math.random() * PET_TYPES);
    }
  }
  return ng;
}

function scoreForMatch(size, cascade) {
  const base = size >= 5 ? size * 150 : size === 4 ? size * 100 : size * 50;
  return Math.floor(base * (1 + cascade * 0.5));
}

function calcStars(score, target) {
  if (score >= target * 1.5) return 3;
  if (score >= target * 1.1) return 2;
  return 1;
}

function maxUnlockedLevel(prog) {
  let max = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (prog.completed?.[i]) max = i + 1;
  }
  return Math.min(max, LEVELS.length - 1);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PetPartyGame({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  // Persistence state
  const [progress, setProgress] = useState({ completed: {}, stars: {} });

  // Screen state: 'levelSelect' | 'playing'
  const [screen, setScreen]     = useState('levelSelect');
  const [levelIdx, setLevelIdx] = useState(0);

  // Game state (render)
  const [grid, setGrid]             = useState([]);
  const [selected, setSelected]     = useState(null);
  const [matchedSet, setMatchedSet] = useState(new Set());
  const [score, setScore]           = useState(0);
  const [movesLeft, setMovesLeft]   = useState(0);
  const [gamePhase, setGamePhase]   = useState('idle'); // 'idle'|'animating'|'won'|'lost'

  // Refs — always-current values used inside async callbacks / memoized fns
  const gridRef      = useRef([]);
  const scoreRef     = useRef(0);
  const movesRef     = useRef(0);
  const selectedRef  = useRef(null);   // mirrors `selected` state
  const phaseRef     = useRef('idle'); // mirrors `gamePhase` state
  const animating    = useRef(false);
  const mounted      = useRef(true);
  const levelIdxRef  = useRef(0);
  const progressRef  = useRef({ completed: {}, stars: {} });

  // Keep refs in sync with state setters
  const setSelectedSync = (v) => { selectedRef.current = v; setSelected(v); };
  const setPhaseSync    = (v) => { phaseRef.current    = v; setGamePhase(v); };

  useEffect(() => {
    loadProgress();
    return () => { mounted.current = false; };
  }, []);

  // ── Storage ────────────────────────────────────────────────────────────────
  const loadProgress = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        progressRef.current = p;
        setProgress(p);
      }
    } catch (_) {}
  };

  const saveProgress = async (p) => {
    try {
      progressRef.current = p;
      setProgress(p);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch (_) {}
  };

  // ── Level start ────────────────────────────────────────────────────────────
  const startLevel = useCallback((idx) => {
    const cfg = LEVELS[idx];
    const g   = createGrid();

    levelIdxRef.current = idx;
    setLevelIdx(idx);

    gridRef.current    = g;
    scoreRef.current   = 0;
    movesRef.current   = cfg.moves;
    animating.current  = false;

    setGrid([...g]);
    setScore(0);
    setMovesLeft(cfg.moves);
    setSelectedSync(null);
    setMatchedSet(new Set());
    setPhaseSync('idle');
    setScreen('playing');

    if (onLockSwipe) onLockSwipe();
  }, []);

  const backToSelect = useCallback(() => {
    setScreen('levelSelect');
    if (onUnlockSwipe) onUnlockSwipe();
  }, []);

  // ── Win / Lose logic ───────────────────────────────────────────────────────
  const finishGame = useCallback((won) => {
    const idx = levelIdxRef.current;
    const cfg = LEVELS[idx];
    if (won) {
      const stars = calcStars(scoreRef.current, cfg.target);
      const prev  = progressRef.current;
      const newP  = {
        completed: { ...prev.completed, [idx]: true },
        stars:     { ...prev.stars, [idx]: Math.max(stars, prev.stars?.[idx] || 0) },
      };
      saveProgress(newP);
      setPhaseSync('won');
      playCorrect();
      onCorrect();
    } else {
      setPhaseSync('lost');
      playWrong();
      onWrong();
    }
  }, []);

  // ── Cascade processing ─────────────────────────────────────────────────────
  const runCascade = useCallback((g, cascade, matched) => {
    animating.current = true;
    setPhaseSync('animating');
    setMatchedSet(new Set(matched));

    setTimeout(() => {
      if (!mounted.current) return;

      // Score this round of matches
      scoreRef.current += scoreForMatch(matched.size, cascade);
      setScore(scoreRef.current);

      const ng = removeAndDrop(g, matched);
      gridRef.current = ng;
      setGrid([...ng]);
      setMatchedSet(new Set());

      setTimeout(() => {
        if (!mounted.current) return;
        const next = findMatches(ng);
        if (next.size > 0) {
          runCascade(ng, cascade + 1, next);
        } else {
          animating.current = false;
          setPhaseSync('idle');

          const cfg = LEVELS[levelIdxRef.current];
          if (scoreRef.current >= cfg.target) {
            finishGame(true);
          } else if (movesRef.current <= 0) {
            finishGame(false);
          }
        }
      }, 160);
    }, 230);
  }, [finishGame]);

  // ── Cell tap — uses only refs so no stale-closure issues ──────────────────
  const handleCellTap = useCallback((idx) => {
    if (animating.current) return;
    const phase = phaseRef.current;
    if (phase === 'won' || phase === 'lost' || phase === 'animating') return;

    const curSel = selectedRef.current;

    if (curSel === null) {
      setSelectedSync(idx);
      return;
    }
    if (curSel === idx) {
      setSelectedSync(null);
      return;
    }

    // Adjacency check
    const r1 = Math.floor(curSel / COLS), c1 = curSel % COLS;
    const r2 = Math.floor(idx    / COLS), c2 = idx    % COLS;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) {
      setSelectedSync(idx);   // select new cell instead
      return;
    }

    setSelectedSync(null);

    // Try swap
    const ng = [...gridRef.current];
    [ng[curSel], ng[idx]] = [ng[idx], ng[curSel]];
    const matches = findMatches(ng);

    if (matches.size === 0) return; // no match — reject silently

    // Valid swap
    playTap();
    movesRef.current--;
    setMovesLeft(movesRef.current);
    gridRef.current = ng;
    setGrid([...ng]);
    runCascade(ng, 0, matches);
  }, [runCascade]); // runCascade is stable (deps=[finishGame] which has deps=[])

  // ── Level select screen ────────────────────────────────────────────────────
  if (screen === 'levelSelect') {
    const maxUnlocked = maxUnlockedLevel(progress);
    return (
      <View style={styles.root}>
        <Image source={LVL_BG} style={styles.lvlBg} />
        <Text style={styles.title}>🐾 Pet Party</Text>
        <ScrollView
          style={styles.lvlScroll}
          contentContainerStyle={styles.lvlGrid}
          showsVerticalScrollIndicator={false}
        >
          {LEVELS.map((lvl, i) => {
            const locked    = i > maxUnlocked;
            const completed = !!progress.completed?.[i];
            const stars     = progress.stars?.[i] || 0;
            const isCurrent = i === maxUnlocked && !completed;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.lvlBtn,
                  completed && styles.lvlBtnDone,
                  isCurrent && styles.lvlBtnCurrent,
                  locked && styles.lvlBtnLocked,
                ]}
                onPress={() => !locked && startLevel(i)}
                disabled={locked}
                activeOpacity={locked ? 1 : 0.75}
              >
                <Text style={[styles.lvlNum, locked && { opacity: 0.4 }]}>{i + 1}</Text>
                {completed ? (
                  <Text style={styles.starsSmall}>
                    {Array.from({ length: 3 }).map((_, si) => si < stars ? '⭐' : '☆').join('')}
                  </Text>
                ) : locked ? (
                  <Text style={styles.lockIcon}>🔒</Text>
                ) : (
                  <Text style={styles.starsSmall}>▶</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ── Playing screen ─────────────────────────────────────────────────────────
  const cfg = LEVELS[levelIdx];
  const pct = Math.min(1, score / cfg.target);

  return (
    <View style={styles.root}>
      <Image source={BG_IMG} style={styles.gameBg} />

      {/* HUD */}
      <View style={styles.hud}>
        <TouchableOpacity onPress={backToSelect} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.hudLevel}>Bölüm {levelIdx + 1}</Text>
        <Text style={styles.hudMoves}>👆 {movesLeft}</Text>
      </View>

      {/* Score bar */}
      <View style={styles.scoreRow}>
        <Text style={styles.scoreTxt}>🍬 {score}</Text>
        <View style={styles.progBar}>
          <View style={[styles.progFill, { width: `${Math.floor(pct * 100)}%` }]} />
          {pct >= 1 && <View style={styles.progStar}><Text>⭐</Text></View>}
        </View>
        <Text style={styles.scoreTxt}>🎯 {cfg.target}</Text>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {grid.map((val, idx) => {
          const isSel     = selected === idx;
          const isMatched = matchedSet.has(idx);
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.cell,
                isSel     && styles.cellSel,
                isMatched && styles.cellMatched,
              ]}
              onPress={() => handleCellTap(idx)}
              activeOpacity={0.8}
            >
              {val >= 0 && (
                <View style={styles.petClip}>
                  <Image
                    source={MONSTERS[val]}
                    style={[styles.petImg, isMatched && { opacity: 0.25 }]}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Win overlay */}
      {gamePhase === 'won' && (
        <View style={styles.overlay}>
          <Text style={styles.ovTitle}>Tebrikler! 🎉</Text>
          <Text style={styles.ovScore}>{score} puan</Text>
          <Text style={styles.ovStars}>
            {Array.from({ length: 3 }).map((_, i) =>
              i < calcStars(score, cfg.target) ? '⭐' : '☆'
            ).join('  ')}
          </Text>
          <View style={styles.ovBtns}>
            {levelIdx + 1 < LEVELS.length && (
              <TouchableOpacity
                style={[styles.ovBtn, { backgroundColor: '#22c55e' }]}
                onPress={() => startLevel(levelIdx + 1)}
              >
                <Text style={styles.ovBtnTxt}>Sonraki ›</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.ovBtn, { backgroundColor: '#6366f1' }]}
              onPress={backToSelect}
            >
              <Text style={styles.ovBtnTxt}>Bölümler</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Lost overlay */}
      {gamePhase === 'lost' && (
        <View style={styles.overlay}>
          <Text style={styles.ovTitle}>Olmadı 😢</Text>
          <Text style={styles.ovScore}>{score} / {cfg.target}</Text>
          <View style={styles.ovBtns}>
            <TouchableOpacity
              style={[styles.ovBtn, { backgroundColor: '#f97316' }]}
              onPress={() => startLevel(levelIdx)}
            >
              <Text style={styles.ovBtnTxt}>Tekrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ovBtn, { backgroundColor: '#6366f1' }]}
              onPress={backToSelect}
            >
              <Text style={styles.ovBtnTxt}>Bölümler</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    margin: 8,
    overflow: 'hidden',
  },

  // ── Level select ──
  lvlBg: {
    position: 'absolute',
    top: 0, left: 0,
    width: GAME_W, height: GAME_H,
    resizeMode: 'cover',
    opacity: 0.35,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 8,
  },
  lvlScroll: { width: GAME_W, flex: 1 },
  lvlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 10,
  },
  lvlBtn: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: 'rgba(99,102,241,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lvlBtnDone: {
    backgroundColor: 'rgba(34,197,94,0.25)',
    borderColor: '#22c55e',
  },
  lvlBtnCurrent: {
    backgroundColor: 'rgba(249,115,22,0.3)',
    borderColor: '#f97316',
  },
  lvlBtnLocked: {
    backgroundColor: 'rgba(100,100,100,0.2)',
    borderColor: 'rgba(150,150,150,0.3)',
  },
  lvlNum:     { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  starsSmall: { fontSize: 9, marginTop: 2 },
  lockIcon:   { fontSize: 16 },

  // ── Game ──
  gameBg: {
    position: 'absolute',
    top: 0, left: 0,
    width: GAME_W, height: GAME_H,
    resizeMode: 'cover',
  },
  hud: {
    width: GAME_W,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 32, height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 8,
  },
  backTxt:   { color: '#fff', fontSize: 20, fontWeight: '900' },
  hudLevel:  { color: '#fff', fontSize: 15, fontWeight: '800' },
  hudMoves:  { color: '#facc15', fontSize: 15, fontWeight: '800' },

  scoreRow: {
    width: GAME_W,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
    marginBottom: 6,
  },
  scoreTxt: { color: '#fff', fontSize: 12, fontWeight: '700', minWidth: 50 },
  progBar: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 6,
  },
  progStar: {
    position: 'absolute',
    right: 2,
    top: -3,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: CELL * COLS,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  cell: {
    width: CELL,
    height: CELL,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cellSel: {
    backgroundColor: 'rgba(255,220,50,0.45)',
    borderColor: '#facc15',
    borderWidth: 2,
  },
  cellMatched: {
    backgroundColor: 'rgba(255,100,100,0.3)',
  },
  // Images are 160×80 (2 frames side by side) — clip to left frame only.
  // Absolute position centers the (CELL-6)×(CELL-6) clip inside the CELL×CELL cell.
  petClip: {
    position: 'absolute',
    top:      3,   // (CELL - (CELL-6)) / 2
    left:     3,
    width:    CELL - 6,
    height:   CELL - 6,
    overflow: 'hidden',
  },
  petImg: {
    width:  (CELL - 6) * 2,   // 2 frames wide, clipped to left frame by petClip
    height:  CELL - 6,
  },

  // ── Overlays ──
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    zIndex: 30,
  },
  ovTitle:   { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 6 },
  ovScore:   { color: 'rgba(255,255,255,0.85)', fontSize: 18, marginBottom: 8 },
  ovStars:   { fontSize: 24, marginBottom: 20 },
  ovBtns:    { flexDirection: 'row', gap: 12 },
  ovBtn:     { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24 },
  ovBtnTxt:  { color: '#fff', fontSize: 16, fontWeight: '800' },
});
