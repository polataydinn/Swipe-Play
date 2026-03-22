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
const FRAME_IDLE  = 0;
const FRAME_WALK1 = 1;
const FRAME_WALK2 = 2;

// ── Objects atlas (776×309) ──
const OBJ_W = 776;
const OBJ_H = 309;

// Falling item definitions – small objects from atlas
const FALLING_ITEMS = [
  { x: 739, y: 139, w: 30, h: 35, s: 1.1 },  // fruit
  { x: 688, y: 132, w: 49, h: 41, s: 0.85 }, // mushroom_1
  { x: 724, y:  30, w: 50, h: 41, s: 0.85 }, // mushroom_2
  { x: 649, y:  24, w: 73, h: 47, s: 0.60 }, // bush_3
  { x: 649, y:  73, w: 90, h: 54, s: 0.50 }, // stone
];

const PLAYER_Y_OFFSET = 60; // from bottom of game area
const PLAYER_Y = GAME_H - PLAYER_Y_OFFSET - CHAR_H;

const DIFFICULTY_CONFIG = {
  0: { duration: 30, spawnMs: 1800, fallSpd: 3,   maxItems: 6,  playerSpd: 5 },
  1: { duration: 30, spawnMs: 1200, fallSpd: 4.2,  maxItems: 9,  playerSpd: 6 },
  2: { duration: 25, spawnMs: 800,  fallSpd: 5.8,  maxItems: 12, playerSpd: 7 },
};

