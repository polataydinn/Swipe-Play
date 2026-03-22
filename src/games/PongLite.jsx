import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 40, 340);
const GAME_H = Math.min(SH * 0.55, 420);
const PADDLE_W = 60;
const PADDLE_H = 10;
const BALL_R = 8;

const DIFFICULTY_CONFIG = {
  0: { ballSpeed: 3, aiSpeed: 2, winScore: 3 },
  1: { ballSpeed: 4, aiSpeed: 3.5, winScore: 5 },
  2: { ballSpeed: 5, aiSpeed: 4.5, winScore: 5 },
};

export default function PongLite({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  // phase: 'idle' | 'playing' | 'paused' | 'win' | 'lose'
  const [phase, setPhase] = useState('idle');
  const [playerX, setPlayerX] = useState(GAME_W / 2 - PADDLE_W / 2);
  const [aiX, setAiX] = useState(GAME_W / 2 - PADDLE_W / 2);
  const [ball, setBall] = useState({ x: GAME_W / 2, y: GAME_H / 2 });
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);

  const s = useRef({ playerX: 0, aiX: 0, bx: 0, by: 0, dx: 0, dy: 0, pScore: 0, aScore: 0, phase: 'idle' });
  const frameRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => { if (onUnlockSwipe) onUnlockSwipe(); };
  }, []);

  useEffect(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    s.current.phase = 'idle';
    setPhase('idle');
  }, [difficulty]);

  const resetBall = () => {
    s.current.bx = GAME_W / 2;
    s.current.by = GAME_H / 2;
    s.current.dx = config.ballSpeed * (Math.random() > 0.5 ? 0.8 : -0.8);
    s.current.dy = config.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
  };

  const initAndStart = () => {
    s.current = {
      playerX: GAME_W / 2 - PADDLE_W / 2,
      aiX: GAME_W / 2 - PADDLE_W / 2,
      bx: GAME_W / 2, by: GAME_H / 2,
      dx: config.ballSpeed * (Math.random() > 0.5 ? 0.8 : -0.8),
      dy: config.ballSpeed,
      pScore: 0, aScore: 0, phase: 'playing',
    };
    setPlayerX(GAME_W / 2 - PADDLE_W / 2);
    setAiX(GAME_W / 2 - PADDLE_W / 2);
    setBall({ x: GAME_W / 2, y: GAME_H / 2 });
    setPlayerScore(0);
    setAiScore(0);
    setPhase('playing');
    if (onLockSwipe) onLockSwipe();
    requestAnimationFrame(gameLoop);
  };

  const handlePause = () => {
    s.current.phase = 'paused';
    setPhase('paused');
    if (onUnlockSwipe) onUnlockSwipe();
  };

  const handleResume = () => {
    s.current.phase = 'playing';
    setPhase('playing');
    if (onLockSwipe) onLockSwipe();
    requestAnimationFrame(gameLoop);
  };

  const handleStop = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    s.current.phase = 'idle';
    setPhase('idle');
    if (onUnlockSwipe) onUnlockSwipe();
  };

  const gameLoop = () => {
    if (!isMountedRef.current) return;
    const st = s.current;
    if (st.phase !== 'playing') return;

    st.bx += st.dx;
    st.by += st.dy;

    if (st.bx <= BALL_R || st.bx >= GAME_W - BALL_R) st.dx = -st.dx;

    if (st.by >= GAME_H - 30 - BALL_R && st.dy > 0) {
      if (st.bx >= st.playerX && st.bx <= st.playerX + PADDLE_W) {
        const speed = Math.min(Math.sqrt(st.dx * st.dx + st.dy * st.dy) * 1.04, config.ballSpeed * 1.8);
        st.dy = -Math.abs(st.dy) * (speed / Math.abs(st.dy));
        st.dx = ((st.bx - st.playerX) / PADDLE_W - 0.5) * speed * 1.5;
        // clamp
        const len = Math.sqrt(st.dx * st.dx + st.dy * st.dy);
        st.dx = (st.dx / len) * speed;
        st.dy = (st.dy / len) * speed;
        playTap();
      }
    }

    if (st.by <= 30 + BALL_R && st.dy < 0) {
      if (st.bx >= st.aiX && st.bx <= st.aiX + PADDLE_W) {
        st.dy = Math.abs(st.dy);
        st.dx = ((st.bx - st.aiX) / PADDLE_W - 0.5) * config.ballSpeed * 2;
      }
    }

    const aiCenter = st.aiX + PADDLE_W / 2;
    const diff = st.bx - aiCenter;
    if (Math.abs(diff) > 5) {
      st.aiX += Math.sign(diff) * Math.min(config.aiSpeed, Math.abs(diff));
      st.aiX = Math.max(0, Math.min(GAME_W - PADDLE_W, st.aiX));
    }

    if (st.by > GAME_H) {
      st.aScore += 1;
      if (st.aScore >= config.winScore) {
        st.phase = 'lose';
        setPhase('lose');
        setAiScore(st.aScore);
        if (onUnlockSwipe) onUnlockSwipe();
        onWrong();
        return;
      }
      setAiScore(st.aScore);
      resetBall();
    }
    if (st.by < 0) {
      st.pScore += 1;
      if (st.pScore >= config.winScore) {
        st.phase = 'win';
        setPhase('win');
        setPlayerScore(st.pScore);
        if (onUnlockSwipe) onUnlockSwipe();
        onCorrect();
        return;
      }
      setPlayerScore(st.pScore);
      resetBall();
    }

    setBall({ x: st.bx, y: st.by });
    setAiX(st.aiX);
    frameRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const dragStartPlayerX = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartPlayerX.current = s.current.playerX;
      },
      onPanResponderMove: (_, gs) => {
        if (s.current.phase !== 'playing') return;
        const newX = Math.max(0, Math.min(GAME_W - PADDLE_W, dragStartPlayerX.current + gs.dx * 0.8));
        s.current.playerX = newX;
        setPlayerX(newX);
      },
    })
  ).current;

  // Idle screen
  if (phase === 'idle') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pong</Text>
        <Text style={styles.desc}>Paddle'ını kaydırarak topu karşı tarafa gönder!</Text>
        <View style={styles.previewArea}>
          <View style={[styles.previewPaddle, { backgroundColor: '#ef4444' }]} />
          <View style={styles.previewBall} />
          <View style={[styles.previewPaddle, { backgroundColor: '#3b82f6' }]} />
        </View>
        <TouchableOpacity style={styles.startBtn} onPress={initAndStart}>
          <Text style={styles.startBtnText}>Başla</Text>
        </TouchableOpacity>
        <Text style={styles.hintText}>Oyun başlayınca kaydırma kilitlenir</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.scoreText}>AI {aiScore} - {playerScore} Sen</Text>
        {phase === 'playing' && (
          <TouchableOpacity style={styles.pauseBtn} onPress={handlePause}>
            <Text style={styles.pauseBtnText}>Durdur</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.gameArea} {...(phase === 'playing' ? panResponder.panHandlers : {})}>
        <View style={styles.centerLine} />
        <View style={[styles.paddle, { left: aiX, top: 20, backgroundColor: '#ef4444' }]} />
        <View style={[styles.paddle, { left: playerX, top: GAME_H - 30, backgroundColor: '#3b82f6' }]} />
        <View style={[styles.ball, { left: ball.x - BALL_R, top: ball.y - BALL_R }]} />

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
            <Text style={styles.overlayText}>{phase === 'win' ? 'Kazandın!' : 'Kaybettin!'}</Text>
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
  previewArea: { alignItems: 'center', gap: 16, marginBottom: 24 },
  previewPaddle: { width: 50, height: 8, borderRadius: 4 },
  previewBall: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff' },
  startBtn: { backgroundColor: '#22c55e', paddingHorizontal: 48, paddingVertical: 14, borderRadius: 14 },
  startBtnText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  hintText: { color: COLORS.textMuted, fontSize: 12, marginTop: 16 },
  // Playing
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: GAME_W, marginBottom: 8 },
  scoreText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  pauseBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  pauseBtnText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  gameArea: { width: GAME_W, height: GAME_H, backgroundColor: '#0c0c1a', borderRadius: 12, overflow: 'hidden', position: 'relative' },
  centerLine: { position: 'absolute', top: GAME_H / 2 - 1, left: 20, right: 20, height: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  paddle: { position: 'absolute', width: PADDLE_W, height: PADDLE_H, borderRadius: 5 },
  ball: { position: 'absolute', width: BALL_R * 2, height: BALL_R * 2, borderRadius: BALL_R, backgroundColor: '#fff' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, zIndex: 10 },
  overlayText: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  resumeBtn: { backgroundColor: '#22c55e', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10, marginTop: 14 },
  resumeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  quitBtn: { paddingHorizontal: 32, paddingVertical: 10, marginTop: 10 },
  quitBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600' },
  pauseHint: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 16 },
});
