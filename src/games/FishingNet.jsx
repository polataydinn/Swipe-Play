import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, PanResponder,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = SW - 16;
const GAME_H = Math.min(SH * 0.65, 500);

const FISH_TYPES = [
  { emoji: '🐟', value: 10, size: 26, speed: 1.2 },
  { emoji: '🐠', value: 15, size: 24, speed: 1.5 },
  { emoji: '🐡', value: 20, size: 28, speed: 0.9 },
  { emoji: '🦈', value: 50, size: 34, speed: 1.8 },
  { emoji: '🐙', value: 30, size: 30, speed: 0.7, wobble: true },
];

const BOMB = { emoji: '💣', value: -40, size: 26, speed: 0.8, isBomb: true };

const DIFFICULTY_CONFIG = {
  0: { spawnMs: 1600, targetScore: 100, duration: 40, bombChance: 0 },
  1: { spawnMs: 1100, targetScore: 180, duration: 35, bombChance: 0.15 },
  2: { spawnMs: 750,  targetScore: 280, duration: 30, bombChance: 0.25 },
};

let _fid = 0;
const fid = () => ++_fid;

function spawnFish(cfg) {
  const isBomb = Math.random() < cfg.bombChance;
  const type   = isBomb ? BOMB : FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)];
  const dir    = Math.random() > 0.5 ? 1 : -1;
  const x      = dir > 0 ? -type.size : GAME_W + type.size;
  const y      = GAME_H * 0.2 + Math.random() * GAME_H * 0.65;
  return {
    ...type, id: fid(), x, y, dir,
    wobbleT: 0, baseY: y,
  };
}

const MAX_NET_POINTS = 60;
const NET_CATCH_DIST = 28;

