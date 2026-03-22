import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 16, 360);
const GAME_H = Math.min(SH * 0.68, 520);
const BOTTLE_SIZE = 36;
const OBSTACLE_H = 25;
const OBSTACLE_Y = GAME_H * 0.55;
const GRAVITY = 0.4;

const DIFFICULTY_CONFIG = {
  0: { targetScore: 6,  bottleSpeed: 2,   gapW: 80 },
  1: { targetScore: 8,  bottleSpeed: 3.5, gapW: 60 },
  2: { targetScore: 10, bottleSpeed: 5,   gapW: 44 },
};

function randomGapX(gapW) {
  return GAME_W * 0.2 + Math.random() * GAME_W * 0.6;
}

export default function BottleDrop({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const [phase, setPhase] = useState('ready');
  const [renderState, setRenderState] = useState(null);

  const stRef = useRef(null);
  const frameRef = useRef(null);
  const isMountedRef = useRef(true);

  const initState = () => {
    const gapX = randomGapX(config.gapW);
    return {
      phase: 'ready',
      score: 0,
      bottleX: GAME_W / 2 - BOTTLE_SIZE / 2,
      bottleY: 30,
      bottleVY: 0,
      dropping: false,
      frozenX: null,
      gapX,
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
    bottleX: s.bottleX,
    bottleY: s.bottleY,
    dropping: s.dropping,
    frozenX: s.frozenX,
    gapX: s.gapX,
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

    if (!s.dropping) {
      // Oscillate bottle horizontally
      const t = Date.now();
      const range = GAME_W / 2 - BOTTLE_SIZE - 10;
      const centerX = GAME_W / 2 - BOTTLE_SIZE / 2;
      s.bottleX = centerX + Math.sin(t * 0.001 * config.bottleSpeed) * range;
      s.bottleY = 30;
    } else {
      // Bottle is falling
      s.bottleVY += GRAVITY;
      s.bottleY += s.bottleVY;

      // Check when bottle reaches obstacle row
      if (s.bottleY + BOTTLE_SIZE >= OBSTACLE_Y) {
        const bottleCenterX = s.frozenX + BOTTLE_SIZE / 2;
        const gapLeft = s.gapX - config.gapW / 2;
        const gapRight = s.gapX + config.gapW / 2;

        if (bottleCenterX >= gapLeft && bottleCenterX <= gapRight) {
          // Passed through the gap!
          s.score += 1;
          s.bottleY = OBSTACLE_Y; // land at obstacle level briefly for visual
          setRenderState(snapshotState(s));

          if (s.score >= config.targetScore) {
            s.phase = 'win';
            setPhase('win');
            playCorrect();
            onCorrect();
            return;
          }

          // New round
          setTimeout(() => {
            if (!isMountedRef.current) return;
            const ns = stRef.current;
            if (ns.phase !== 'play') return;
            ns.dropping = false;
            ns.frozenX = null;
            ns.bottleVY = 0;
            ns.bottleY = 30;
            ns.gapX = randomGapX(config.gapW);
          }, 250);
        } else {
          // Hit an obstacle
          s.bottleY = OBSTACLE_Y;
          s.phase = 'dead';
          setPhase('dead');
          setRenderState(snapshotState(s));
          playWrong();
          onWrong();
          return;
        }
      }

      // Bottle fell off screen (shouldn't happen normally)
      if (s.bottleY > GAME_H + 50) {
        s.phase = 'dead';
        setPhase('dead');
        setRenderState(snapshotState(s));
        playWrong();
        onWrong();
        return;
      }
    }

    setRenderState(snapshotState(s));
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

    const s = stRef.current;
    if (s.dropping) return; // already dropping

    playTap();
    s.dropping = true;
    s.frozenX = s.bottleX;
    s.bottleVY = 2;
  };

  const rs = renderState || snapshotState(initState());

  // Compute obstacle geometry
  const gapX = rs.gapX || GAME_W / 2;
  const gapLeft = gapX - config.gapW / 2;
  const gapRight = gapX + config.gapW / 2;
  const leftObsW = Math.max(0, gapLeft);
  const rightObsX = gapRight;
  const rightObsW = Math.max(0, GAME_W - gapRight);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Şişe Fırlat</Text>
      <Text style={styles.sub}>{rs.score || 0} / {config.targetScore}</Text>

      <TouchableOpacity style={styles.gameArea} onPress={handleTap} activeOpacity={1}>
        {/* Gap indicator arrow */}
        {phase === 'play' && (
          <Text style={[styles.gapArrow, { left: gapX - 12 }]}>↓</Text>
        )}

        {/* Left obstacle */}
        {leftObsW > 0 && (
          <View style={[styles.obstacle, {
            left: 0,
            top: OBSTACLE_Y,
            width: leftObsW,
          }]} />
        )}

        {/* Right obstacle */}
        {rightObsW > 0 && (
          <View style={[styles.obstacle, {
            left: rightObsX,
            top: OBSTACLE_Y,
            width: rightObsW,
          }]} />
        )}

        {/* Gap highlight */}
        <View style={[styles.gapHighlight, {
          left: gapLeft,
          top: OBSTACLE_Y,
          width: config.gapW,
        }]} />

        {/* Bottle */}
        <Text style={[styles.bottleEmoji, {
          left: rs.dropping ? rs.frozenX : rs.bottleX,
          top: rs.bottleY,
        }]}>🍾</Text>

        {/* Score dots */}
        <View style={styles.scoreDots}>
          {Array.from({ length: config.targetScore }).map((_, i) => (
            <View
              key={i}
              style={[styles.scoreDot, {
                backgroundColor: i < (rs.score || 0) ? '#38bdf8' : 'rgba(255,255,255,0.2)',
              }]}
            />
          ))}
        </View>

        {/* Overlays */}
        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Şişe Fırlat</Text>
            <Text style={styles.overlayDesc}>Şişe boşlukla hizalanınca{'\n'}dokun ve bırak!</Text>
            <View style={styles.startBtn}>
              <Text style={styles.startBtnText}>BAŞLA</Text>
            </View>
          </View>
        )}
        {phase === 'win' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Harika! 🎉</Text>
            <Text style={styles.overlayDesc}>Hepsini geçirdin!</Text>
            <View style={styles.startBtn}>
              <Text style={styles.startBtnText}>TEKRAR</Text>
            </View>
          </View>
        )}
        {phase === 'dead' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Çarptı! 💥</Text>
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
    backgroundColor: '#0a1a2e',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  obstacle: {
    position: 'absolute',
    height: OBSTACLE_H,
    backgroundColor: '#475569',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#64748b',
  },
  gapHighlight: {
    position: 'absolute',
    height: OBSTACLE_H,
    backgroundColor: 'rgba(56,189,248,0.18)',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#38bdf8',
  },
  gapArrow: {
    position: 'absolute',
    top: OBSTACLE_Y - 32,
    color: '#38bdf8',
    fontSize: 22,
    fontWeight: '900',
  },
  bottleEmoji: {
    position: 'absolute',
    fontSize: BOTTLE_SIZE - 4,
    lineHeight: BOTTLE_SIZE,
    width: BOTTLE_SIZE,
    textAlign: 'center',
  },
  scoreDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  scoreDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
    backgroundColor: '#38bdf8',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
