import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

const FUFU_IMG    = require('../assets/dino/fufu.png');
const BG_IMG      = require('../assets/dino/BG.png');
const OBJECTS_IMG = require('../assets/dino/objects.png');

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 16, 360);
const GAME_H = Math.min(SH * 0.68, 520);

// ── Fufu sprite (828×140, 4 frames of 207px) ──
const FUFU_SHEET_W = 828;
const FUFU_SHEET_H = 140;
const FUFU_FRAME_W = 207;
const FUFU_SCALE   = 0.30;
const CHAR_W = FUFU_FRAME_W * FUFU_SCALE;
const CHAR_H = FUFU_SHEET_H * FUFU_SCALE;
const FRAME_WALK1 = 1;
const FRAME_WALK2 = 2;
const FRAME_JUMP  = 3;

// ── Objects atlas (776×309) ──
const OBJ_W = 776;
const OBJ_H = 309;

// Ground obstacles
const GROUND_OBSTACLES = [
  { x: 649, y:  73, w: 90, h: 54 }, // stone
  { x: 570, y:  50, w: 77, h: 77 }, // crate
  { x: 649, y:  24, w: 73, h: 47 }, // bush_3
];
// Airborne obstacles (appear at mid-height, dodge by crouching low… but we
// only have jump, so treat them as high obstacles that require NOT jumping).
// Visually they float – use mushrooms.
const FLY_OBSTACLES = [
  { x: 688, y: 132, w: 49, h: 41 }, // mushroom_1
  { x: 724, y:  30, w: 50, h: 41 }, // mushroom_2
];
const OBJ_SCALE = 0.80;

// ── BG parallax – two copies side by side ──
// With resizeMode='stretch' we tile manually
const BG_TILE_W = GAME_W; // each copy fills game width

const CHAR_X    = GAME_W * 0.14;
const GRAVITY   = 0.55;
const JUMP_VY   = -13;
const GROUND_Y  = GAME_H * 0.78;

const DIFFICULTY_CONFIG = {
  0: { duration: 30, speed: 5,   spawnMs: 1700, flyChance: 0.30 },
  1: { duration: 28, speed: 6.5, spawnMs: 1200, flyChance: 0.45 },
  2: { duration: 25, speed: 9,   spawnMs: 850,  flyChance: 0.60 },
};

