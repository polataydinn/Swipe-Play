import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 40, 340);
const GAME_H = Math.min(SH * 0.5, 380);
const SHIP_SIZE = 20;

const DIFFICULTY_CONFIG = {
  0: { asteroidSpeed: 1, spawnRate: 80, target: 15 },
  1: { asteroidSpeed: 1.5, spawnRate: 55, target: 25 },
  2: { asteroidSpeed: 2, spawnRate: 40, target: 40 },
};

export default function AsteroidBlast({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [phase, setPhase] = useState('ready');
  const [ship, setShip] = useState({ x: GAME_W / 2, y: GAME_H / 2 });
  const [asteroids, setAsteroids] = useState([]);
  const [bullets, setBullets] = useState([]);
  const [score, setScore] = useState(0);

  const stRef = useRef({
    sx: GAME_W / 2, sy: GAME_H / 2,
    asteroids: [], bullets: [], score: 0, frame: 0, phase: 'ready',
  });
  const frameRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (onLockSwipe) onLockSwipe();
    return () => { if (onUnlockSwipe) onUnlockSwipe(); };
  }, []);

  const resetGame = () => {
    stRef.current = {
      sx: GAME_W / 2, sy: GAME_H / 2,
      asteroids: [], bullets: [], score: 0, frame: 0, phase: 'ready',
    };
    setShip({ x: GAME_W / 2, y: GAME_H / 2 });
    setAsteroids([]);
    setBullets([]);
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

  const spawnAsteroid = () => {
    const side = Math.floor(Math.random() * 4);
    let x, y, dx, dy;
    const speed = config.asteroidSpeed;
    const size = 16 + Math.random() * 20;
    if (side === 0) { x = Math.random() * GAME_W; y = -size; dx = (Math.random() - 0.5) * speed; dy = speed; }
    else if (side === 1) { x = Math.random() * GAME_W; y = GAME_H + size; dx = (Math.random() - 0.5) * speed; dy = -speed; }
    else if (side === 2) { x = -size; y = Math.random() * GAME_H; dx = speed; dy = (Math.random() - 0.5) * speed; }
    else { x = GAME_W + size; y = Math.random() * GAME_H; dx = -speed; dy = (Math.random() - 0.5) * speed; }
    return { x, y, dx, dy, size, id: Date.now() + Math.random() };
  };

  const gameLoop = () => {
    if (!isMountedRef.current) return;
    const s = stRef.current;
    if (s.phase !== 'play') return;
    s.frame++;

    // Move asteroids
    s.asteroids = s.asteroids.map(a => ({ ...a, x: a.x + a.dx, y: a.y + a.dy }))
      .filter(a => a.x > -50 && a.x < GAME_W + 50 && a.y > -50 && a.y < GAME_H + 50);

    // Move bullets
    s.bullets = s.bullets.map(b => ({ ...b, x: b.x + b.dx * 6, y: b.y + b.dy * 6 }))
      .filter(b => b.x > -10 && b.x < GAME_W + 10 && b.y > -10 && b.y < GAME_H + 10);

    // Spawn
    if (s.frame % config.spawnRate === 0) {
      s.asteroids.push(spawnAsteroid());
    }

    // Bullet-asteroid collision
    const hitAsteroids = new Set();
    const hitBullets = new Set();
    for (let ai = 0; ai < s.asteroids.length; ai++) {
      const a = s.asteroids[ai];
      for (let bi = 0; bi < s.bullets.length; bi++) {
        const b = s.bullets[bi];
        const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        if (dist < a.size / 2 + 4) {
          hitAsteroids.add(ai);
          hitBullets.add(bi);
          s.score++;
        }
      }
    }
    s.asteroids = s.asteroids.filter((_, i) => !hitAsteroids.has(i));
    s.bullets = s.bullets.filter((_, i) => !hitBullets.has(i));

    // Ship-asteroid collision
    for (const a of s.asteroids) {
      const dist = Math.sqrt((a.x - s.sx) ** 2 + (a.y - s.sy) ** 2);
      if (dist < a.size / 2 + SHIP_SIZE / 2) {
        s.phase = 'dead';
        setPhase('dead');
        setScore(s.score);
        if (s.score >= config.target) onCorrect(); else onWrong();
        return;
      }
    }

    setAsteroids([...s.asteroids]);
    setBullets([...s.bullets]);
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

  const handleTap = (evt) => {
    if (phase === 'ready') { startGame(); return; }
    if (phase !== 'play') { resetGame(); return; }
    playTap();

    const { locationX, locationY } = evt.nativeEvent;
    const dx = locationX - stRef.current.sx;
    const dy = locationY - stRef.current.sy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    stRef.current.bullets.push({
      x: stRef.current.sx, y: stRef.current.sy,
      dx: dx / len, dy: dy / len,
      id: Date.now() + Math.random(),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Asteroid</Text>
      <Text style={styles.sub}>Skor: {score} / {config.target}</Text>

      <TouchableOpacity style={styles.gameArea} onPress={handleTap} activeOpacity={1}>
        {asteroids.map(a => (
          <View key={a.id} style={[styles.asteroid, {
            left: a.x - a.size / 2, top: a.y - a.size / 2,
            width: a.size, height: a.size, borderRadius: a.size / 2,
          }]} />
        ))}
        {bullets.map(b => (
          <View key={b.id} style={[styles.bullet, { left: b.x - 3, top: b.y - 3 }]} />
        ))}
        <View style={[styles.ship, { left: ship.x - SHIP_SIZE / 2, top: ship.y - SHIP_SIZE / 2 }]} />

        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Asteroid</Text>
            <Text style={styles.overlayHint}>Dokunarak ateş et!</Text>
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
  gameArea: { width: GAME_W, height: GAME_H, backgroundColor: '#050510', borderRadius: 12, overflow: 'hidden', position: 'relative' },
  ship: { position: 'absolute', width: SHIP_SIZE, height: SHIP_SIZE, backgroundColor: '#3b82f6', borderRadius: 4, transform: [{ rotate: '45deg' }] },
  asteroid: { position: 'absolute', backgroundColor: '#6b7280', borderWidth: 2, borderColor: '#9ca3af' },
  bullet: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#facc15' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  overlayText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  overlayHint: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 8 },
});
