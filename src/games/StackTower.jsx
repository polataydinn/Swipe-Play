import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 16, 360);
const GAME_H = Math.min(SH * 0.68, 520);
const BLOCK_H = 30;
const BASE_Y = GAME_H - 50;

const BLOCK_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#06b6d4', '#f43f5e',
];

const DIFFICULTY_CONFIG = {
  0: { targetScore: 8,  platformSpeed: 2,   initialW: GAME_W * 0.6 },
  1: { targetScore: 10, platformSpeed: 3.5, initialW: GAME_W * 0.5 },
  2: { targetScore: 12, platformSpeed: 5,   initialW: GAME_W * 0.4 },
};

export default function StackTower({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const [phase, setPhase] = useState('ready');
  const [renderState, setRenderState] = useState(null);

  const stRef = useRef(null);
  const frameRef = useRef(null);
  const isMountedRef = useRef(true);

  const initState = () => {
    const baseW = config.initialW;
    const baseX = (GAME_W - baseW) / 2;
    return {
      phase: 'ready',
      score: 0,
      stack: [
        { x: baseX, w: baseW, y: BASE_Y, h: BLOCK_H, color: BLOCK_COLORS[0] },
      ],
      stackX: baseX,
      stackW: baseW,
      stackTop: BASE_Y, // y position of top of stack (decreases as we add)
      platW: baseW,
      cameraOffset: 0, // how far we've shifted blocks down (positive = blocks moved down)
      colorIndex: 1,
    };
  };

  useEffect(() => {
    stRef.current = initState();
    setRenderState(snapshotState(stRef.current));
    if (onLockSwipe) onLockSwipe();
    return () => {
      isMountedRef.current = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (onUnlockSwipe) onUnlockSwipe();
    };
  }, []);

  useEffect(() => {
    resetGame();
  }, [difficulty]);

  const snapshotState = (s) => ({
    phase: s.phase,
    score: s.score,
    stack: s.stack.map(b => ({ ...b })),
    stackX: s.stackX,
    stackW: s.stackW,
    stackTop: s.stackTop,
    platW: s.platW,
    cameraOffset: s.cameraOffset,
  });

  const resetGame = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    stRef.current = initState();
    setPhase('ready');
    setRenderState(snapshotState(stRef.current));
  };

  const startGame = () => {
    if (onLockSwipe) onLockSwipe();
    stRef.current.phase = 'play';
    setPhase('play');
    frameRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = () => {
    if (!isMountedRef.current) return;
    const s = stRef.current;
    if (s.phase !== 'play') return;

    // Platform oscillates using sin of current time
    const t = Date.now();
    const range = GAME_W / 2 - s.platW / 2 - 10;
    const platX = GAME_W / 2 + Math.sin(t * 0.001 * config.platformSpeed) * range - s.platW / 2;

    s.platX = platX;

    setRenderState({
      ...snapshotState(s),
      platX,
    });

    frameRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const handleTap = () => {
    if (phase === 'ready') { startGame(); return; }
    if (phase !== 'play') { resetGame(); return; }

    playTap();
    const s = stRef.current;
    const platX = s.platX;
    const platW = s.platW;

    // Calculate overlap with current stack top
    const stackX = s.stackX;
    const stackW = s.stackW;
    const stackRight = stackX + stackW;
    const platRight = platX + platW;

    const overlapLeft = Math.max(platX, stackX);
    const overlapRight = Math.min(platRight, stackRight);
    const overlap = overlapRight - overlapLeft;

    if (overlap <= 0) {
      // Complete miss
      s.phase = 'dead';
      setPhase('dead');
      setRenderState(snapshotState(s));
      playWrong();
      onWrong();
      return;
    }

    if (overlap < 15) {
      // Too thin → lose
      s.phase = 'dead';
      setPhase('dead');
      setRenderState(snapshotState(s));
      playWrong();
      onWrong();
      return;
    }

    // New block placed
    const newBlockY = s.stackTop - BLOCK_H;
    const newColor = BLOCK_COLORS[s.colorIndex % BLOCK_COLORS.length];
    s.colorIndex++;

    const newBlock = {
      x: overlapLeft,
      w: overlap,
      y: newBlockY,
      h: BLOCK_H,
      color: newColor,
    };

    s.stack.push(newBlock);
    s.stackX = overlapLeft;
    s.stackW = overlap;
    s.stackTop = newBlockY;
    s.platW = overlap;
    s.score += 1;

    // Camera effect: if stack is getting too high, shift everything down
    const visibleTop = newBlockY - s.cameraOffset;
    if (visibleTop < GAME_H * 0.35) {
      const shift = GAME_H * 0.35 - visibleTop;
      s.cameraOffset -= shift;
      // Apply shift to all blocks
      s.stack = s.stack.map(b => ({ ...b, y: b.y + shift }));
      s.stackTop += shift;
    }

    if (s.score >= config.targetScore) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      s.phase = 'win';
      setPhase('win');
      setRenderState(snapshotState(s));
      playCorrect();
      onCorrect();
      return;
    }

    setRenderState({
      ...snapshotState(s),
      platX: s.platX,
    });
  };

  const rs = renderState || snapshotState(initState());
  const platYRendered = (rs.stackTop || BASE_Y) - BLOCK_H - 14;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kule İnşa</Text>
      <Text style={styles.sub}>
        {rs.score || 0} / {config.targetScore}
      </Text>

      <TouchableOpacity style={styles.gameArea} onPress={handleTap} activeOpacity={1}>
        {/* Stack blocks */}
        {(rs.stack || []).map((b, i) => (
          <View
            key={i}
            style={[styles.block, {
              left: b.x,
              top: b.y,
              width: b.w,
              height: b.h,
              backgroundColor: b.color,
            }]}
          />
        ))}

        {/* Moving platform (shown during play) */}
        {(phase === 'play') && rs.platX !== undefined && (
          <View style={[styles.platform, {
            left: rs.platX,
            top: platYRendered,
            width: rs.platW || config.initialW,
            height: BLOCK_H,
            backgroundColor: BLOCK_COLORS[(rs.score || 0) % BLOCK_COLORS.length],
          }]} />
        )}

        {/* Drop guide arrow */}
        {phase === 'play' && rs.platX !== undefined && (
          <Text style={[styles.dropArrow, {
            left: (rs.platX || 0) + (rs.platW || config.initialW) / 2 - 10,
            top: platYRendered - 22,
          }]}>↓</Text>
        )}

        {/* Overlays */}
        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Kule İnşa</Text>
            <Text style={styles.overlayDesc}>Platform tam üstüne gelince{'\n'}dokun!</Text>
            <View style={styles.startBtn}>
              <Text style={styles.startBtnText}>BAŞLA</Text>
            </View>
          </View>
        )}
        {phase === 'win' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Mükemmel! 🏆</Text>
            <Text style={styles.overlayDesc}>Kule tamamlandı!</Text>
            <View style={styles.startBtn}>
              <Text style={styles.startBtnText}>TEKRAR</Text>
            </View>
          </View>
        )}
        {phase === 'dead' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Düştü! 💥</Text>
            <Text style={styles.overlayDesc}>Skor: {rs.score} / {config.targetScore}</Text>
            <View style={styles.startBtn}>
              <Text style={styles.startBtnText}>TEKRAR</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    margin: 8,
  },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '900', marginBottom: 2 },
  sub: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 8 },
  gameArea: {
    width: GAME_W,
    height: GAME_H,
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  block: {
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  platform: {
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#fff',
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  dropArrow: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 18,
    fontWeight: '900',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    zIndex: 10,
  },
  overlayTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 8 },
  overlayDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  startBtn: {
    backgroundColor: '#eab308',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
