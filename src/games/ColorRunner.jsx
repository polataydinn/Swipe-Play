import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 40, 340);
const GAME_H = Math.min(SH * 0.5, 380);
const RUNNER_SIZE = 28;
const LANE_H = GAME_H;
const OBSTACLE_W = GAME_W;
const OBSTACLE_H = 50;
const RUN_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];

const DIFFICULTY_CONFIG = {
  0: { speed: 2, target: 20, spawnRate: 120 },
  1: { speed: 3, target: 35, spawnRate: 90 },
  2: { speed: 4, target: 50, spawnRate: 70 },
};

export default function ColorRunner({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [phase, setPhase] = useState('ready');
  const [colorIdx, setColorIdx] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [runnerY] = useState(GAME_H - 60);

  const stRef = useRef({
    colorIdx: 0, obstacles: [], score: 0, frame: 0, phase: 'ready',
  });
  const frameRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (onLockSwipe) onLockSwipe();
    return () => { if (onUnlockSwipe) onUnlockSwipe(); };
  }, []);

  const resetGame = () => {
    stRef.current = { colorIdx: 0, obstacles: [], score: 0, frame: 0, phase: 'ready' };
    setColorIdx(0);
    setObstacles([]);
    setScore(0);
    setPhase('ready');
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  };

  useEffect(() => { resetGame(); }, [difficulty]);

  const startGame = () => {
    stRef.current.phase = 'play';
    setPhase('play');
    gameLoop();
  };

  const gameLoop = () => {
    if (!isMountedRef.current) return;
    const s = stRef.current;
    if (s.phase !== 'play') return;

    s.frame++;

    // Move obstacles down
    s.obstacles = s.obstacles
      .map(o => ({ ...o, y: o.y + config.speed }))
      .filter(o => o.y < GAME_H + OBSTACLE_H);

    // Spawn new obstacle
    if (s.frame % config.spawnRate === 0) {
      const gateColor = Math.floor(Math.random() * RUN_COLORS.length);
      s.obstacles.push({ y: -OBSTACLE_H, gateColor, id: s.frame });
    }

    // Check collision with passed obstacles
    const runnerTop = GAME_H - 60;
    const runnerBottom = runnerTop + RUNNER_SIZE;
    for (const o of s.obstacles) {
      if (!o.passed && o.y + OBSTACLE_H > runnerTop && o.y < runnerBottom) {
        o.passed = true;
        if (s.colorIdx === o.gateColor) {
          s.score += 1;
        } else {
          s.phase = 'dead';
          setPhase('dead');
          setScore(s.score);
          setObstacles([...s.obstacles]);
          if (s.score >= config.target) onCorrect(); else onWrong();
          return;
        }
      }
    }

    setObstacles([...s.obstacles]);
    setScore(s.score);

    if (s.score >= config.target) {
      s.phase = 'win';
      setPhase('win');
      onCorrect();
      return;
    }

    frameRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const switchColor = () => {
    if (phase !== 'play') return;
    playTap();
    const next = (stRef.current.colorIdx + 1) % RUN_COLORS.length;
    stRef.current.colorIdx = next;
    setColorIdx(next);
  };

  const handleTap = () => {
    if (phase === 'ready') { startGame(); return; }
    if (phase === 'play') { switchColor(); return; }
    resetGame();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Renk Koşusu</Text>
      <Text style={styles.sub}>Skor: {score} / {config.target}</Text>

      <TouchableOpacity style={styles.gameArea} onPress={handleTap} activeOpacity={1}>
        {/* Obstacles - color gates */}
        {obstacles.map(o => (
          <View key={o.id} style={[styles.gate, { top: o.y }]}>
            <View style={[styles.gateBar, { backgroundColor: RUN_COLORS[o.gateColor] }]} />
            <Text style={[styles.gateText, { color: RUN_COLORS[o.gateColor] }]}>
              {['Kırmızı', 'Mavi', 'Yeşil', 'Sarı'][o.gateColor]}
            </Text>
          </View>
        ))}

        {/* Runner */}
        <View style={[styles.runner, {
          top: runnerY,
          left: GAME_W / 2 - RUNNER_SIZE / 2,
          backgroundColor: RUN_COLORS[colorIdx],
        }]} />

        {/* Color indicator */}
        <View style={styles.colorRow}>
          {RUN_COLORS.map((c, i) => (
            <View key={i} style={[styles.colorDot, {
              backgroundColor: c,
              opacity: i === colorIdx ? 1 : 0.3,
              transform: [{ scale: i === colorIdx ? 1.3 : 1 }],
            }]} />
          ))}
        </View>

        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Renk Koşusu</Text>
            <Text style={styles.overlayHint}>Dokunarak renk değiştir, kapılardan geç!</Text>
          </View>
        )}
        {(phase === 'dead' || phase === 'win') && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>{phase === 'win' ? 'Harika!' : `Skor: ${score}`}</Text>
            <Text style={styles.overlayHint}>Tekrar oynamak için dokun</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 20, margin: 10, backgroundColor: COLORS.surface },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '900', marginBottom: 2 },
  sub: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 8 },
  gameArea: { width: GAME_W, height: GAME_H, backgroundColor: '#0a0a18', borderRadius: 12, overflow: 'hidden', position: 'relative' },
  gate: { position: 'absolute', left: 0, width: GAME_W, height: OBSTACLE_H, justifyContent: 'center', alignItems: 'center' },
  gateBar: { position: 'absolute', width: '100%', height: 3, top: OBSTACLE_H / 2 },
  gateText: { fontSize: 14, fontWeight: '800' },
  runner: { position: 'absolute', width: RUNNER_SIZE, height: RUNNER_SIZE, borderRadius: RUNNER_SIZE / 2 },
  colorRow: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  overlayText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  overlayHint: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
});
