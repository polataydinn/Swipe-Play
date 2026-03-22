import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 40, 340);
const GAME_H = Math.min(SH * 0.55, 420);
const PLAYER_W = 24;
const PLAYER_H = 24;
const PLAT_W = 55;
const PLAT_H = 10;
const GRAVITY = 0.3;
const JUMP_VEL = -8;
const BOOST_VEL = -11;
const BOOST_DURATION = 5; // bounces with boost
// Max reachable height per jump ≈ vel^2/(2*gravity) = 64/0.6 ≈ 107px
// Keep gap well under that
const MAX_GAP = 85;
const MIN_GAP = 55;
const STAR_SIZE = 18;

function generatePlatforms(count) {
  const plats = [{ x: GAME_W / 2 - PLAT_W / 2, y: GAME_H - 40, spring: false }];
  let lastY = GAME_H - 40;
  for (let i = 1; i < count; i++) {
    const gap = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
    plats.push({
      x: Math.random() * (GAME_W - PLAT_W),
      y: lastY - gap,
      spring: false,
    });
    lastY -= gap;
  }
  return plats;
}

export default function DoodleJump({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const [phase, setPhase] = useState('ready');
  const [playerPos, setPlayerPos] = useState({ x: GAME_W / 2 - PLAYER_W / 2, y: GAME_H - 70 });
  const [platforms, setPlatforms] = useState([]);
  const [stars, setStars] = useState([]);
  const [score, setScore] = useState(0);
  const [boosts, setBoosts] = useState(0);

  const stRef = useRef({
    px: GAME_W / 2 - PLAYER_W / 2, py: GAME_H - 70,
    vy: 0, platforms: [], stars: [], score: 0,
    phase: 'ready', moveDir: 0, boosts: 0,
  });
  const frameRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (onLockSwipe) onLockSwipe();
    return () => { if (onUnlockSwipe) onUnlockSwipe(); };
  }, []);

  const resetGame = () => {
    const plats = generatePlatforms(8);
    stRef.current = {
      px: GAME_W / 2 - PLAYER_W / 2, py: GAME_H - 70,
      vy: JUMP_VEL, platforms: plats, stars: [], score: 0,
      phase: 'ready', moveDir: 0, boosts: 0,
    };
    setPlayerPos({ x: GAME_W / 2 - PLAYER_W / 2, y: GAME_H - 70 });
    setPlatforms(plats);
    setStars([]);
    setScore(0);
    setBoosts(0);
    setPhase('ready');
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  };

  useEffect(() => { resetGame(); }, [difficulty]);

  const startGame = () => {
    stRef.current.vy = JUMP_VEL;
    stRef.current.phase = 'play';
    setPhase('play');
    gameLoop();
  };

  const spawnStar = (platX, platY) => ({
    x: platX + PLAT_W / 2 - STAR_SIZE / 2,
    y: platY - STAR_SIZE - 4,
    id: Date.now() + Math.random(),
  });

  const gameLoop = () => {
    if (!isMountedRef.current) return;
    const s = stRef.current;
    if (s.phase !== 'play') return;

    s.vy += GRAVITY;
    s.py += s.vy;
    s.px += s.moveDir * 4;

    // Wrap horizontal
    if (s.px < -PLAYER_W) s.px = GAME_W;
    if (s.px > GAME_W) s.px = -PLAYER_W;

    // Scroll up when player reaches upper third
    if (s.py < GAME_H * 0.35 && s.vy < 0) {
      const shift = GAME_H * 0.35 - s.py;
      s.py = GAME_H * 0.35;
      for (const p of s.platforms) p.y += shift;
      for (const st of s.stars) st.y += shift;
      s.score += Math.floor(shift);

      // Remove off-screen platforms and add new ones
      s.platforms = s.platforms.filter(p => p.y < GAME_H + 20);
      s.stars = s.stars.filter(st => st.y < GAME_H + 20);

      while (s.platforms.length < 8) {
        const topY = Math.min(...s.platforms.map(p => p.y));
        const gap = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
        const newX = Math.random() * (GAME_W - PLAT_W);
        const newY = topY - gap;
        s.platforms.push({ x: newX, y: newY, spring: false });
        // 20% chance to put a star on platform
        if (Math.random() < 0.2) {
          s.stars.push(spawnStar(newX, newY));
        }
      }
    }

    // Platform collision (only when falling)
    if (s.vy > 0) {
      for (const p of s.platforms) {
        if (s.px + PLAYER_W > p.x && s.px < p.x + PLAT_W &&
            s.py + PLAYER_H >= p.y && s.py + PLAYER_H <= p.y + PLAT_H + s.vy + 2) {
          const jumpVel = s.boosts > 0 ? BOOST_VEL : JUMP_VEL;
          s.vy = jumpVel;
          s.py = p.y - PLAYER_H;
          if (s.boosts > 0) {
            s.boosts--;
            setBoosts(s.boosts);
          }
          playTap();
          break;
        }
      }
    }

    // Star collection
    for (const st of s.stars) {
      if (s.px + PLAYER_W > st.x && s.px < st.x + STAR_SIZE &&
          s.py + PLAYER_H > st.y && s.py < st.y + STAR_SIZE) {
        s.boosts += BOOST_DURATION;
        setBoosts(s.boosts);
        st.collected = true;
        playTap();
      }
    }
    s.stars = s.stars.filter(st => !st.collected);

    // Fall off screen
    if (s.py > GAME_H + 20) {
      s.phase = 'dead';
      setPhase('dead');
      setScore(Math.floor(s.score / 10));
      onWrong();
      return;
    }

    setPlayerPos({ x: s.px, y: s.py });
    setPlatforms([...s.platforms]);
    setStars([...s.stars]);
    setScore(Math.floor(s.score / 10));

    frameRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const handleLeft = () => { stRef.current.moveDir = -1; };
  const handleRight = () => { stRef.current.moveDir = 1; };
  const handleStopMove = () => { stRef.current.moveDir = 0; };

  const handleTap = () => {
    if (phase === 'ready') { startGame(); return; }
    if (phase === 'dead') { resetGame(); return; }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zıpla!</Text>
      <View style={styles.headerRow}>
        <Text style={styles.sub}>Skor: {score}</Text>
        {boosts > 0 && <Text style={styles.boostBadge}>⚡ x{boosts}</Text>}
      </View>

      <TouchableOpacity style={styles.gameArea} onPress={handleTap} activeOpacity={1}>
        {platforms.map((p, i) => (
          <View key={i} style={[styles.platform, { left: p.x, top: p.y }]} />
        ))}
        {stars.map((st) => (
          <View key={st.id} style={[styles.star, { left: st.x, top: st.y }]}>
            <Text style={styles.starText}>⚡</Text>
          </View>
        ))}
        <View style={[styles.player, { left: playerPos.x, top: playerPos.y, backgroundColor: boosts > 0 ? '#facc15' : '#3b82f6' }]} />

        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Zıpla!</Text>
            <Text style={styles.overlayHint}>⚡ yakala → güçlü zıplama!</Text>
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
          <TouchableOpacity style={styles.dirBtn} onPressIn={handleLeft} onPressOut={handleStopMove}>
            <Text style={styles.dirText}>◀</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dirBtn} onPressIn={handleRight} onPressOut={handleStopMove}>
            <Text style={styles.dirText}>▶</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 20, margin: 10, backgroundColor: COLORS.surface },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '900', marginBottom: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  sub: { color: COLORS.textSecondary, fontSize: 14 },
  boostBadge: { color: '#facc15', fontSize: 13, fontWeight: '700', backgroundColor: 'rgba(250,204,21,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  gameArea: { width: GAME_W, height: GAME_H, backgroundColor: '#0a1628', borderRadius: 12, overflow: 'hidden', position: 'relative' },
  platform: { position: 'absolute', width: PLAT_W, height: PLAT_H, backgroundColor: '#22c55e', borderRadius: 5 },
  player: { position: 'absolute', width: PLAYER_W, height: PLAYER_H, borderRadius: 6 },
  star: { position: 'absolute', width: STAR_SIZE, height: STAR_SIZE, justifyContent: 'center', alignItems: 'center' },
  starText: { fontSize: 15 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  overlayText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  overlayHint: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 },
  controls: { flexDirection: 'row', gap: 40, marginTop: 12 },
  dirBtn: { width: 70, height: 50, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dirText: { color: COLORS.text, fontSize: 24 },
});