export default function FishingNet({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const [phase, setPhase] = useState('ready');
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(cfg.duration);
  const [fish, setFish] = useState([]);
  const [netPath, setNetPath] = useState([]); // [{x, y}]
  const [catches, setCatches] = useState([]); // {id, x, y, val, t}
  const [isDrawing, setIsDrawing] = useState(false);

  const stRef = useRef({
    phase: 'ready', score: 0, fish: [],
    netPath: [], isDrawing: false, catchId: 0,
  });
  const frameRef   = useRef(null);
  const timerRef   = useRef(null);
  const spawnRef   = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (onUnlockSwipe) onUnlockSwipe();
      cancelAnimationFrame(frameRef.current);
      clearInterval(timerRef.current);
      clearInterval(spawnRef.current);
    };
  }, []);

  const startGame = () => {
    if (onLockSwipe) onLockSwipe();
    cancelAnimationFrame(frameRef.current);
    clearInterval(timerRef.current);
    clearInterval(spawnRef.current);
    stRef.current = {
      phase: 'play', score: 0, fish: [], netPath: [], isDrawing: false, catchId: 0,
    };
    setPhase('play');
    setScore(0);
    setTimer(cfg.duration);
    setFish([]);
    setNetPath([]);
    setCatches([]);
    setIsDrawing(false);
    startLoop();
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          clearInterval(spawnRef.current);
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    spawnRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      if (s.fish.length < 12) {
        const f = spawnFish(cfg);
        s.fish = [...s.fish, f];
      }
    }, cfg.spawnMs);
  };

  const endGame = () => {
    const s = stRef.current;
    s.phase = 'end';
    setPhase('end');
    cancelAnimationFrame(frameRef.current);
    // Score recorded but swipe stays locked — user must press DURDUR to unlock
    if (s.score >= cfg.targetScore) playCorrect(); else playWrong();
  };

  const stopAndLeave = () => {
    const s = stRef.current;
    cancelAnimationFrame(frameRef.current);
    clearInterval(timerRef.current);
    clearInterval(spawnRef.current);
    if (onUnlockSwipe) onUnlockSwipe();
    if (s.score >= cfg.targetScore) setTimeout(() => onCorrect(), 300);
    else setTimeout(() => onWrong(), 300);
  };

  const startLoop = () => {
    cancelAnimationFrame(frameRef.current);
    const loop = () => {
      if (!mountedRef.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;

      // Move fish
      s.fish = s.fish
        .map(f => {
          const nx = f.x + f.dir * f.speed;
          const wobbleY = f.wobble ? Math.sin(f.wobbleT) * 15 : 0;
          return { ...f, x: nx, y: f.baseY + wobbleY, wobbleT: f.wobbleT + 0.08 };
        })
        .filter(f => f.x > -80 && f.x < GAME_W + 80);

      setFish([...s.fish]);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
  };

  // Check which fish are caught by the net path
  const checkNetCatch = (path) => {
    if (path.length < 6) return;
    const s = stRef.current;
    const caught = [];
    const remaining = [];

    for (const f of s.fish) {
      let isCaught = false;
      // Check if any net segment passes near the fish
      for (let i = 1; i < path.length; i++) {
        const p0 = path[i - 1], p1 = path[i];
        // Distance from fish center to line segment
        const dx = p1.x - p0.x, dy = p1.y - p0.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) continue;
        const t = Math.max(0, Math.min(1, ((f.x - p0.x) * dx + (f.y - p0.y) * dy) / lenSq));
        const nearX = p0.x + t * dx;
        const nearY = p0.y + t * dy;
        const dist  = Math.sqrt((f.x - nearX) ** 2 + (f.y - nearY) ** 2);
        if (dist < NET_CATCH_DIST + f.size / 2) {
          isCaught = true;
          break;
        }
      }
      if (isCaught) caught.push(f);
      else remaining.push(f);
    }

    if (caught.length > 0) {
      let gained = 0;
      const newCatches = [];
      for (const f of caught) {
        gained += f.value;
        newCatches.push({ id: ++s.catchId, x: f.x, y: f.y, val: f.value, t: Date.now() });
      }
      if (gained > 0) playCorrect();
      else playWrong();
      s.score = Math.max(0, s.score + gained);
      s.fish = remaining;
      setScore(s.score);
      setFish([...remaining]);
      setCatches(prev => [...prev, ...newCatches]);
      setTimeout(() => {
        setCatches(prev => prev.filter(c => !newCatches.find(nc => nc.id === c.id)));
      }, 800);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => stRef.current.phase === 'play',
      onMoveShouldSetPanResponder:  () => stRef.current.phase === 'play',
      onStartShouldSetPanResponderCapture: () => stRef.current.phase === 'play',
      onMoveShouldSetPanResponderCapture:  () => stRef.current.phase === 'play',
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        stRef.current.netPath = [{ x, y }];
        stRef.current.isDrawing = true;
        setNetPath([{ x, y }]);
        setIsDrawing(true);
      },
      onPanResponderMove: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        const s = stRef.current;
        const newPath = [...s.netPath, { x, y }];
        // Subsample to limit points
        if (newPath.length > MAX_NET_POINTS) newPath.splice(0, 1);
        s.netPath = newPath;
        setNetPath([...newPath]);
      },
      onPanResponderRelease: () => {
        const s = stRef.current;
        checkNetCatch(s.netPath);
        s.netPath = [];
        s.isDrawing = false;
        setNetPath([]);
        setIsDrawing(false);
      },
    })
  ).current;

  // Render net as SVG-style lines using absolute-positioned narrow views
  const renderNet = (path) => {
    if (path.length < 2) return null;
    return path.slice(1).map((pt, i) => {
      const prev = path[i];
      const dx = pt.x - prev.x, dy = pt.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) return null;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      return (
        <View key={i} style={[styles.netLine, {
          left: prev.x,
          top: prev.y - 2,
          width: len,
          transform: [{ rotate: `${angle}deg` }],
          transformOrigin: '0 50%',
        }]} />
      );
    });
  };

  return (
    <View style={styles.outer}>
      <View style={styles.hudRow}>
        <View style={styles.hudChip}>
          <Text style={styles.hudTxt}>🎣 {score}</Text>
        </View>
        <View style={styles.hudChip}>
          <Text style={styles.hudTxt}>🎯 {cfg.targetScore}</Text>
        </View>
        <View style={[styles.hudChip, timer <= 10 && styles.timerDanger]}>
          <Text style={styles.hudTxt}>⏱ {timer}s</Text>
        </View>
        {phase !== 'ready' && (
          <TouchableOpacity style={styles.stopBtn} onPress={stopAndLeave}>
            <Text style={styles.stopTxt}>■ DUR</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.gameArea} {...panResponder.panHandlers}>
        {/* Water background */}
        <View style={styles.water} />
        {[0.2, 0.45, 0.7].map((yf, i) => (
          <View key={i} style={[styles.waterLine, { top: GAME_H * yf, opacity: 0.1 + i * 0.06 }]} />
        ))}

        {/* Fish */}
        {fish.map(f => (
          <View key={f.id} style={[styles.fishItem, {
            left: f.x - f.size / 2,
            top:  f.y - f.size / 2,
            transform: [{ scaleX: f.dir > 0 ? 1 : -1 }],
          }]}>
            <Text style={{ fontSize: f.size }}>{f.emoji}</Text>
          </View>
        ))}

        {/* Catch popups */}
        {catches.map(c => (
          <View key={c.id} style={[styles.catchPop, { left: c.x - 20, top: c.y - 30 }]}>
            <Text style={[styles.catchTxt, { color: c.val > 0 ? '#4ade80' : '#f87171' }]}>
              {c.val > 0 ? `+${c.val}` : c.val}
            </Text>
          </View>
        ))}

        {/* Net drawing */}
        {renderNet(netPath)}

        {/* Net glow */}
        {isDrawing && netPath.length > 0 && (
          <View style={[styles.netHead, {
            left: netPath[netPath.length - 1].x - 6,
            top:  netPath[netPath.length - 1].y - 6,
          }]} />
        )}

        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>🎣 Ağ Balıkçılık</Text>
            <Text style={styles.overlayDesc}>Parmağını kaydırarak{'\n'}balıkların üzerinden ağ çek!</Text>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startTxt}>BAŞLA</Text>
            </TouchableOpacity>
          </View>
        )}
        {phase === 'end' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>🎣 {score} Puan</Text>
            <Text style={styles.overlayDesc}>
              {score >= cfg.targetScore ? '🏆 Harika avcı!' : 'Daha hızlı çizmelisin!'}
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startTxt}>TEKRAR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#050d18',
    borderRadius: 20,
    margin: 8,
    overflow: 'hidden',
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
  },
  stopBtn: {
    backgroundColor: '#7f1d1d', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#ef4444',
    justifyContent: 'center',
  },
  stopTxt: { color: '#fca5a5', fontWeight: '900', fontSize: 12 },
  hudChip: {
    backgroundColor: '#0d1f3c',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  timerDanger: { borderColor: '#ef4444', backgroundColor: '#2d1515' },
  hudTxt: { color: '#7dd3fc', fontWeight: '800', fontSize: 14 },

  gameArea: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  water: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#062040',
  },
  waterLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: 1,
    backgroundColor: '#38bdf8',
  },
  fishItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catchPop: {
    position: 'absolute',
    alignItems: 'center',
  },
  catchTxt: { fontWeight: '900', fontSize: 16 },
  netLine: {
    position: 'absolute',
    height: 4,
    backgroundColor: 'rgba(120, 220, 255, 0.85)',
    borderRadius: 2,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  netHead: {
    position: 'absolute',
    width: 12, height: 12,
    borderRadius: 6,
    backgroundColor: '#7dd3fc',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,10,25,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  overlayTitle: { color: '#7dd3fc', fontSize: 30, fontWeight: '900' },
  overlayDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  startBtn: {
    backgroundColor: '#0369a1',
    borderRadius: 16,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#38bdf8',
    marginTop: 8,
  },
  startTxt: { color: '#fff', fontWeight: '900', fontSize: 18 },
});
