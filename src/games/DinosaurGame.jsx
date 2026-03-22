import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

const FUFU_IMG   = require('../assets/dino/fufu.png');
const BG_IMG     = require('../assets/dino/BG.png');
const OBJECTS_IMG = require('../assets/dino/objects.png');

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 16, 380);
const GAME_H = Math.min(SH * 0.68, 520);

// ── Fufu sprite sheet: 828×140 → 4 frames of 207×140 ──
const FUFU_SHEET_W = 828;
const FUFU_SHEET_H = 140;
const FUFU_FRAME_W = 207;
const FUFU_SCALE   = 0.30;
const CHAR_W = FUFU_FRAME_W * FUFU_SCALE; // ≈62
const CHAR_H = FUFU_SHEET_H * FUFU_SCALE; // ≈42
// frame indices: 0=idle  1=walk_a  2=walk_b  3=jump
const FRAME_IDLE  = 0;
const FRAME_WALK1 = 1;
const FRAME_WALK2 = 2;
const FRAME_JUMP  = 3;

// ── Objects atlas: 776×309 ──
const OBJ_W = 776;
const OBJ_H = 309;
const OBJ_S = 0.75; // obstacle display scale

const OBSTACLES = [
  { key: 'Stone',    x: 649, y:  73, w: 90, h: 54 },
  { key: 'Crate',    x: 570, y:  50, w: 77, h: 77 },
  { key: 'Bush1',    x: 570, y: 242, w: 133, h: 65 },
  { key: 'Bush3',    x: 649, y:  24, w:  73, h: 47 },
  { key: 'Mush1',   x: 688, y: 132, w:  49, h: 41 },
  { key: 'Mush2',   x: 724, y:  30, w:  50, h: 41 },
];
const FRUIT_FRAME = { x: 739, y: 139, w: 30, h: 35 };
const FRUIT_S = 1.1;

// ── Layout ──
const GROUND_Y = GAME_H * 0.78; // where physics floor is
const CHAR_X   = GAME_W * 0.14;
const GRAVITY  = 0.55;
const JUMP_VY  = -13;

const DIFFICULTY_CONFIG = {
  0: { duration: 40, speed: 4,   spawnMs: 2400, fruitChance: 0.35 },
  1: { duration: 35, speed: 5.5, spawnMs: 1700, fruitChance: 0.40 },
  2: { duration: 30, speed: 7.5, spawnMs: 1100, fruitChance: 0.45 },
};

