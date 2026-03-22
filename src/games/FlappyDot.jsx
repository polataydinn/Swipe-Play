import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 40, 340);
const GAME_H = Math.min(SH * 0.55, 420);
const DOT_SIZE = 22;
const PIPE_W = 42;
const GRAVITY = 0.28;
const JUMP = -5.2;

const HARD_CONFIG = { gapSize: 105, pipeSpeed: 2.8, pipeGap: 160 };

export default function FlappyDot({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = HARD_CONFIG;
  const [phase, setPhase] = useState('ready');
  const [dotY, setDotY] = useState(GAME_H / 2);
  const [pipes, setPipes] = useState([]);
  const [score, setScore] = useState(0);
  const velRef = useRef(0);
  const frameRef = useRef(null);
  const isMountedRef = useRef(true);
  const pipesRef = useRef([]);
  const dotYRef = useRef(GAME_H / 2);
  const scoreRef = useRef(0);
  const phaseRef = useRef('ready');

  useEffect(() => {
    if (onLockSwipe) onLockSwipe();
    return () => { if (onUnlockSwipe) onUnlockSwipe(); };
  }, []);

  const resetGame = () => {
    velRef.current = 0;
    dotYRef.current = GAME_H / 2;
    scoreRef.current = 0;
    pipesRef.current = [];
    setDotY(GAME_H / 2);
    setPipes([]);
    setScore(0);
    setPhase('ready');
    phaseRef.current = 'ready';
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  };

  useEffect(() => { resetGame(); }, [difficulty]);

  const spawnPipe = (x) => {
    const margin = 50;
    const gapTop = Math.random() * (GAME_H - config.gapSize - margin * 2) + margin;
    return { x, gapTop, passed: false };
  };

  const startGame = () => {
    velRef.current = JUMP;
    dotYRef.current = GAME_H / 2;
    scoreRef.current = 0;
    pipesRef.current = [spawnPipe(GAME_W + 80)];
    setPhase('play');
    phaseRef.current = 'play';
    gameLoop();
  };

  const gameLoop = () => {
    if (!isMountedRef.current) return;
    if (phaseRef.current !== 'play') return;

    velRef.current += GRAVITY;
    if (velRef.current > 4.5) velRef.current = 4.5;
    dotYRef.current += velRef.current;
    const dy = dotYRef.current;

    if (dy < 0) {
      dotYRef.current = 0;
      velRef.current = 0.5;
    }
    if (dy > GAME_H - DOT_SIZE) {
      endGame();
      return;
    }

    let ps = pipesRef.current.map(p => ({ ...p, x: p.x - config.pipeSpeed }));
    ps = ps.filter(p => p.x > -PIPE_W);

    const dotLeft = GAME_W * 0.2;
    const dotRight = dotLeft + DOT_SIZE;
    const dotTop = dotYRef.current;
    const dotBottom = dotTop + DOT_SIZE;

    const hitMargin = 4;
    for (const p of ps) {
      const pLeft = p.x;
      const pRight = p.x + PIPE_W;
      if (dotRight - hitMargin > pLeft && dotLeft + hitMargin < pRight) {
        if (dotTop + hitMargin < p.gapTop || dotBottom - hitMargin > p.gapTop + config.gapSize) {
          endGame();
          return;
        }
      }
      if (!p.passed && p.x + PIPE_W < dotLeft) {
        p.passed = true;
        scoreRef.current += 1;
      }
    }

    if (ps.length === 0 || ps[ps.length - 1].x < GAME_W - config.pipeGap) {
      ps.push(spawnPipe(GAME_W + 20));
    }

    pipesRef.current = ps;
    setDotY(dotYRef.current);
    setPipes([...ps]);
    setScore(scoreRef.current);

    frameRef.current = requestAnimationFrame(gameLoop);
  };

  const endGame = () => {
    phaseRef.current = 'dead';
    setPhase('dead');
    setDotY(dotYRef.current);
    onWrong();
  };

  const handleTap = () => {
    playTap();
    if (phase === 'ready') {
      startGame();
    } else if (phase === 'play') {
      velRef.current = JUMP;
    } else {
      resetGame();
    }
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flappy Dot</Text>
      <Text style={styles.sub}>Skor: {score}</Text>

      <TouchableOpacity style={styles.gameArea} onPress={handleTap} activeOpacity={1}>
        {pipes.map((p, i) => (
          <React.Fragment key={i}>
            <View style={[styles.pipe, { left: p.x, top: 0, height: p.gapTop }]} />
            <View style={[styles.pipeEnd, { left: p.x - 3, top: p.gapTop - 16, width: PIPE_W + 6 }]} />
            <View style={[styles.pipe, { left: p.x, top: p.gapTop + config.gapSize, height: GAME_H - p.gapTop - config.gapSize }]} />
            <View style={[styles.pipeEnd, { left: p.x - 3, top: p.gapTop + config.gapSize, width: PIPE_W + 6 }]} />
          </React.Fragment>
        ))}
        <View style={[styles.dot, { top: dotY, left: GAME_W * 0.2 }]} />

        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Dokun ve Uç!</Text>
            <Text style={styles.overlayHint}>Engelleri geç</Text>
          </View>
        )}
        {phase === 'dead' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Skor: {score}</Text>
            <Text style={styles.overlayHint}>Tekrar denemek için dokun</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 20, margin: 10, backgroundColor: COLORS.surface },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '900', marginBottom: 2 },
  sub: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 10 },
  gameArea: { width: GAME_W, height: GAME_H, backgroundColor: '#0c1929', borderRadius: 12, overflow: 'hidden', position: 'relative' },
  dot: { position: 'absolute', width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2, backgroundColor: '#facc15', borderWidth: 2, borderColor: '#eab308' },
  pipe: { position: 'absolute', width: PIPE_W, backgroundColor: '#22c55e', borderRadius: 2 },
  pipeEnd: { position: 'absolute', height: 16, backgroundColor: '#16a34a', borderRadius: 3 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  overlayText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  overlayHint: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 8 },
});
