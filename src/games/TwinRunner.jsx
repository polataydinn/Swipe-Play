import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 16, 360);
const GAME_H = Math.min(SH * 0.68, 520);
const LANE_H = GAME_H / 2;
const CHAR_SIZE = 32;
const GRAVITY = 0.6;
const JUMP_VY = -10;
const CHAR_X = 70;
const FLOOR_OFFSET = 40; // distance from bottom of lane to floor

const DIFFICULTY_CONFIG = {
  0: { duration: 35, obstacleSpeed: 3, spawnMs: 2000, gapMin: 60 },
  1: { duration: 30, obstacleSpeed: 4, spawnMs: 1500, gapMin: 50 },
  2: { duration: 25, obstacleSpeed: 5.5, spawnMs: 1000, gapMin: 40 },
};

function makeObstacle(laneIdx) {
  const minH = 24;
  const maxH = LANE_H - FLOOR_OFFSET - 20;
  const h = minH + Math.random() * (maxH - minH);
  const w = 20 + Math.random() * 18;
  const floorY = LANE_H - FLOOR_OFFSET - CHAR_SIZE;
  const y = floorY - h + CHAR_SIZE; // obstacle sits on the same "ground"
  return {
    id: Date.now() + Math.random() + laneIdx,
    x: GAME_W + 20,
    y,
    w,
    h,
    lane: laneIdx,
  };
}

