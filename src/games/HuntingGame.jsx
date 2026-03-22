import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, PanResponder,
} from 'react-native';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = SW - 16;
const GAME_H = Math.min(SH * 0.68, 520);

// Field of view settings
const FOV_H = 75;          // horizontal degrees visible
const FOV_V = 55;          // vertical degrees visible
const PX_PER_DEG_H = GAME_W / FOV_H;
const PX_PER_DEG_V = GAME_H / FOV_V;
const SENS_H = 0.28;       // degrees per pixel (horizontal)
const SENS_V = 0.18;       // degrees per pixel (vertical)
const CAM_V_MIN = -25;
const CAM_V_MAX = 25;

// Hit radius in degrees for crosshair aim
const HIT_RADIUS_H = 7;
const HIT_RADIUS_V = 9;

const DIFFICULTY_CONFIG = {
  0: { spawnMs: 2500, animalLife: 5500, bonusTime: 6, startTime: 45, maxAnimals: 5 },
  1: { spawnMs: 1800, animalLife: 3800, bonusTime: 4, startTime: 40, maxAnimals: 7 },
  2: { spawnMs: 1200, animalLife: 2500, bonusTime: 3, startTime: 35, maxAnimals: 10 },
};

const ANIMAL_TYPES = [
  { name: 'Tavşan', emoji: '🐇', points: 10, angSize: 5,  speed: 0.5 },
  { name: 'Geyik',  emoji: '🦌', points: 20, angSize: 7,  speed: 0.3 },
  { name: 'Ayı',    emoji: '🐻', points: 15, angSize: 8,  speed: 0.25 },
  { name: 'Tilki',  emoji: '🦊', points: 25, angSize: 5.5, speed: 0.5 },
  { name: 'Kurt',   emoji: '🐺', points: 30, angSize: 6,  speed: 0.6 },
  { name: 'Kartal', emoji: '🦅', points: 35, angSize: 4.5, speed: 0.9, flying: true },
];

// Static scenery distributed around 360°
const SCENERY = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  worldH: (i / 24) * 360,
  worldV: 8 + (i % 4) * 3,
  depth: 200 + (i % 5) * 80,
  emoji: ['🌲', '🌳', '🌿', '🌾', '🪨'][i % 5],
  baseSize: 18 + (i % 4) * 6,
}));

let _aid = 0;
const aid = () => ++_aid;

// Normalize angle difference to [-180, 180]
function angDiff(a, b) {
  return ((a - b + 540) % 360) - 180;
}

function spawnAnimal(cfg) {
  const type = ANIMAL_TYPES[Math.floor(Math.random() * ANIMAL_TYPES.length)];
  const worldH = Math.random() * 360;
  const worldV = type.flying
    ? -(12 + Math.random() * 15)
    : 5 + Math.random() * 14;
  const depth = 120 + Math.random() * 200;
  return {
    id: aid(), type,
    worldH, worldV, depth,
    born: Date.now(), life: cfg.animalLife,
    dir: Math.random() > 0.5 ? 1 : -1,
  };
}

