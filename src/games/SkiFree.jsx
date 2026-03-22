import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 40, 340);
const GAME_H = Math.min(SH * 0.55, 420);
const SKIER_W = 20;
const SKIER_H = 24;

const HARD_CONFIG = { speed: 4.5, obstacleRate: 28 };

const OBSTACLE_TYPES = [
  { emoji: '🌲', w: 22, h: 26 },
  { emoji: '🪨', w: 20, h: 18 },
  { emoji: '⛷️', w: 18, h: 20 },
];

export default function SkiFree({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = HARD_CONFIG;
  const [phase, setPhase] = useState('ready');
  const [skierX, setSkierX] = useState(GAME_W / 2);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);

  const stRef = useRef({
    sx: GAME_W / 2, obstacles: [], score: 0, frame: 0, phase: 'ready', moveDir: 0,
  });
  const frameRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (onLockSwipe) onLockSwipe();
    return () => { if (onUnlockSwipe) onUnlockSwipe(); };
  }, []);

  const resetGame = () => {
    stRef.current = { sx: GAME_W / 2, obstacles: [], score: 0, frame: 0, phase: 'ready', moveDir: 0 };
    setSkierX(GAME_W / 2);
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

    // Move skier
    s.sx += s.moveDir * 3.5;
    s.sx = Math.max(SKIER_W / 2, Math.min(GAME_W - SKIER_W / 2, s.sx));

    // Move obstacles up (skier moving down the mountain)
    s.obstacles = s.obstacles.map(o => ({ ...o, y: o.y - config.speed }))
      .filter(o => o.y > -40);

    // Spawn obstacles
    if (s.frame % config.obstacleRate === 0) {
      const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
      s.obstacles.push({
        x: Math.random() * (GAME_W - 30) + 15,
        y: GAME_H + 20,
        ...type,
        id: s.frame,
      });
    }

    // Score: every 30 frames survived
    if (s.frame % 30 === 0) s.score++;

    // Collision check
    const skierTop = 60;
    const skierBottom = skierTop + SKIER_H;
    const skierLeft = s.sx - SKIER_W / 2;
    const skierRight = s.sx + SKIER_W / 2;

    for (const o of s.obstacles) {
      if (skierRight > o.x - o.w / 2 + 4 && skierLeft < o.x + o.w / 2 - 4 &&
          skierBottom > o.y - o.h / 2 + 4 && skierTop < o.y + o.h / 2 - 4) {
        s.phase = 'dead';
        setPhase('dead');
        setScore(s.score);
        onWrong();
        return;
      }
    }

    setSkierX(s.sx);
    setObstacles([...s.obstacles]);
    setScore(s.score);

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
    if (phase !== 'play') { resetGame(); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kayak</Text>
      <Text style={styles.sub}>Skor: {score}</Text>

      <TouchableOpacity style={styles.gameArea} onPress={handleTap} activeOpacity={1}>
        {/* Snow lines for motion effect */}
        {[0.2, 0.5, 0.8].map((p, i) => (
          <View key={i} style={[styles.snowLine, { left: `${p * 100}%`, top: (stRef.current.frame * config.speed * 2 + i * 140) % (GAME_H + 40) - 20 }]} />
        ))}

        {obstacles.map(o => (
          <Text key={o.id} style={[styles.obstacle, { left: o.x - o.w / 2, top: o.y - o.h / 2, fontSize: o.w }]}>
            {o.emoji}
          </Text>
        ))}

        {/* Skier */}
        <Text style={[styles.skier, { left: skierX - 12, top: 60 }]}>⛷️</Text>

        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Kayak!</Text>
            <Text style={styles.overlayHint}>Engelleri atlatarak kayağa devam et</Text>
          </View>
        )}
        {phase === 'dead' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Skor: {score}</Text>
            <Text style={styles.overlayHint}>Tekrar oynamak için dokun</Text>
          </View>
        )}
      </TouchableOpacity>

      {phase === 'play' && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.dirBtn} onPressIn={() => { stRef.current.moveDir = -1; }} onPressOut={() => { stRef.current.moveDir = 0; }}>
            <Text style={styles.dirText}>◀ Sol</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dirBtn} onPressIn={() => { stRef.current.moveDir = 1; }} onPressOut={() => { stRef.current.moveDir = 0; }}>
            <Text style={styles.dirText}>Sağ ▶</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 20, margin: 10, backgroundColor: COLORS.surface },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '900', marginBottom: 2 },
  sub: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 8 },
  gameArea: { width: GAME_W, height: GAME_H, backgroundColor: '#e8f0fe', borderRadius: 12, overflow: 'hidden', position: 'relative' },
  snowLine: { position: 'absolute', width: 2, height: 15, backgroundColor: 'rgba(180,200,230,0.5)', borderRadius: 1 },
  obstacle: { position: 'absolute' },
  skier: { position: 'absolute', fontSize: 24 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  overlayText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  overlayHint: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8, textAlign: 'center' },
  controls: { flexDirection: 'row', gap: 30, marginTop: 12 },
  dirBtn: { paddingHorizontal: 28, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12 },
  dirText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
});