export default function TwinRunner({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const [phase, setPhase] = useState('ready');
  const [renderState, setRenderState] = useState(null);

  const stRef = useRef(null);
  const frameRef = useRef(null);
  const spawnTimerRef = useRef(null);
  const countTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  const floorY = LANE_H - FLOOR_OFFSET - CHAR_SIZE; // character y when on ground

  const initState = () => ({
    phase: 'ready',
    topChar: { y: floorY, vy: 0, onGround: true },
    botChar: { y: floorY, vy: 0, onGround: true },
    obstacles: [],
    timeLeft: config.duration,
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

    // Countdown timer
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

    // Obstacle spawner
    spawnTimerRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      // Spawn for top lane
      if (Math.random() < 0.7) s.obstacles.push(makeObstacle(0));
      // Spawn for bottom lane
      if (Math.random() < 0.7) s.obstacles.push(makeObstacle(1));
    }, config.spawnMs);

    frameRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = () => {
    if (!isMountedRef.current) return;
    const s = stRef.current;
    if (s.phase !== 'play') return;

    // Update top character
    updateChar(s.topChar);
    // Update bottom character
    updateChar(s.botChar);

    // Move obstacles
    s.obstacles = s.obstacles
      .map(o => ({ ...o, x: o.x - config.obstacleSpeed }))
      .filter(o => o.x + o.w > -10);

    // Collision detection
    const topDead = checkCollision(s.topChar, s.obstacles, 0);
    const botDead = checkCollision(s.botChar, s.obstacles, 1);

    if (topDead || botDead) {
      s.phase = 'dead';
      clearInterval(spawnTimerRef.current);
      clearInterval(countTimerRef.current);
      setPhase('dead');
      setRenderState({ ...s });
      playWrong();
      onWrong();
      return;
    }

    setRenderState({
      topChar: { ...s.topChar },
      botChar: { ...s.botChar },
      obstacles: [...s.obstacles],
      timeLeft: s.timeLeft,
      phase: s.phase,
    });

    frameRef.current = requestAnimationFrame(gameLoop);
  };

  const updateChar = (char) => {
    char.vy += GRAVITY;
    char.y += char.vy;
    if (char.y >= floorY) {
      char.y = floorY;
      char.vy = 0;
      char.onGround = true;
    } else {
      char.onGround = false;
    }
  };

  const checkCollision = (char, obstacles, laneIdx) => {
    const cx = CHAR_X;
    const cy = char.y;
    for (const o of obstacles) {
      if (o.lane !== laneIdx) continue;
      if (
        cx + CHAR_SIZE > o.x + 4 &&
        cx < o.x + o.w - 4 &&
        cy + CHAR_SIZE > o.y + 4 &&
        cy < o.y + o.h - 4
      ) {
        return true;
      }
    }
    return false;
  };

  const jumpTop = () => {
    if (stRef.current.phase !== 'play') return;
    playTap();
    if (stRef.current.topChar.onGround) {
      stRef.current.topChar.vy = JUMP_VY;
      stRef.current.topChar.onGround = false;
    }
  };

  const jumpBot = () => {
    if (stRef.current.phase !== 'play') return;
    playTap();
    if (stRef.current.botChar.onGround) {
      stRef.current.botChar.vy = JUMP_VY;
      stRef.current.botChar.onGround = false;
    }
  };

  const rs = renderState || initState();

  const topObstacles = (rs.obstacles || []).filter(o => o.lane === 0);
  const botObstacles = (rs.obstacles || []).filter(o => o.lane === 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>İkiz Koşucu</Text>
      <Text style={styles.sub}>Süre: {Math.ceil(rs.timeLeft || config.duration)}s</Text>

      <View style={styles.gameArea}>
        {/* TOP LANE */}
        <TouchableOpacity
          style={styles.topLane}
          onPress={jumpTop}
          activeOpacity={1}
        >
          {/* Ground bar */}
          <View style={styles.topGround} />
          {/* Top character */}
          <Text style={[styles.charEmoji, { left: CHAR_X, top: rs.topChar.y }]}>🏃</Text>
          {/* Top obstacles */}
          {topObstacles.map(o => (
            <View
              key={o.id}
              style={[styles.obstacle, {
                left: o.x, top: o.y,
                width: o.w, height: o.h,
                backgroundColor: '#ef4444',
              }]}
            />
          ))}
          <Text style={styles.laneHint}>↑ Üst</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* BOTTOM LANE */}
        <TouchableOpacity
          style={styles.botLane}
          onPress={jumpBot}
          activeOpacity={1}
        >
          {/* Ground bar */}
          <View style={styles.botGround} />
          {/* Bottom character */}
          <Text style={[styles.charEmoji, { left: CHAR_X, top: rs.botChar.y }]}>🏃</Text>
          {/* Bottom obstacles */}
          {botObstacles.map(o => (
            <View
              key={o.id}
              style={[styles.obstacle, {
                left: o.x, top: o.y,
                width: o.w, height: o.h,
                backgroundColor: '#f59e0b',
              }]}
            />
          ))}
          <Text style={styles.laneHint}>↓ Alt</Text>
        </TouchableOpacity>

        {/* Overlays */}
        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>İkiz Koşucu</Text>
            <Text style={styles.overlayDesc}>Üste dokun → üst zıplar{'\n'}Alta dokun → alt zıplar</Text>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startBtnText}>BAŞLA</Text>
            </TouchableOpacity>
          </View>
        )}
        {phase === 'win' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Tebrikler! 🎉</Text>
            <Text style={styles.overlayDesc}>İkisini de kurtardın!</Text>
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
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  topLane: {
    width: GAME_W,
    height: LANE_H,
    backgroundColor: '#0d1b3e',
    position: 'relative',
    overflow: 'hidden',
  },
  botLane: {
    width: GAME_W,
    height: LANE_H,
    backgroundColor: '#0d2b1a',
    position: 'relative',
    overflow: 'hidden',
  },
  divider: {
    width: GAME_W,
    height: 3,
    backgroundColor: '#ffffff30',
  },
  topGround: {
    position: 'absolute',
    bottom: FLOOR_OFFSET - CHAR_SIZE,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#6366f1',
  },
  botGround: {
    position: 'absolute',
    bottom: FLOOR_OFFSET - CHAR_SIZE,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#22c55e',
  },
  charEmoji: {
    position: 'absolute',
    fontSize: CHAR_SIZE - 4,
    lineHeight: CHAR_SIZE,
  },
  obstacle: {
    position: 'absolute',
    borderRadius: 4,
  },
  laneHint: {
    position: 'absolute',
    top: 6,
    right: 10,
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    fontWeight: '700',
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
    backgroundColor: '#6366f1',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
