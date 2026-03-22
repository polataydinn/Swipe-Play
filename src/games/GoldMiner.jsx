import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 20, 380);
const GAME_H = Math.min(SH * 0.62, 460);

const MINER_Y = 36;
const MINER_X = GAME_W / 2;
const ROPE_SPEED = 4.5;
const PULL_SPEED = 3.5;
const SWING_SPEED = 0.022; // radians per frame

const MINERALS = [
  { type: 'rock',    emoji: '🪨', color: '#6b7280', value: 5,   size: 28, weight: 1.0 },
  { type: 'gold',    emoji: '🟡', color: '#f59e0b', value: 40,  size: 32, weight: 0.7 },
  { type: 'diamond', emoji: '💎', color: '#38bdf8', value: 120, size: 26, weight: 0.5 },
  { type: 'ruby',    emoji: '🔴', color: '#ef4444', value: 80,  size: 24, weight: 0.6 },
];

const DIFFICULTY_CONFIG = {
  0: { targetScore: 200, mineralCount: 8, duration: 60 },
  1: { targetScore: 400, mineralCount: 10, duration: 50 },
  2: { targetScore: 700, mineralCount: 12, duration: 45 },
};

let _mid = 0;
const mid = () => ++_mid;

function spawnMinerals(count) {
  const minerals = [];
  const gridRows = 4;
  const gridCols = Math.ceil(count / gridRows);
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / gridCols);
    const col = i % gridCols;
    const type = MINERALS[Math.floor(Math.random() * MINERALS.length)];
    const x = 30 + (col * (GAME_W - 60) / (gridCols - 1 || 1)) + (Math.random() - 0.5) * 25;
    const y = MINER_Y + 90 + row * ((GAME_H - MINER_Y - 120) / (gridRows - 1 || 1)) + (Math.random() - 0.5) * 20;
    minerals.push({ ...type, x: Math.max(20, Math.min(GAME_W - 20, x)), y, id: mid(), grabbed: false });
  }
  return minerals;
}

