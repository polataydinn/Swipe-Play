import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 40, 340);
const GAME_H = Math.min(SH * 0.55, 420);
const PADDLE_W = 70;
const PADDLE_H = 12;
const BALL_R = 8;
const BRICK_COLS = 6;
const BRICK_GAP = 4;
const BRICK_PAD = 8;
const BRICK_W = (GAME_W - BRICK_PAD * 2 - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;
const BRICK_H = 18;

const DIFFICULTY_CONFIG = {
  0: { ballSpeed: 2.5, rows: 3, lives: 3 },
  1: { ballSpeed: 3.2, rows: 4, lives: 2 },
  2: { ballSpeed: 4, rows: 5, lives: 1 },
};

const BRICK_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];

function createBricks(rows) {
  const bricks = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < BRICK_COLS; c++)
      bricks.push({ x: BRICK_PAD + c * (BRICK_W + BRICK_GAP), y: 30 + r * (BRICK_H + BRICK_GAP), w: BRICK_W, h: BRICK_H, color: BRICK_COLORS[r % BRICK_COLORS.length], alive: true });
  return bricks;
}

export default function BrickBreaker({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  // phase: 'idle' | 'playing' | 'paused' | 'win' | 'lose'
  const [phase, setPhase] = useState('idle');
  const [paddleX, setPaddleX] = useState(GAME_W / 2 - PADDLE_W / 2);
  const [balls, setBalls] = useState([{ x: GAME_W / 2, y: GAME_H - 50 }]);
  const [bricks, setBricks] = useState([]);
  const [lives, setLives] = useState(config.lives);
  const [powerups, setPowerups] = useState([]);
  const [doubleBallActive, setDoubleBallActive] = useState(false);

  const stateRef = useRef({ paddleX: 0, balls: [], dx: 0, dy: 0, bricks: [], lives: 0, phase: 'idle', powerups: [] });
  const frameRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => { if (onUnlockSwipe) onUnlockSwipe(); };
  }, []);

  useEffect(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    stateRef.current.phase = 'idle';
    setPhase('idle');
  }, [difficulty]);

  const initAndStart = () => {
    const b = createBricks(config.rows);
    const initBall = { x: GAME_W / 2, y: GAME_H - 50, dx: config.ballSpeed * (Math.random() > 0.5 ? 0.7 : -0.7), dy: -config.ballSpeed };
    stateRef.current = {
      paddleX: GAME_W / 2 - PADDLE_W / 2,
      balls: [initBall],
      bricks: b, lives: config.lives, phase: 'playing', powerups: [],
    };
    setPaddleX(GAME_W / 2 - PADDLE_W / 2);
    setBalls([{ x: initBall.x, y: initBall.y }]);
    setBricks(b);
    setLives(config.lives);
    setPowerups([]);
    setDoubleBallActive(false);
    setPhase('playing');
    if (onLockSwipe) onLockSwipe();
    requestAnimationFrame(gameLoop);
  };

  const handlePause = () => {
    stateRef.current.phase = 'paused';
    setPhase('paused');
    if (onUnlockSwipe) onUnlockSwipe();
  };

  const handleResume = () => {
    stateRef.current.phase = 'playing';
    setPhase('playing');
    if (onLockSwipe) onLockSwipe();
    requestAnimationFrame(gameLoop);
  };

  const handleStop = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    stateRef.current.phase = 'idle';
    setPhase('idle');
    if (onUnlockSwipe) onUnlockSwipe();
  };

  const gameLoop = () => {
    if (!isMountedRef.current) return;
    const s = stateRef.current;
    if (s.phase !== 'playing') return;

    // Move power-ups down
    s.powerups = s.powerups
      .map(p => ({ ...p, y: p.y + 2 }))
      .filter(p => p.y < GAME_H + 20);

    // Check power-up catch
    const caught = [];
    for (const p of s.powerups) {
      if (p.y >= GAME_H - 40 && p.y <= GAME_H - 20 &&
          p.x >= s.paddleX && p.x <= s.paddleX + PADDLE_W) {
        caught.push(p.id);
        // Add second ball
        const existing = s.balls[0];
        if (existing) {
          s.balls.push({ x: existing.x, y: existing.y, dx: -existing.dx * 0.8, dy: existing.dy });
          setDoubleBallActive(true);
        }
      }
    }
    s.powerups = s.powerups.filter(p => !caught.includes(p.id));
    setPowerups([...s.powerups]);

    // Move all balls
    let anyAlive = false;
    for (const ball of s.balls) {
      ball.x += ball.dx;
      ball.y += ball.dy;

      if (ball.x <= BALL_R || ball.x >= GAME_W - BALL_R) ball.dx = -ball.dx;
      if (ball.y <= BALL_R) ball.dy = -ball.dy;

      if (ball.y >= GAME_H - 30 - BALL_R && ball.dy > 0) {
        if (ball.x >= s.paddleX && ball.x <= s.paddleX + PADDLE_W) {
          ball.dy = -Math.abs(ball.dy);
          ball.dx = ((ball.x - s.paddleX) / PADDLE_W - 0.5) * config.ballSpeed * 2;
          playTap();
        }
      }

      if (ball.y <= GAME_H) anyAlive = true;
    }

    // Remove out-of-bounds balls
    s.balls = s.balls.filter(b => b.y <= GAME_H);

    if (s.balls.length === 0) {
      s.lives -= 1;
      if (s.lives <= 0) {
        s.phase = 'lose';
        setPhase('lose');
        setLives(0);
        if (onUnlockSwipe) onUnlockSwipe();
        onWrong();
        return;
      }
      const initBall = { x: GAME_W / 2, y: GAME_H - 50, dx: config.ballSpeed * (Math.random() > 0.5 ? 0.7 : -0.7), dy: -config.ballSpeed };
      s.balls = [initBall];
      setDoubleBallActive(false);
      setLives(s.lives);
    }

    // Ball-brick collision for each ball
    for (const ball of s.balls) {
      for (const brick of s.bricks) {
        if (!brick.alive) continue;
        if (ball.x + BALL_R > brick.x && ball.x - BALL_R < brick.x + brick.w &&
            ball.y + BALL_R > brick.y && ball.y - BALL_R < brick.y + brick.h) {
          brick.alive = false;
          ball.dy = -ball.dy;
          // 20% chance to drop double-ball power-up
          if (Math.random() < 0.2 && s.balls.length < 2) {
            s.powerups.push({ x: brick.x + brick.w / 2, y: brick.y, id: Date.now() + Math.random() });
          }
          break;
        }
      }
    }

    if (s.bricks.every(b => !b.alive)) {
      s.phase = 'win';
      setPhase('win');
      setBricks([...s.bricks]);
      if (onUnlockSwipe) onUnlockSwipe();
      onCorrect();
      return;
    }

    setBalls(s.balls.map(b => ({ x: b.x, y: b.y })));
    setBricks([...s.bricks]);
    frameRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const dragStartPaddleX = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartPaddleX.current = stateRef.current.paddleX;
      },
      onPanResponderMove: (_, gs) => {
        if (stateRef.current.phase !== 'playing') return;
        const newX = Math.max(0, Math.min(GAME_W - PADDLE_W, dragStartPaddleX.current + gs.dx * 0.8));
        stateRef.current.paddleX = newX;
        setPaddleX(newX);
      },
    })
  ).current;

  // Idle screen
  if (phase === 'idle') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Tuğla Kır</Text>
        <Text style={styles.desc}>Paddle'ı kaydırarak topu sektir ve tuğlaları kır!</Text>
        <View style={styles.previewRow}>
          {BRICK_COLORS.map((c, i) => (
            <View key={i} style={[styles.previewBrick, { backgroundColor: c }]} />
          ))}
        </View>
        <TouchableOpacity style={styles.startBtn} onPress={initAndStart}>
          <Text style={styles.startBtnText}>Başla</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Oyun başlayınca kaydırma kilitlenir</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.livesText}>{'❤️'.repeat(lives)}</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {doubleBallActive && <Text style={styles.powerupBadge}>2x Top</Text>}
          {phase === 'playing' && (
            <TouchableOpacity style={styles.pauseBtn} onPress={handlePause}>
              <Text style={styles.pauseBtnText}>Durdur</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.gameArea} {...(phase === 'playing' ? panResponder.panHandlers : {})}>
        {bricks.map((b, i) => b.alive ? (
          <View key={i} style={[styles.brick, { left: b.x, top: b.y, width: b.w, height: b.h, backgroundColor: b.color }]} />
        ) : null)}
        {powerups.map((p, i) => (
          <View key={i} style={[styles.powerup, { left: p.x - 10, top: p.y - 10 }]}>
            <Text style={{ fontSize: 16 }}>★</Text>
          </View>
        ))}
        {balls.map((b, i) => (
          <View key={i} style={[styles.ball, { left: b.x - BALL_R, top: b.y - BALL_R }]} />
        ))}
        <View style={[styles.paddle, { left: paddleX, top: GAME_H - 30 }]} />

        {phase === 'paused' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Duraklatıldı</Text>
            <TouchableOpacity style={styles.resumeBtn} onPress={handleResume}>
              <Text style={styles.resumeBtnText}>Devam Et</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quitBtn} onPress={handleStop}>
              <Text style={styles.quitBtnText}>Çık</Text>
            </TouchableOpacity>
            <Text style={styles.pauseHint}>Veya kaydırarak başka oyuna geç</Text>
          </View>
        )}
        {(phase === 'win' || phase === 'lose') && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>{phase === 'win' ? 'Tamamlandı!' : 'Bitti!'}</Text>
            <TouchableOpacity style={styles.resumeBtn} onPress={initAndStart}>
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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 20, margin: 10, backgroundColor: COLORS.surface },
  // Idle
  title: { color: COLORS.text, fontSize: 32, fontWeight: '900', marginBottom: 8 },
  desc: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  previewRow: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  previewBrick: { width: 40, height: 20, borderRadius: 4 },
  startBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 48, paddingVertical: 14, borderRadius: 14 },
  startBtnText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  hint: { color: COLORS.textMuted, fontSize: 12, marginTop: 16 },
  // Playing
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: GAME_W, marginBottom: 8 },
  livesText: { fontSize: 16 },
  pauseBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  pauseBtnText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  gameArea: { width: GAME_W, height: GAME_H, backgroundColor: '#0c1020', borderRadius: 12, overflow: 'hidden', position: 'relative' },
  brick: { position: 'absolute', borderRadius: 3 },
  ball: { position: 'absolute', width: BALL_R * 2, height: BALL_R * 2, borderRadius: BALL_R, backgroundColor: '#fff' },
  paddle: { position: 'absolute', width: PADDLE_W, height: PADDLE_H, borderRadius: 6, backgroundColor: '#3b82f6' },
  powerup: { position: 'absolute', width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  powerupBadge: { color: '#facc15', fontSize: 12, fontWeight: '700', backgroundColor: 'rgba(250,204,21,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, zIndex: 10 },
  overlayText: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  resumeBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10, marginTop: 14 },
  resumeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  quitBtn: { paddingHorizontal: 32, paddingVertical: 10, marginTop: 10 },
  quitBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600' },
  pauseHint: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 16 },
});