export default function HuntingGame({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const [phase, setPhase] = useState('ready');
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(cfg.startTime);
  const [animals, setAnimals] = useState([]);
  const [flashes, setFlashes] = useState([]);
  const [camH, setCamH] = useState(0);
  const [camV, setCamV] = useState(0);
  const [shotEffect, setShotEffect] = useState(false); // gun flash

  const stRef = useRef({
    phase: 'ready', score: 0, animals: [], flashId: 0,
    camH: 0, camV: 0,
  });
  const frameRef   = useRef(null);
  const timerRef   = useRef(null);
  const spawnRef   = useRef(null);
  const mountedRef = useRef(true);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ h: 0, v: 0 });

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
    stRef.current = { phase: 'play', score: 0, animals: [], flashId: 0, camH: 0, camV: 0 };
    setPhase('play');
    setScore(0);
    setTimer(cfg.startTime);
    setAnimals([]);
    setFlashes([]);
    setCamH(0);
    setCamV(0);
    startLoop();
    clearInterval(timerRef.current);
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
    clearInterval(spawnRef.current);
    spawnRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      if (s.animals.length >= cfg.maxAnimals) return;
      s.animals = [...s.animals, spawnAnimal(cfg)];
    }, cfg.spawnMs);
  };

  const startLoop = () => {
    cancelAnimationFrame(frameRef.current);
    const loop = () => {
      if (!mountedRef.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      const t = Date.now();
      s.animals = s.animals
        .filter(a => t - a.born < a.life)
        .map(a => ({
          ...a,
          worldH: ((a.worldH + a.dir * a.type.speed * 0.25) + 360) % 360,
        }));
      setAnimals([...s.animals]);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
  };

  const endGame = () => {
    const s = stRef.current;
    s.phase = 'end';
    setPhase('end');
    cancelAnimationFrame(frameRef.current);
    // Score recorded but swipe stays locked — user must press DURDUR to unlock
    if (s.score >= 50) playCorrect(); else playWrong();
  };

  const stopAndLeave = () => {
    const s = stRef.current;
    cancelAnimationFrame(frameRef.current);
    clearInterval(timerRef.current);
    clearInterval(spawnRef.current);
    if (onUnlockSwipe) onUnlockSwipe();
    if (s.score >= 50) setTimeout(() => onCorrect(), 300);
    else setTimeout(() => onWrong(), 300);
  };

  // Shoot at crosshair (center of screen)
  const shootRef = useRef(null);
  shootRef.current = () => {
    const s = stRef.current;
    if (s.phase !== 'play') return;

    setShotEffect(true);
    setTimeout(() => setShotEffect(false), 120);

    let hitAnimal = null;
    for (const a of [...s.animals].reverse()) {
      const dH = Math.abs(angDiff(a.worldH, s.camH));
      const dV = Math.abs(a.worldV - s.camV);
      if (dH < HIT_RADIUS_H && dV < HIT_RADIUS_V) {
        hitAnimal = a;
        break;
      }
    }
    const fid = ++s.flashId;
    if (hitAnimal) {
      playCorrect();
      const pts = Math.round(hitAnimal.type.points * (300 / hitAnimal.depth));
      s.score += pts;
      s.animals = s.animals.filter(a => a.id !== hitAnimal.id);
      setScore(s.score);
      setAnimals([...s.animals]);
      setFlashes(f => [...f, { id: fid, hit: true, pts }]);
      setTimer(t => t + cfg.bonusTime);
    } else {
      playWrong();
      setFlashes(f => [...f, { id: fid, hit: false, pts: 0 }]);
    }
    setTimeout(() => setFlashes(f => f.filter(fl => fl.id !== fid)), 700);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => stRef.current.phase === 'play',
      onMoveShouldSetPanResponder:  () => stRef.current.phase === 'play',
      onStartShouldSetPanResponderCapture: () => stRef.current.phase === 'play',
      onMoveShouldSetPanResponderCapture:  () => stRef.current.phase === 'play',
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        isDraggingRef.current = false;
        lastPosRef.current = { h: stRef.current.camH, v: stRef.current.camV };
      },
      onPanResponderMove: (evt, gs) => {
        if (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4) {
          isDraggingRef.current = true;
        }
        const newH = ((lastPosRef.current.h - gs.dx * SENS_H) + 360) % 360;
        const newV = Math.max(CAM_V_MIN, Math.min(CAM_V_MAX,
          lastPosRef.current.v - gs.dy * SENS_V));
        stRef.current.camH = newH;
        stRef.current.camV = newV;
        setCamH(newH);
        setCamV(newV);
      },
      onPanResponderRelease: () => {
        if (!isDraggingRef.current) {
          shootRef.current?.();
        }
      },
    })
  ).current;

  // Project a world object to screen coordinates
  const project = (worldH, worldV, depth) => {
    const dH = angDiff(worldH, camH);
    const dV = worldV - camV;
    if (Math.abs(dH) > FOV_H / 2 + 8 || Math.abs(dV) > FOV_V / 2 + 8) return null;
    const sx = GAME_W / 2 + dH * PX_PER_DEG_H;
    const sy = GAME_H / 2 + dV * PX_PER_DEG_V;
    const scale = Math.max(0.15, 280 / Math.max(depth, 1));
    return { sx, sy, scale };
  };

  // Horizon Y shifts with camera vertical
  const horizonY = GAME_H / 2 - camV * PX_PER_DEG_V;

  // Compass direction label
  const compassAngle = ((camH + 22.5) % 360);
  const compassDir = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(compassAngle / 45)];

  return (
    <View style={styles.outer}>
      {/* HUD */}
      <View style={styles.hudRow}>
        <View style={styles.hudChip}>
          <Text style={styles.hudTxt}>🎯 {score}</Text>
        </View>
        <View style={styles.hudChip}>
          <Text style={styles.hudTxt}>🧭 {compassDir} {Math.round(camH)}°</Text>
        </View>
        <View style={[styles.hudChip, timer <= 8 && styles.timerDanger]}>
          <Text style={styles.hudTxt}>⏱ {timer}s</Text>
        </View>
        {phase !== 'ready' && (
          <TouchableOpacity style={styles.stopBtn} onPress={stopAndLeave}>
            <Text style={styles.stopTxt}>■ DUR</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 3D World View */}
      <View style={styles.gameArea} {...panResponder.panHandlers}>
        {/* Sky */}
        <View style={[styles.sky, { height: Math.max(0, horizonY) }]} />
        {/* Ground */}
        <View style={[styles.ground, {
          top: Math.min(GAME_H, horizonY),
          height: Math.max(0, GAME_H - horizonY),
        }]} />
        {/* Horizon line */}
        <View style={[styles.horizon, { top: horizonY }]} />

        {/* Ground perspective lines */}
        {[0.15, 0.32, 0.52, 0.72, 0.9].map((frac, i) => {
          const y = horizonY + frac * (GAME_H - horizonY);
          if (y > GAME_H) return null;
          const spread = frac * GAME_W * 0.45;
          return (
            <View key={i} style={[styles.perspLine, {
              top: y,
              left: GAME_W / 2 - spread,
              width: spread * 2,
              opacity: 0.06 + frac * 0.08,
            }]} />
          );
        })}

        {/* Scenery - sorted by depth (far first) */}
        {[...SCENERY]
          .sort((a, b) => b.depth - a.depth)
          .map(s => {
            const p = project(s.worldH, s.worldV, s.depth);
            if (!p) return null;
            const sz = s.baseSize * p.scale;
            return (
              <View key={s.id} style={[styles.sceneryItem, {
                left: p.sx - sz / 2,
                top: p.sy - sz * 0.9,
                opacity: Math.min(1, 0.4 + p.scale * 1.2),
              }]}>
                <Text style={{ fontSize: sz }}>{s.emoji}</Text>
              </View>
            );
          })}

        {/* Animals - sorted by depth (far first) */}
        {[...animals]
          .sort((a, b) => b.depth - a.depth)
          .map(a => {
            const p = project(a.worldH, a.worldV, a.depth);
            if (!p) return null;
            const sz = a.type.angSize * p.scale * PX_PER_DEG_H;
            const elapsed = Date.now() - a.born;
            const opacity = elapsed / a.life > 0.75 ? 1 - ((elapsed / a.life - 0.75) / 0.25) : 1;
            return (
              <View key={a.id} style={[styles.animalItem, {
                left: p.sx - sz / 2,
                top: p.sy - sz / 2,
                width: sz, height: sz,
                opacity,
                transform: [{ scaleX: a.dir > 0 ? 1 : -1 }],
              }]}>
                <Text style={{ fontSize: sz * 0.85, textAlign: 'center' }}>
                  {a.type.emoji}
                </Text>
                <Text style={[styles.animalPts, { fontSize: Math.max(8, sz * 0.22) }]}>
                  +{Math.round(a.type.points * (300 / a.depth))}
                </Text>
              </View>
            );
          })}

        {/* Crosshair */}
        {phase === 'play' && (
          <View style={[styles.crosshairWrap, shotEffect && styles.crosshairShot]}>
            <View style={styles.chH} />
            <View style={styles.chV} />
            <View style={styles.chCircle} />
            <View style={styles.chDot} />
          </View>
        )}

        {/* Shot flash feedback */}
        {flashes.map(f => (
          <View key={f.id} style={styles.flashWrap}>
            <Text style={[styles.flashTxt, { color: f.hit ? '#4ade80' : '#f87171' }]}>
              {f.hit ? `+${f.pts}` : '✗ Miss'}
            </Text>
          </View>
        ))}

        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>🎯 Avcı 3D</Text>
            <Text style={styles.overlayDesc}>
              Ekranı kaydır → kamera döner{'\n'}
              Nişangahı hayvanın üzerine getir{'\n'}
              Ekrana dokun → ATEŞ ET!
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startTxt}>BAŞLA</Text>
            </TouchableOpacity>
          </View>
        )}
        {phase === 'end' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>🎯 {score} Puan</Text>
            <Text style={styles.overlayDesc}>
              {score >= 50 ? '🏆 Mükemmel avcı!' : 'Daha iyi nişan al!'}
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startTxt}>TEKRAR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Drag hint */}
      {phase === 'play' && (
        <View style={styles.hint}>
          <Text style={styles.hintTxt}>← Kaydır: döndür  •  Dokun: ateş et →</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    margin: 8,
    overflow: 'hidden',
  },
  hudRow: {
    flexDirection: 'row', justifyContent: 'space-around', padding: 8,
  },
  hudChip: {
    backgroundColor: '#1c1c1c', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#333',
  },
  timerDanger: { borderColor: '#888', backgroundColor: '#2a1a1a' },
  hudTxt: { color: '#e0e0e0', fontWeight: '800', fontSize: 13 },
  stopBtn: {
    backgroundColor: '#7f1d1d', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#ef4444',
    justifyContent: 'center',
  },
  stopTxt: { color: '#fca5a5', fontWeight: '900', fontSize: 12 },

  gameArea: {
    flex: 1, marginHorizontal: 8, marginBottom: 4,
    borderRadius: 14, overflow: 'hidden', position: 'relative',
  },
  sky: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: '#0a1520',
  },
  ground: {
    position: 'absolute', left: 0, right: 0,
    backgroundColor: '#111a0a',
  },
  horizon: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: '#2a3520', opacity: 0.8,
  },
  perspLine: {
    position: 'absolute', height: 1,
    backgroundColor: '#3a4a2a',
  },
  sceneryItem: { position: 'absolute' },
  animalItem: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
  },
  animalPts: {
    color: '#fbbf24', fontWeight: '900', textAlign: 'center',
    textShadowColor: '#000', textShadowRadius: 3,
  },

  crosshairWrap: {
    position: 'absolute',
    left: GAME_W / 2 - 40, top: GAME_H / 2 - 40,
    width: 80, height: 80,
    justifyContent: 'center', alignItems: 'center',
  },
  crosshairShot: { opacity: 0.4 },
  chH: {
    position: 'absolute', width: 80, height: 1.5,
    backgroundColor: '#e0e0e0', opacity: 0.8,
    top: 39,
  },
  chV: {
    position: 'absolute', height: 80, width: 1.5,
    backgroundColor: '#e0e0e0', opacity: 0.8,
    left: 39,
  },
  chCircle: {
    position: 'absolute', width: 32, height: 32,
    borderRadius: 16, borderWidth: 1.5,
    borderColor: '#e0e0e0', opacity: 0.6,
    top: 24, left: 24,
  },
  chDot: {
    position: 'absolute', width: 5, height: 5,
    borderRadius: 3, backgroundColor: '#ff4444',
    top: 37.5, left: 37.5,
  },

  flashWrap: {
    position: 'absolute',
    left: GAME_W / 2 - 60,
    top: GAME_H / 2 - 50,
    width: 120, alignItems: 'center',
  },
  flashTxt: { fontWeight: '900', fontSize: 20, textShadowColor: '#000', textShadowRadius: 4 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center', alignItems: 'center', gap: 14,
  },
  overlayTitle: { color: '#fff', fontSize: 32, fontWeight: '900' },
  overlayDesc: { color: '#aaa', fontSize: 14, textAlign: 'center', lineHeight: 24 },
  startBtn: {
    backgroundColor: '#333', borderRadius: 16,
    paddingHorizontal: 40, paddingVertical: 12,
    borderWidth: 1, borderColor: '#666', marginTop: 8,
  },
  startTxt: { color: '#fff', fontWeight: '900', fontSize: 18 },

  hint: { alignItems: 'center', paddingBottom: 6 },
  hintTxt: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
});