export default function BallDodge({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const [phase,     setPhase]     = useState('ready');
  const [rs,        setRs]        = useState(null);
  const [animFrame, setAnimFrame] = useState(FRAME_IDLE);

  const stRef    = useRef(null);
  const rafRef   = useRef(null);
  const spawnRef = useRef(null);
  const countRef = useRef(null);
  const animRef  = useRef(null);
  const mounted  = useRef(true);

  const fresh = () => ({
    playerX:   GAME_W / 2 - CHAR_W / 2,
    items:     [],
    timeLeft:  cfg.duration,
    moveDir:   0,
    nextId:    0,
    phase:     'ready',
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
      if (s.phase !== 'play' || s.items.length >= cfg.maxItems) return;
      const tmpl = FALLING_ITEMS[Math.floor(Math.random() * FALLING_ITEMS.length)];
      s.items.push({
        id: s.nextId++,
        x: tmpl.w * tmpl.s / 2 + Math.random() * (GAME_W - tmpl.w * tmpl.s),
        y: -tmpl.h * tmpl.s,
        vy: cfg.fallSpd + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 2.5,
        frame: tmpl,
      });
    }, cfg.spawnMs);

    // walk animation when moving
    let wStep = FRAME_WALK1;
    animRef.current = setInterval(() => {
      if (!mounted.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      if (s.moveDir !== 0) {
        wStep = wStep === FRAME_WALK1 ? FRAME_WALK2 : FRAME_WALK1;
        setAnimFrame(wStep);
      } else {
        setAnimFrame(FRAME_IDLE);
      }
    }, 130);

    rafRef.current = requestAnimationFrame(loop);
  };

  const loop = () => {
    if (!mounted.current) return;
    const s = stRef.current;
    if (s.phase !== 'play') return;

    // move player
    s.playerX += s.moveDir * cfg.playerSpd;
    s.playerX = Math.max(0, Math.min(GAME_W - CHAR_W, s.playerX));

    // update items
    for (const it of s.items) {
      it.vy += 0.15;
      it.x  += it.vx;
      it.y  += it.vy;
      if (it.x < 0)            { it.x = 0;                  it.vx =  Math.abs(it.vx); }
      if (it.x > GAME_W - it.frame.w * it.frame.s)
                                { it.x = GAME_W - it.frame.w * it.frame.s; it.vx = -Math.abs(it.vx); }
    }
    s.items = s.items.filter(it => it.y < GAME_H + 40);

    // collision
    const mg = 8;
    const pL = s.playerX + mg;
    const pR = s.playerX + CHAR_W - mg;
    const pT = PLAYER_Y + mg;
    const pB = PLAYER_Y + CHAR_H - mg;

    for (const it of s.items) {
      const iW = it.frame.w * it.frame.s;
      const iH = it.frame.h * it.frame.s;
      if (pR > it.x + mg && pL < it.x + iW - mg &&
          pB > it.y + mg && pT < it.y + iH - mg) {
        s.phase = 'dead';
        stopAll();
        if (onUnlockSwipe) onUnlockSwipe();
        setPhase('dead');
        setRs({ playerX: s.playerX, items: [...s.items], timeLeft: s.timeLeft });
        playWrong();
        onWrong();
        return;
      }
    }

    setRs({ playerX: s.playerX, items: [...s.items], timeLeft: s.timeLeft });
    rafRef.current = requestAnimationFrame(loop);
  };

  const setMoveDir = (dir) => {
    if (stRef.current?.phase === 'play') stRef.current.moveDir = dir;
  };

  const state = rs || fresh();
  const facingLeft = stRef.current?.moveDir === -1;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Top Kaçış</Text>
      <Text style={styles.sub}>Süre: {Math.ceil(state.timeLeft ?? cfg.duration)}s</Text>

      <View style={styles.arena}>
        {/* Background */}
        <Image source={BG_IMG} style={styles.bgImg} />

        {/* Ground strip */}
        <View style={styles.groundGrass} />
        <View style={styles.groundSoil}  />

        {/* Falling items */}
        {(state.items || []).map(it => (
          <AtlasSprite
            key={it.id}
            source={OBJECTS_IMG}
            frame={it.frame}
            sw={OBJ_W} sh={OBJ_H}
            scale={it.frame.s}
            x={it.x} y={it.y}
          />
        ))}

        {/* Player – Fufu */}
        <View style={[styles.charWrap, {
          left:      state.playerX,
          top:       PLAYER_Y,
          width:     CHAR_W,
          height:    CHAR_H,
          transform: [{ scaleX: facingLeft ? -1 : 1 }],
        }]}>
          <Image
            source={FUFU_IMG}
            style={{
              width:  FUFU_SHEET_W * FUFU_SCALE,
              height: FUFU_SHEET_H * FUFU_SCALE,
              transform: [{ translateX: -animFrame * FUFU_FRAME_W * FUFU_SCALE }],
            }}
          />
        </View>

        {/* Touch zones */}
        {phase === 'play' && (
          <>
            <TouchableOpacity
              style={styles.leftZone}
              onPressIn={() => setMoveDir(-1)}
              onPressOut={() => setMoveDir(0)}
              activeOpacity={1}
            >
              <Text style={styles.zoneArrow}>◀</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rightZone}
              onPressIn={() => setMoveDir(1)}
              onPressOut={() => setMoveDir(0)}
              activeOpacity={1}
            >
              <Text style={styles.zoneArrow}>▶</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'ready' && (
          <Overlay>
            <Text style={styles.ovTitle}>Top Kaçış</Text>
            <Text style={styles.ovDesc}>Sol/Sağ'a basılı tut{'\n'}nesnelerden kaç!</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#f97316' }]} onPress={startGame}>
              <Text style={styles.btnTxt}>BAŞLA</Text>
            </TouchableOpacity>
          </Overlay>
        )}
        {phase === 'win' && (
          <Overlay>
            <Text style={styles.ovTitle}>Harika! 🎉</Text>
            <Text style={styles.ovDesc}>Hayatta kaldın!</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#22c55e' }]} onPress={resetGame}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </TouchableOpacity>
          </Overlay>
        )}
        {phase === 'dead' && (
          <Overlay>
            <Text style={styles.ovTitle}>Çarpıştı! 💥</Text>
            <Text style={styles.ovDesc}>Kalan süre: {Math.ceil(state.timeLeft)}s</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#ef4444' }]} onPress={resetGame}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </TouchableOpacity>
          </Overlay>
        )}
      </View>
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
const GROUND_Y_POS = GAME_H - 56;

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
  bgImg: {
    position: 'absolute', top: 0, left: 0,
    width: GAME_W, height: GAME_H, resizeMode: 'cover',
  },
  groundGrass: {
    position: 'absolute', left: 0, right: 0,
    top: GROUND_Y_POS - 5, height: 7,
    backgroundColor: 'rgba(30,140,30,0.75)',
    borderTopWidth: 1, borderTopColor: 'rgba(10,100,10,0.9)',
  },
  groundSoil: {
    position: 'absolute', left: 0, right: 0,
    top: GROUND_Y_POS + 2, height: GAME_H,
    backgroundColor: 'rgba(90,55,20,0.55)',
  },
  charWrap: { position: 'absolute', overflow: 'hidden' },
  leftZone: {
    position: 'absolute', left: 0, top: 0,
    width: GAME_W / 2, height: GAME_H,
    justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 12,
  },
  rightZone: {
    position: 'absolute', right: 0, top: 0,
    width: GAME_W / 2, height: GAME_H,
    justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 12,
  },
  zoneArrow: { color: 'rgba(255,255,255,0.25)', fontSize: 28, fontWeight: '900' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 10,
  },
  ovTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 8 },
  ovDesc: {
    color: 'rgba(255,255,255,0.8)', fontSize: 14,
    textAlign: 'center', marginBottom: 20, lineHeight: 22,
  },
  btn: { paddingHorizontal: 36, paddingVertical: 12, borderRadius: 24 },
  btnTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