export default function BikeJump({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const [phase,     setPhase]     = useState('ready');
  const [rs,        setRs]        = useState(null);
  const [animFrame, setAnimFrame] = useState(FRAME_WALK1);

  const stRef    = useRef(null);
  const rafRef   = useRef(null);
  const spawnRef = useRef(null);
  const countRef = useRef(null);
  const animRef  = useRef(null);
  const mounted  = useRef(true);

  const fresh = () => ({
    phase:     'ready',
    charY:     GROUND_Y - CHAR_H,
    charVy:    0,
    onGround:  true,
    jumpsLeft: 2,
    obstacles: [],
    timeLeft:  cfg.duration,
    nextId:    0,
    bgOffset:  0,
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
    setAnimFrame(FRAME_WALK1);
    setRs({ ...stRef.current });
  };

  const startGame = () => {
    if (onLockSwipe) onLockSwipe();
    stRef.current.phase = 'play';
    setPhase('play');

    countRef.current = setInterval(() => {
      if (!mounted.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      s.timeLeft -= 1;
      if (s.timeLeft <= 0) {
        s.timeLeft = 0;
        s.phase = 'win';
        stopAll();
        if (onUnlockSwipe) onUnlockSwipe();
        setPhase('win');
        playCorrect();
        onCorrect();
      }
    }, 1000);

    spawnRef.current = setInterval(() => {
      if (!mounted.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      const isFly = Math.random() < cfg.flyChance;
      const id    = s.nextId++;
      if (isFly) {
        const f = FLY_OBSTACLES[Math.floor(Math.random() * FLY_OBSTACLES.length)];
        s.obstacles.push({
          id, x: GAME_W + 20,
          y: GROUND_Y - CHAR_H * 1.8,
          frame: f, scale: OBJ_SCALE, type: 'fly',
        });
      } else {
        const f = GROUND_OBSTACLES[Math.floor(Math.random() * GROUND_OBSTACLES.length)];
        s.obstacles.push({
          id, x: GAME_W + 20,
          y: GROUND_Y - f.h * OBJ_SCALE,
          frame: f, scale: OBJ_SCALE, type: 'ground',
        });
      }
    }, cfg.spawnMs);

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

  const loop = () => {
    if (!mounted.current) return;
    const s = stRef.current;
    if (s.phase !== 'play') return;

    // physics
    s.charVy += GRAVITY;
    s.charY  += s.charVy;
    if (s.charY >= GROUND_Y - CHAR_H) {
      s.charY    = GROUND_Y - CHAR_H;
      s.charVy   = 0;
      s.onGround = true;
      s.jumpsLeft = 2;
    } else {
      s.onGround = false;
    }

    // scroll BG
    s.bgOffset = (s.bgOffset + cfg.speed * 0.5) % BG_TILE_W;

    // move obstacles
    s.obstacles = s.obstacles
      .map(o => ({ ...o, x: o.x - cfg.speed }))
      .filter(o => o.x + o.frame.w * o.scale > -10);

    // collision (AABB with margin)
    const mg = 7;
    const cL = CHAR_X + mg;
    const cR = CHAR_X + CHAR_W - mg;
    const cT = s.charY + mg;
    const cB = s.charY + CHAR_H - mg;

    for (const o of s.obstacles) {
      const oL = o.x + mg;
      const oR = o.x + o.frame.w * o.scale - mg;
      const oT = o.y + mg;
      const oB = o.y + o.frame.h * o.scale - mg;
      if (cR > oL && cL < oR && cB > oT && cT < oB) {
        s.phase = 'dead';
        stopAll();
        if (onUnlockSwipe) onUnlockSwipe();
        setPhase('dead');
        setRs({ charY: s.charY, obstacles: [...s.obstacles], timeLeft: s.timeLeft, jumpsLeft: 0, bgOffset: s.bgOffset });
        playWrong();
        onWrong();
        return;
      }
    }

    setRs({
      charY:     s.charY,
      obstacles: [...s.obstacles],
      timeLeft:  s.timeLeft,
      jumpsLeft: s.jumpsLeft,
      bgOffset:  s.bgOffset,
    });

    rafRef.current = requestAnimationFrame(loop);
  };

  const handleTap = () => {
    if (phase === 'ready') { startGame(); return; }
    if (phase !== 'play')  { resetGame(); return; }
    playTap();
    const s = stRef.current;
    if (s.jumpsLeft > 0) {
      s.charVy    = JUMP_VY;
      s.onGround  = false;
      s.jumpsLeft--;
    }
  };

  const state   = rs || fresh();
  const charTop = state.charY !== undefined ? state.charY : GROUND_Y - CHAR_H;
  const bgOff   = state.bgOffset || 0;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Bisikletçi</Text>
      <Text style={styles.sub}>Süre: {Math.ceil(state.timeLeft ?? cfg.duration)}s</Text>

      <TouchableOpacity style={styles.arena} onPress={handleTap} activeOpacity={1}>
        {/* Parallax BG – two tiles scrolling left */}
        <Image source={BG_IMG} style={[styles.bgTile, { left: -bgOff }]} />
        <Image source={BG_IMG} style={[styles.bgTile, { left: BG_TILE_W - bgOff }]} />

        {/* Ground */}
        <View style={styles.groundGrass} />
        <View style={styles.groundSoil}  />

        {/* Obstacles */}
        {(state.obstacles || []).map(o => (
          <AtlasSprite
            key={o.id}
            source={OBJECTS_IMG}
            frame={o.frame}
            sw={OBJ_W} sh={OBJ_H}
            scale={o.scale}
            x={o.x} y={o.y}
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

        {phase === 'ready' && (
          <Overlay>
            <Text style={styles.ovTitle}>Bisikletçi</Text>
            <Text style={styles.ovDesc}>Dokunarak zıpla!{'\n'}Çift zıplama yapabilirsin.</Text>
            <View style={[styles.btn, { backgroundColor: '#22c55e' }]}>
              <Text style={styles.btnTxt}>BAŞLA</Text>
            </View>
          </Overlay>
        )}
        {phase === 'win' && (
          <Overlay>
            <Text style={styles.ovTitle}>Tebrikler! 🎉</Text>
            <Text style={styles.ovDesc}>Bitişe ulaştın!</Text>
            <View style={[styles.btn, { backgroundColor: '#22c55e' }]}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </View>
          </Overlay>
        )}
        {phase === 'dead' && (
          <Overlay>
            <Text style={styles.ovTitle}>Çarptı! 💥</Text>
            <Text style={styles.ovDesc}>Kalan süre: {Math.ceil(state.timeLeft)}s</Text>
            <View style={[styles.btn, { backgroundColor: '#ef4444' }]}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </View>
          </Overlay>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
function AtlasSprite({ source, frame, sw, sh, scale, x, y }) {
  return (
    <View style={{ position: 'absolute', left: x, top: y,
                   width: frame.w * scale, height: frame.h * scale,
                   overflow: 'hidden' }}>
      <Image source={source} style={{
        width: sw * scale, height: sh * scale,
        transform: [{ translateX: -frame.x * scale }, { translateY: -frame.y * scale }],
      }} />
    </View>
  );
}

function Overlay({ children }) {
  return <View style={styles.overlay}>{children}</View>;
}

// ── styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 8, backgroundColor: COLORS.surface, borderRadius: 20, margin: 8,
  },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '900', marginBottom: 2 },
  sub:   { color: COLORS.textSecondary, fontSize: 13, marginBottom: 8 },
  arena: {
    width: GAME_W, height: GAME_H,
    borderRadius: 12, overflow: 'hidden', position: 'relative',
    backgroundColor: '#87ceeb',
  },
  bgTile: {
    position: 'absolute', top: 0,
    width: BG_TILE_W, height: GAME_H,
    resizeMode: 'cover',
  },
  groundGrass: {
    position: 'absolute', left: 0, right: 0,
    top: GROUND_Y - 5, height: 7,
    backgroundColor: 'rgba(30,140,30,0.75)',
    borderTopWidth: 1, borderTopColor: 'rgba(10,100,10,0.9)',
  },
  groundSoil: {
    position: 'absolute', left: 0, right: 0,
    top: GROUND_Y + 2, height: GAME_H,
    backgroundColor: 'rgba(90,55,20,0.55)',
  },
  charWrap: { position: 'absolute', overflow: 'hidden' },
  jumpDots: {
    position: 'absolute', top: 8,
    flexDirection: 'row', gap: 4,
  },
  jumpDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#facc15', opacity: 0.9,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 20,
  },
  ovTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 8 },
  ovDesc: {
    color: 'rgba(255,255,255,0.8)', fontSize: 14,
    textAlign: 'center', marginBottom: 20, lineHeight: 22,
  },
  btn: { paddingHorizontal: 36, paddingVertical: 12, borderRadius: 24 },
  btnTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
