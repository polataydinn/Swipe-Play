import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 16, 360);
const GAME_H = Math.min(SH * 0.68, 520);
const PLAYER_W = 40;
const PLAYER_H = 40;
const BALL_RADIUS = 16;
const BALL_EMOJIS = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣'];

const DIFFICULTY_CONFIG = {
  0: { duration: 30, spawnMs: 1800, ballSpeed: 3, maxBalls: 6, playerSpeed: 5 },
  1: { duration: 30, spawnMs: 1200, ballSpeed: 4, maxBalls: 9, playerSpeed: 6 },
  2: { duration: 25, spawnMs: 800,  ballSpeed: 5.5, maxBalls: 12, playerSpeed: 7 },
};

export default function BallDodge({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const [phase, setPhase] = useState('ready');
  const [renderState, setRenderState] = useState(null);

  const stRef = useRef(null);
  const frameRef = useRef(null);
  const spawnTimerRef = useRef(null);
  const countTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  const PLAYER_Y = GAME_H - 60;

  const initState = () => ({
    phase: 'ready',
    playerX: GAME_W / 2 - PLAYER_W / 2,
    balls: [],
    timeLeft: config.duration,
    moveDir: 0,
    nextBallId: 0,
  });

  useEffect(() => {
    stRef.current = initState();
    setRenderState({ ...stRef.current });
    if (onLockSwipe) onLockSwipe();
    return () => {
      isMountedRef.current = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      if (countTimerRef.current) clearInterval(countTimerRef.current);
      if (onUnlockSwipe) onUnlockSwipe();
    };
  }, []);

  useEffect(() => {
    resetGame();
  }, [difficulty]);

  const resetGame = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (countTimerRef.current) clearInterval(countTimerRef.current);
    stRef.current = initState();
    setPhase('ready');
    setRenderState({ ...stRef.current });
  };

  const startGame = () => {
    if (onLockSwipe) onLockSwipe();
    stRef.current.phase = 'play';
    setPhase('play');

    // Countdown
    countTimerRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      s.timeLeft -= 1;
      if (s.timeLeft <= 0) {
        s.timeLeft = 0;
        s.phase = 'win';
        setPhase('win');
        clearInterval(countTimerRef.current);
        clearInterval(spawnTimerRef.current);
        playCorrect();
        onCorrect();
      }
    }, 1000);

    // Ball spawner
    spawnTimerRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      if (s.balls.length >= config.maxBalls) return;
      const id = s.nextBallId++;
      s.balls.push({
        id,
        x: BALL_RADIUS + Math.random() * (GAME_W - BALL_RADIUS * 2),
        y: -BALL_RADIUS,
        vy: config.ballSpeed + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 2.5,
        emoji: BALL_EMOJIS[Math.floor(Math.random() * BALL_EMOJIS.length)],
      });
    }, config.spawnMs);

    frameRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = () => {
    if (!isMountedRef.current) return;
    const s = stRef.current;
    if (s.phase !== 'play') return;

    // Move player
    s.playerX += s.moveDir * config.playerSpeed;
    s.playerX = Math.max(0, Math.min(GAME_W - PLAYER_W, s.playerX));

    // Move balls
    for (const b of s.balls) {
      b.vy += 0.15; // gravity
      b.x += b.vx;
      b.y += b.vy;
      // Bounce off walls
      if (b.x - BALL_RADIUS < 0) { b.x = BALL_RADIUS; b.vx = Math.abs(b.vx); }
      if (b.x + BALL_RADIUS > GAME_W) { b.x = GAME_W - BALL_RADIUS; b.vx = -Math.abs(b.vx); }
    }

    // Remove balls that fell off bottom
    s.balls = s.balls.filter(b => b.y - BALL_RADIUS < GAME_H + 20);

    // Collision: player center vs ball center
    const playerCX = s.playerX + PLAYER_W / 2;
    const playerCY = PLAYER_Y + PLAYER_H / 2;
    for (const b of s.balls) {
      const dist = Math.sqrt((playerCX - b.x) ** 2 + (playerCY - b.y) ** 2);
      if (dist < BALL_RADIUS + 20) {
        s.phase = 'dead';
        clearInterval(spawnTimerRef.current);
        clearInterval(countTimerRef.current);
        setPhase('dead');
        setRenderState({ playerX: s.playerX, balls: [...s.balls], timeLeft: s.timeLeft, phase: 'dead' });
        playWrong();
        onWrong();
        return;
      }
    }

    setRenderState({
      playerX: s.playerX,
      balls: [...s.balls],
      timeLeft: s.timeLeft,
      phase: s.phase,
    });

    frameRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      if (countTimerRef.current) clearInterval(countTimerRef.current);
    };
  }, []);

  const setMoveDir = (dir) => {
    if (stRef.current && stRef.current.phase === 'play') {
      stRef.current.moveDir = dir;
    }
  };

  const rs = renderState || initState();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Kaçış</Text>
      <Text style={styles.sub}>Süre: {Math.ceil(rs.timeLeft || config.duration)}s</Text>

      <View style={styles.gameArea}>
        {/* Balls */}
        {(rs.balls || []).map(b => (
          <Text
            key={b.id}
            style={[styles.ballEmoji, {
              left: b.x - BALL_RADIUS,
              top: b.y - BALL_RADIUS,
            }]}
          >
            {b.emoji}
          </Text>
        ))}

        {/* Player */}
        <Text style={[styles.playerEmoji, {
          left: rs.playerX,
          top: PLAYER_Y,
        }]}>🏃</Text>

        {/* Touch zones - left and right halves, shown only in play */}
        {phase === 'play' && (
          <>
            <TouchableOpacity
              style={styles.leftZone}
              onPressIn={() => setMoveDir(-1)}
              onPressOut={() => setMoveDir(0)}
              activeOpacity={1}
            >
              <Text style={styles.zoneArrow}>◀</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rightZone}
              onPressIn={() => setMoveDir(1)}
              onPressOut={() => setMoveDir(0)}
              activeOpacity={1}
            >
              <Text style={styles.zoneArrow}>▶</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Overlays */}
        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Top Kaçış</Text>
            <Text style={styles.overlayDesc}>Sol/Sağ'a basılı tut{'\n'}toplardan kaç!</Text>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startBtnText}>BAŞLA</Text>
            </TouchableOpacity>
          </View>
        )}
        {phase === 'win' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Harika! 🎉</Text>
            <Text style={styles.overlayDesc}>Hayatta kaldın!</Text>
            <TouchableOpacity style={styles.startBtn} onPress={resetGame}>
              <Text style={styles.startBtnText}>TEKRAR</Text>
            </TouchableOpacity>
          </View>
        )}
        {phase === 'dead' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Çarpıştı! 💥</Text>
            <Text style={styles.overlayDesc}>Kalan süre: {Math.ceil(rs.timeLeft)}s</Text>
            <TouchableOpacity style={styles.startBtn} onPress={resetGame}>
              <Text style={styles.startBtnText}>TEKRAR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const PLAYER_Y = Math.min(Dimensions.get('window').height * 0.68, 520) - 60;

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
    backgroundColor: '#0a0a1a',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  ballEmoji: {
    position: 'absolute',
    fontSize: BALL_RADIUS * 1.8,
    lineHeight: BALL_RADIUS * 2,
    width: BALL_RADIUS * 2,
    height: BALL_RADIUS * 2,
    textAlign: 'center',
  },
  playerEmoji: {
    position: 'absolute',
    fontSize: 32,
    lineHeight: 40,
    width: 40,
    textAlign: 'center',
  },
  leftZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: GAME_W / 2,
    height: GAME_H,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },
  rightZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: GAME_W / 2,
    height: GAME_H,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },
  zoneArrow: {
    color: 'rgba(255,255,255,0.18)',
    fontSize: 28,
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
    backgroundColor: '#f97316',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
