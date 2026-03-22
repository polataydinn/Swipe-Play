import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 16, 360);
const GAME_H = Math.min(SH * 0.68, 520);
const CHAR_X = 80;
const CHAR_W = 36;
const CHAR_H = 36;
const GRAVITY = 0.55;
const JUMP_VY = -11;
const GROUND_Y_RATIO = 0.75;

const DIFFICULTY_CONFIG = {
  0: { duration: 35, obstacleSpeed: 3.5, spawnMs: 2200, flyChance: 0.2 },
  1: { duration: 30, obstacleSpeed: 5,   spawnMs: 1600, flyChance: 0.35 },
  2: { duration: 25, obstacleSpeed: 7,   spawnMs: 1100, flyChance: 0.5 },
};

export default function BikeJump({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const GROUND_Y = GAME_H * GROUND_Y_RATIO;

  const [phase, setPhase] = useState('ready');
  const [renderState, setRenderState] = useState(null);

  const stRef = useRef(null);
  const frameRef = useRef(null);
  const spawnTimerRef = useRef(null);
  const countTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  const initState = () => ({
    phase: 'ready',
    char: {
      y: GROUND_Y - CHAR_H,
      vy: 0,
      onGround: true,
      jumpsLeft: 2,
    },
    obstacles: [],
    timeLeft: config.duration,
    nextId: 0,
    bgOffset: 0,
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

  const spawnObstacle = (s) => {
    const isFly = Math.random() < config.flyChance;
    const id = s.nextId++;
    if (isFly) {
      // Flying bird at mid height
      s.obstacles.push({
        id,
        x: GAME_W + 20,
        y: GROUND_Y - 120,
        w: 34,
        h: 30,
        type: 'fly',
        emoji: '🦅',
      });
    } else {
      // Ground block
      s.obstacles.push({
        id,
        x: GAME_W + 20,
        y: GROUND_Y - 40,
        w: 30,
        h: 40,
        type: 'ground',
      });
    }
  };

  const startGame = () => {
    if (onLockSwipe) onLockSwipe();
    stRef.current.phase = 'play';
    setPhase('play');

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

    spawnTimerRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      spawnObstacle(s);
    }, config.spawnMs);

    frameRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = () => {
    if (!isMountedRef.current) return;
    const s = stRef.current;
    if (s.phase !== 'play') return;

    // Update character physics
    const ch = s.char;
    ch.vy += GRAVITY;
    ch.y += ch.vy;

    if (ch.y >= GROUND_Y - CHAR_H) {
      ch.y = GROUND_Y - CHAR_H;
      ch.vy = 0;
      ch.onGround = true;
      ch.jumpsLeft = 2;
    } else {
      ch.onGround = false;
    }

    // Move obstacles
    s.obstacles = s.obstacles
      .map(o => ({ ...o, x: o.x - config.obstacleSpeed }))
      .filter(o => o.x + o.w > -20);

    // Background scroll
    s.bgOffset = (s.bgOffset + config.obstacleSpeed * 0.5) % GAME_W;

    // Collision (AABB with 8px margin)
    const margin = 8;
    const charRight = CHAR_X + CHAR_W - margin;
    const charLeft = CHAR_X + margin;
    const charTop = ch.y + margin;
    const charBottom = ch.y + CHAR_H - margin;

    for (const o of s.obstacles) {
      if (
        charRight > o.x + margin &&
        charLeft < o.x + o.w - margin &&
        charBottom > o.y + margin &&
        charTop < o.y + o.h - margin
      ) {
        s.phase = 'dead';
        clearInterval(spawnTimerRef.current);
        clearInterval(countTimerRef.current);
        setPhase('dead');
        setRenderState({ char: { ...s.char }, obstacles: [...s.obstacles], timeLeft: s.timeLeft, phase: 'dead', bgOffset: s.bgOffset });
        playWrong();
        onWrong();
        return;
      }
    }

    setRenderState({
      char: { ...s.char },
      obstacles: [...s.obstacles],
      timeLeft: s.timeLeft,
      phase: s.phase,
      bgOffset: s.bgOffset,
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

  const handleTap = () => {
    if (phase === 'ready') { startGame(); return; }
    if (phase !== 'play') { resetGame(); return; }
    playTap();
    const ch = stRef.current.char;
    if (ch.jumpsLeft > 0) {
      ch.vy = JUMP_VY;
      ch.onGround = false;
      ch.jumpsLeft -= 1;
    }
  };

  const rs = renderState || initState();
  const GROUND_Y_RENDER = GAME_H * GROUND_Y_RATIO;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bisikletçi</Text>
      <Text style={styles.sub}>Süre: {Math.ceil(rs.timeLeft || config.duration)}s</Text>

      <TouchableOpacity style={styles.gameArea} onPress={handleTap} activeOpacity={1}>
        {/* Sky background parallax strips */}
        <View style={[styles.bgStrip1, { left: -(rs.bgOffset || 0) }]} />
        <View style={[styles.bgStrip1, { left: GAME_W - (rs.bgOffset || 0) }]} />

        {/* Ground */}
        <View style={[styles.ground, { top: GROUND_Y_RENDER }]} />

        {/* Ground detail lines (parallax) */}
        {[0, 60, 120, 180, 240, 300, 360].map((x, i) => (
          <View
            key={i}
            style={[styles.groundLine, {
              top: GROUND_Y_RENDER + 4,
              left: ((x - (rs.bgOffset || 0) * 1.2) % (GAME_W + 60) + GAME_W + 60) % (GAME_W + 60) - 30,
            }]}
          />
        ))}

        {/* Character */}
        <Text style={[styles.charEmoji, {
          left: CHAR_X,
          top: rs.char ? rs.char.y : GROUND_Y_RENDER - CHAR_H,
        }]}>🚴</Text>

        {/* Obstacles */}
        {(rs.obstacles || []).map(o => (
          o.type === 'fly'
            ? <Text key={o.id} style={[styles.flyEmoji, { left: o.x, top: o.y }]}>{o.emoji}</Text>
            : <View key={o.id} style={[styles.groundBlock, {
                left: o.x, top: o.y,
                width: o.w, height: o.h,
              }]} />
        ))}

        {/* Jump indicator */}
        {phase === 'play' && rs.char && rs.char.jumpsLeft > 0 && (
          <View style={styles.jumpDots}>
            {Array.from({ length: rs.char.jumpsLeft }).map((_, i) => (
              <View key={i} style={styles.jumpDot} />
            ))}
          </View>
        )}

        {/* Overlays */}
        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Bisikletçi</Text>
            <Text style={styles.overlayDesc}>Dokunarak zıpla!{'\n'}Çift zıplama yapabilirsin.</Text>
            <View style={styles.startBtn}>
              <Text style={styles.startBtnText}>BAŞLA</Text>
            </View>
          </View>
        )}
        {phase === 'win' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Tebrikler! 🎉</Text>
            <Text style={styles.overlayDesc}>Bitişe ulaştın!</Text>
            <View style={styles.startBtn}>
              <Text style={styles.startBtnText}>TEKRAR</Text>
            </View>
          </View>
        )}
        {phase === 'dead' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Düştü! 💥</Text>
            <Text style={styles.overlayDesc}>Kalan süre: {Math.ceil(rs.timeLeft)}s</Text>
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
    backgroundColor: '#0c1a2e',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  bgStrip1: {
    position: 'absolute',
    top: 0,
    width: GAME_W,
    height: GAME_H,
    backgroundColor: 'transparent',
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: GAME_H,
    backgroundColor: '#1a3a1a',
  },
  groundLine: {
    position: 'absolute',
    width: 30,
    height: 2,
    backgroundColor: '#2a5a2a',
    borderRadius: 1,
  },
  charEmoji: {
    position: 'absolute',
    fontSize: 30,
    lineHeight: CHAR_H,
    width: CHAR_W,
    textAlign: 'center',
  },
  flyEmoji: {
    position: 'absolute',
    fontSize: 28,
    lineHeight: 30,
    width: 34,
    textAlign: 'center',
  },
  groundBlock: {
    position: 'absolute',
    backgroundColor: '#92400e',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#b45309',
  },
  jumpDots: {
    position: 'absolute',
    top: 10,
    left: CHAR_X,
    flexDirection: 'row',
    gap: 4,
  },
  jumpDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
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
    backgroundColor: '#22c55e',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