export default function DinosaurGame({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const [phase, setPhase]       = useState('ready');
  const [rs, setRs]             = useState(null);
  const [animFrame, setAnimFrame] = useState(FRAME_IDLE);

  const stRef     = useRef(null);
  const rafRef    = useRef(null);
  const spawnRef  = useRef(null);
  const countRef  = useRef(null);
  const animRef   = useRef(null);
  const mounted   = useRef(true);

  const fresh = () => ({
    phase: 'ready',
    charY: GROUND_Y - CHAR_H,
    charVy: 0,
    onGround: true,
    jumpsLeft: 2,
    obstacles: [],
    fruits: [],
    score: 0,
    timeLeft: cfg.duration,
    nextId: 0,
  });

  useEffect(() => {
    stRef.current = fresh();
    setRs({ ...stRef.current });
    return () => {
      mounted.current = false;
      stopAll();
      if (onUnlockSwipe) onUnlockSwipe();
    };
  }, []);

  useEffect(() => { resetGame(); }, [difficulty]);

  const stopAll = () => {
    if (rafRef.current)   cancelAnimationFrame(rafRef.current);
    if (spawnRef.current)  clearInterval(spawnRef.current);
    if (countRef.current)  clearInterval(countRef.current);
    if (animRef.current)   clearInterval(animRef.current);
  };

  const resetGame = () => {
    stopAll();
    stRef.current = fresh();
    setPhase('ready');
    setAnimFrame(FRAME_IDLE);
    setRs({ ...stRef.current });
  };

  const startGame = () => {
    if (onLockSwipe) onLockSwipe();
    stRef.current.phase = 'play';
    setPhase('play');

    // countdown
    countRef.current = setInterval(() => {
      if (!mounted.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      s.timeLeft -= 1;
      if (s.timeLeft <= 0) {
        s.timeLeft = 0;
        s.phase = 'win';
        setPhase('win');
        stopAll();
        if (onUnlockSwipe) onUnlockSwipe();
        playCorrect();
        onCorrect();
      }
    }, 1000);

    // spawner
    spawnRef.current = setInterval(() => {
      if (!mounted.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      spawnItem(s);
    }, cfg.spawnMs);

    // walk animation (alternate frames 1↔2, or 3 while airborne)
    let wStep = FRAME_WALK1;
    animRef.current = setInterval(() => {
      if (!mounted.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      if (!s.onGround) {
        setAnimFrame(FRAME_JUMP);
      } else {
        wStep = wStep === FRAME_WALK1 ? FRAME_WALK2 : FRAME_WALK1;
        setAnimFrame(wStep);
      }
    }, 130);

    rafRef.current = requestAnimationFrame(loop);
  };

  const spawnItem = (s) => {
    const id = s.nextId++;
    const isFruit = Math.random() < cfg.fruitChance;
    if (isFruit) {
      s.fruits.push({
        id,
        x: GAME_W + 10,
        y: GROUND_Y - CHAR_H * 1.6 - Math.random() * 20,
      });
    } else {
      const f = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
      s.obstacles.push({ id, x: GAME_W + 10, y: GROUND_Y - f.h * OBJ_S, frame: f });
    }
  };

  const loop = () => {
    if (!mounted.current) return;
    const s = stRef.current;
    if (s.phase !== 'play') return;

    // character physics
    s.charVy += GRAVITY;
    s.charY  += s.charVy;
    if (s.charY >= GROUND_Y - CHAR_H) {
      s.charY = GROUND_Y - CHAR_H;
      s.charVy = 0;
      s.onGround = true;
      s.jumpsLeft = 2;
    } else {
      s.onGround = false;
    }

    // scroll objects
    const spd = cfg.speed;
    s.obstacles = s.obstacles
      .map(o => ({ ...o, x: o.x - spd }))
      .filter(o => o.x + o.frame.w * OBJ_S > -10);
    s.fruits = s.fruits
      .map(f => ({ ...f, x: f.x - spd }))
      .filter(f => f.x + FRUIT_FRAME.w * FRUIT_S > -10);

    // collision boxes (with margin)
    const mg = 7;
    const cL = CHAR_X + mg;
    const cR = CHAR_X + CHAR_W - mg;
    const cT = s.charY + mg;
    const cB = s.charY + CHAR_H - mg;

    // obstacle hit
    for (const o of s.obstacles) {
      const oL = o.x + mg;
      const oR = o.x + o.frame.w * OBJ_S - mg;
      const oT = o.y + mg;
      const oB = o.y + o.frame.h * OBJ_S - mg;
      if (cR > oL && cL < oR && cB > oT && cT < oB) {
        s.phase = 'dead';
        stopAll();
        if (onUnlockSwipe) onUnlockSwipe();
        setPhase('dead');
        setRs({ charY: s.charY, obstacles: [...s.obstacles], fruits: [...s.fruits], score: s.score, timeLeft: s.timeLeft, jumpsLeft: 0 });
        playWrong();
        onWrong();
        return;
      }
    }

    // fruit collect
    let collected = 0;
    s.fruits = s.fruits.filter(f => {
      const fW = FRUIT_FRAME.w * FRUIT_S;
      const fH = FRUIT_FRAME.h * FRUIT_S;
      if (cR > f.x && cL < f.x + fW && cB > f.y && cT < f.y + fH) {
        collected++;
        return false;
      }
      return true;
    });
    s.score += collected;

    setRs({
      charY: s.charY,
      obstacles: [...s.obstacles],
      fruits: [...s.fruits],
      score: s.score,
      timeLeft: s.timeLeft,
      jumpsLeft: s.jumpsLeft,
    });

    rafRef.current = requestAnimationFrame(loop);
  };

  const handleTap = () => {
    if (phase === 'ready') { startGame(); return; }
    if (phase !== 'play')  { resetGame(); return; }
    const s = stRef.current;
    if (s.jumpsLeft > 0) {
      playTap();
      s.charVy = JUMP_VY;
      s.onGround = false;
      s.jumpsLeft--;
    }
  };

  const state = rs || fresh();
  const charTop = state.charY !== undefined ? state.charY : GROUND_Y - CHAR_H;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Fufu Koşusu</Text>
      <View style={styles.hud}>
        <Text style={styles.hudText}>🍎 {state.score || 0}</Text>
        <Text style={styles.hudText}>⏱ {Math.ceil(state.timeLeft ?? cfg.duration)}s</Text>
      </View>

      <TouchableOpacity style={styles.arena} onPress={handleTap} activeOpacity={1}>
        {/* Background – static, covers full area */}
        <Image source={BG_IMG} style={styles.bgImage} />

        {/* Ground – grass top + soil body */}
        <View style={[styles.groundGrass, { top: GROUND_Y - 5 }]} />
        <View style={[styles.groundSoil,  { top: GROUND_Y + 1 }]} />

        {/* Obstacles */}
        {(state.obstacles || []).map(o => (
          <AtlasSprite
            key={o.id}
            source={OBJECTS_IMG}
            frame={o.frame}
            sw={OBJ_W} sh={OBJ_H}
            scale={OBJ_S}
            x={o.x} y={o.y}
          />
        ))}

        {/* Fruits */}
        {(state.fruits || []).map(f => (
          <AtlasSprite
            key={f.id}
            source={OBJECTS_IMG}
            frame={FRUIT_FRAME}
            sw={OBJ_W} sh={OBJ_H}
            scale={FRUIT_S}
            x={f.x} y={f.y}
          />
        ))}

        {/* Fufu character */}
        <View style={[styles.charWrap, { left: CHAR_X, top: charTop, width: CHAR_W, height: CHAR_H }]}>
          <Image
            source={FUFU_IMG}
            style={{
              width:  FUFU_SHEET_W * FUFU_SCALE,
              height: FUFU_SHEET_H * FUFU_SCALE,
              transform: [{ translateX: -animFrame * FUFU_FRAME_W * FUFU_SCALE }],
            }}
          />
        </View>

        {/* Jump dots */}
        {phase === 'play' && (state.jumpsLeft || 0) > 0 && (
          <View style={[styles.jumpDots, { left: CHAR_X }]}>
            {Array.from({ length: state.jumpsLeft }).map((_, i) => (
              <View key={i} style={styles.jumpDot} />
            ))}
          </View>
        )}

        {/* Overlays */}
        {phase === 'ready' && (
          <Overlay>
            <Text style={styles.ovTitle}>Fufu Koşusu</Text>
            <Text style={styles.ovDesc}>Dokunarak zıpla, çift zıplama!{'\n'}Meyveleri topla, engellerden kaç.</Text>
            <View style={[styles.btn, { backgroundColor: '#f97316' }]}>
              <Text style={styles.btnTxt}>BAŞLA</Text>
            </View>
          </Overlay>
        )}
        {phase === 'win' && (
          <Overlay>
            <Text style={styles.ovTitle}>Tebrikler! 🎉</Text>
            <Text style={styles.ovDesc}>Toplanan meyve: {state.score}</Text>
            <View style={[styles.btn, { backgroundColor: '#22c55e' }]}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </View>
          </Overlay>
        )}
        {phase === 'dead' && (
          <Overlay>
            <Text style={styles.ovTitle}>Çarptı! 💥</Text>
            <Text style={styles.ovDesc}>Meyve: {state.score}  |  Kalan: {Math.ceil(state.timeLeft)}s</Text>
            <View style={[styles.btn, { backgroundColor: '#ef4444' }]}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </View>
          </Overlay>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── Atlas sprite crop helper ──────────────────────────────────────────────────
function AtlasSprite({ source, frame, sw, sh, scale, x, y }) {
  return (
    <View style={{
      position: 'absolute',
      left: x, top: y,
      width: frame.w * scale,
      height: frame.h * scale,
      overflow: 'hidden',
    }}>
      <Image
        source={source}
        style={{
          width: sw * scale,
          height: sh * scale,
          transform: [
            { translateX: -frame.x * scale },
            { translateY: -frame.y * scale },
          ],
        }}
      />
    </View>
  );
}

function Overlay({ children }) {
  return <View style={styles.overlay}>{children}</View>;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    margin: 8,
  },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '900', marginBottom: 2 },
  hud: { flexDirection: 'row', gap: 24, marginBottom: 8 },
  hudText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
  arena: {
    width: GAME_W,
    height: GAME_H,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#87ceeb',
  },
  bgImage: {
    position: 'absolute',
    top: 0, left: 0,
    width: GAME_W,
    height: GAME_H,
    resizeMode: 'cover',
  },
  groundGrass: {
    position: 'absolute',
    left: 0, right: 0,
    height: 7,
    backgroundColor: 'rgba(30,140,30,0.75)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(10,100,10,0.9)',
  },
  groundSoil: {
    position: 'absolute',
    left: 0, right: 0,
    height: GAME_H,
    backgroundColor: 'rgba(90,55,20,0.55)',
  },
  charWrap: {
    position: 'absolute',
    overflow: 'hidden',
  },
  jumpDots: {
    position: 'absolute',
    top: 8,
    flexDirection: 'row',
    gap: 4,
  },
  jumpDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#facc15',
    opacity: 0.9,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.60)',
    zIndex: 20,
  },
  ovTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 8 },
  ovDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  btn: {
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 24,
  },
  btnTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