export default function GoldMiner({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const [phase, setPhase] = useState('ready');
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(cfg.duration);
  const [minerals, setMinerals] = useState([]);
  // hook state
  const [hookX, setHookX] = useState(MINER_X);
  const [hookY, setHookY] = useState(MINER_Y + 20);
  const [swingAngle, setSwingAngle] = useState(0); // angle from vertical

  const stRef = useRef({
    phase: 'ready',
    angle: -Math.PI / 2.5,
    angleDir: 1,
    ropeLen: 0,
    hookState: 'swing', // swing | extend | pull
    grabbed: null,
    minerals: [],
    score: 0,
    frame: 0,
  });
  const frameRef = useRef(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (onLockSwipe) onLockSwipe();
    return () => {
      mountedRef.current = false;
      if (onUnlockSwipe) onUnlockSwipe();
      cancelAnimationFrame(frameRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  const resetGame = () => {
    cancelAnimationFrame(frameRef.current);
    clearInterval(timerRef.current);
    const m = spawnMinerals(cfg.mineralCount);
    stRef.current = {
      phase: 'play', angle: -Math.PI / 2.5, angleDir: 1,
      ropeLen: 0, hookState: 'swing', grabbed: null, minerals: m, score: 0, frame: 0,
    };
    setPhase('play');
    setScore(0);
    setTimer(cfg.duration);
    setMinerals(m);
    setHookX(MINER_X);
    setHookY(MINER_Y + 20);
    setSwingAngle(0);
    startLoop();
    startTimer();
  };

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const endGame = () => {
    const s = stRef.current;
    s.phase = 'end';
    setPhase('end');
    cancelAnimationFrame(frameRef.current);
    clearInterval(timerRef.current);
    if (s.score >= cfg.targetScore) { playCorrect(); setTimeout(() => onCorrect(), 1000); }
    else { playWrong(); setTimeout(() => onWrong(), 1000); }
  };

  const startLoop = () => {
    cancelAnimationFrame(frameRef.current);
    const loop = () => {
      if (!mountedRef.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      s.frame++;

      if (s.hookState === 'swing') {
        s.angle += SWING_SPEED * s.angleDir;
        if (s.angle > Math.PI / 2.5) s.angleDir = -1;
        if (s.angle < -Math.PI / 2.5) s.angleDir = 1;
        const hx = MINER_X + Math.sin(s.angle) * 30;
        const hy = MINER_Y + 20 + Math.cos(s.angle) * 30;
        setHookX(hx);
        setHookY(hy);
        setSwingAngle(s.angle);
      } else if (s.hookState === 'extend') {
        s.ropeLen += ROPE_SPEED;
        const hx = MINER_X + Math.sin(s.angle) * s.ropeLen;
        const hy = MINER_Y + 20 + Math.cos(s.angle) * s.ropeLen;
        setHookX(hx);
        setHookY(hy);

        // Check out of bounds
        if (hx < 0 || hx > GAME_W || hy > GAME_H) {
          s.hookState = 'pull';
          s.grabbed = null;
        }

        // Check mineral collision
        if (!s.grabbed) {
          for (const m of s.minerals) {
            if (m.grabbed) continue;
            const dx = hx - m.x, dy = hy - m.y;
            if (Math.sqrt(dx * dx + dy * dy) < m.size / 2 + 8) {
              m.grabbed = true;
              s.grabbed = m;
              s.hookState = 'pull';
              break;
            }
          }
        }
      } else if (s.hookState === 'pull') {
        const pullSpd = s.grabbed ? PULL_SPEED * s.grabbed.weight : PULL_SPEED * 1.5;
        s.ropeLen = Math.max(0, s.ropeLen - pullSpd);
        const hx = MINER_X + Math.sin(s.angle) * s.ropeLen;
        const hy = MINER_Y + 20 + Math.cos(s.angle) * s.ropeLen;
        setHookX(hx);
        setHookY(hy);

        // Update grabbed mineral position
        if (s.grabbed) {
          s.grabbed.x = hx;
          s.grabbed.y = hy;
          setMinerals([...s.minerals]);
        }

        if (s.ropeLen <= 0) {
          if (s.grabbed) {
            const val = s.grabbed.value;
            s.score += val;
            setScore(s.score);
            playCorrect();
            s.minerals = s.minerals.filter(m => m !== s.grabbed);
            setMinerals([...s.minerals]);
            s.grabbed = null;
          }
          s.hookState = 'swing';
          s.ropeLen = 0;
        }
      }

      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
  };

  const handleFire = () => {
    const s = stRef.current;
    if (s.phase === 'ready') { resetGame(); return; }
    if (s.phase === 'end') { resetGame(); return; }
    if (s.hookState !== 'swing') return;
    playTap();
    s.hookState = 'extend';
    s.ropeLen = 30;
  };

  // Draw rope from miner to hook
  const ropePoints = () => {
    const s = stRef.current;
    const segments = [];
    const steps = Math.max(2, Math.floor(s.ropeLen / 8));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      segments.push({
        x: MINER_X + Math.sin(s.angle) * s.ropeLen * t,
        y: MINER_Y + 20 + Math.cos(s.angle) * s.ropeLen * t,
      });
    }
    return segments;
  };

  return (
    <View style={styles.outer}>
      <View style={styles.hudRow}>
        <View style={styles.hudChip}>
          <Text style={styles.hudTxt}>💰 {score}</Text>
        </View>
        <View style={styles.hudChip}>
          <Text style={styles.hudTxt}>🎯 {cfg.targetScore}</Text>
        </View>
        <View style={[styles.hudChip, timer <= 10 && styles.timerDanger]}>
          <Text style={styles.hudTxt}>⏱ {timer}s</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.gameArea} onPress={handleFire} activeOpacity={1}>
        {/* Sky / ground zones */}
        <View style={styles.skyZone} />
        <View style={styles.groundZone} />

        {/* Miner platform */}
        <View style={styles.platform} />
        <Text style={styles.minerEmoji}>⛏️</Text>

        {/* Rope segments */}
        {stRef.current.hookState !== 'swing' && ropePoints().map((pt, i) => (
          <View
            key={i}
            style={[styles.ropeDot, { left: pt.x - 2, top: pt.y - 2 }]}
          />
        ))}

        {/* Hook */}
        <View style={[styles.hook, { left: hookX - 8, top: hookY - 8 }]} />

        {/* Minerals */}
        {minerals.map(m => (
          <View key={m.id} style={[styles.mineral, {
            left: m.x - m.size / 2, top: m.y - m.size / 2,
            width: m.size, height: m.size, backgroundColor: m.color + '33',
            borderColor: m.color, borderRadius: m.size / 2,
          }]}>
            <Text style={{ fontSize: m.size * 0.55 }}>{m.emoji}</Text>
            <Text style={[styles.mineralVal, { color: m.color }]}>{m.value}</Text>
          </View>
        ))}

        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>⛏️ Altın Madenci</Text>
            <Text style={styles.overlayHint}>Dokunarak kancayı fırlat!</Text>
          </View>
        )}
        {phase === 'end' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>💰 {score}</Text>
            <Text style={styles.overlayHint}>{score >= cfg.targetScore ? 'Tebrikler!' : 'Tekrar dene!'}</Text>
            <Text style={styles.overlayRetry}>Dokun → Tekrar</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.fireRow}>
        <TouchableOpacity
          style={[styles.fireBtn, stRef.current.hookState !== 'swing' && styles.fireBtnDisabled]}
          onPress={handleFire}
          activeOpacity={0.7}
        >
          <Text style={styles.fireTxt}>🎯 FIRLA!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#0d1117',
    borderRadius: 20,
    margin: 8,
    overflow: 'hidden',
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
  },
  hudChip: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  timerDanger: { borderColor: '#ef4444', backgroundColor: '#2d1515' },
  hudTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },

  gameArea: {
    flex: 1,
    marginHorizontal: 10,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0a1628',
  },
  skyZone: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: MINER_Y + 70,
    backgroundColor: '#0a1628',
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a5f',
  },
  groundZone: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    top: MINER_Y + 70,
    backgroundColor: '#1a1005',
  },
  platform: {
    position: 'absolute',
    top: MINER_Y + 40,
    left: GAME_W / 2 - 30,
    width: 60,
    height: 10,
    backgroundColor: '#78350f',
    borderRadius: 4,
  },
  minerEmoji: {
    position: 'absolute',
    top: MINER_Y - 4,
    left: GAME_W / 2 - 18,
    fontSize: 34,
  },
  ropeDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d4a574',
  },
  hook: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fbbf24',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  mineral: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  mineralVal: {
    fontSize: 9,
    fontWeight: '900',
    marginTop: -2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTitle: { color: '#fff', fontSize: 30, fontWeight: '900' },
  overlayHint: { color: 'rgba(255,255,255,0.7)', fontSize: 15, marginTop: 8 },
  overlayRetry: { color: '#fbbf24', fontSize: 13, marginTop: 12 },
  fireRow: {
    padding: 10,
    alignItems: 'center',
  },
  fireBtn: {
    backgroundColor: '#b45309',
    borderRadius: 20,
    paddingHorizontal: 50,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  fireBtnDisabled: { opacity: 0.4 },
  fireTxt: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
});
