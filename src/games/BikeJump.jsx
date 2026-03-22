import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

// ── bike assets ───────────────────────────────────────────────────────────────
const BG_IMG     = require('../assets/bike/gameBg_0.jpg');
const PLAYER_IMG = require('../assets/bike/player_json.png');
const BIRD_IMG   = require('../assets/bike/bird.png');
const ROD_IMG    = require('../assets/bike/rod.png');

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 16, 360);
const GAME_H = Math.min(SH * 0.68, 520);

// ── Player sprite sheet: 350×350, 4 frames of 161×164 ────────────────────────
// Positions: (0,0) (166,0) (0,169) (166,169)
const P_SHEET_W = 350;
const P_SHEET_H = 350;
const P_FRAME_W = 161;
const P_FRAME_H = 164;
const P_SCALE   = 0.28;   // display: ~45×46
const CHAR_W    = P_FRAME_W * P_SCALE;
const CHAR_H    = P_FRAME_H * P_SCALE;

const P_FRAMES = [
  { x:   0, y:   0 },
  { x: 166, y:   0 },
  { x:   0, y: 169 },
  { x: 166, y: 169 },
];

// ── Bird obstacle: 108×55 ──────────────────────────────────────────────────
const BIRD_SCALE = 0.45;
const BIRD_W     = 108 * BIRD_SCALE;
const BIRD_H     = 55  * BIRD_SCALE;

// ── Rod obstacle: 750×225 (single image used as ground barrier) ───────────────
const ROD_SCALE = 0.14;
const ROD_W     = 750 * ROD_SCALE;  // ≈105
const ROD_H     = 225 * ROD_SCALE;  // ≈32

// ── Layout ────────────────────────────────────────────────────────────────────
const CHAR_X   = GAME_W * 0.14;
const GRAVITY  = 0.55;
const JUMP_VY  = -13;
const GROUND_Y = GAME_H * 0.78;

const DIFFICULTY_CONFIG = {
  0: { duration: 30, speed: 5,   spawnMs: 1700, flyChance: 0.30 },
  1: { duration: 28, speed: 6.5, spawnMs: 1200, flyChance: 0.45 },
  2: { duration: 25, speed: 9,   spawnMs: 850,  flyChance: 0.60 },
};

export default function BikeJump({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const [phase,     setPhase]     = useState('ready');
  const [rs,        setRs]        = useState(null);
  const [frameIdx,  setFrameIdx]  = useState(0);
  const [birdFlap,  setBirdFlap]  = useState(0); // 0 or 1 for bird wing

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
    setFrameIdx(0);
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
        // Bird flies at mid height – must jump over or duck under
        s.obstacles.push({
          id, x: GAME_W + 20,
          y: GROUND_Y - CHAR_H * 1.8,
          type: 'bird',
        });
      } else {
        // Rod on the ground
        s.obstacles.push({
          id, x: GAME_W + 20,
          y: GROUND_Y - ROD_H,
          type: 'rod',
        });
      }
    }, cfg.spawnMs);

    // Animate player frames + bird flap
    let pStep = 0;
    let bStep = 0;
    animRef.current = setInterval(() => {
      if (!mounted.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      // Player: cycle walk frames on ground, hold jump frame in air
      if (s.onGround) {
        pStep = (pStep + 1) % 4;
        setFrameIdx(pStep);
      } else {
        setFrameIdx(3); // airborne frame
      }
      // Bird flap
      bStep = bStep === 0 ? 1 : 0;
      setBirdFlap(bStep);
    }, 120);

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

    // scroll bg
    s.bgOffset = (s.bgOffset + cfg.speed * 0.4) % GAME_W;

    // move obstacles
    s.obstacles = s.obstacles
      .map(o => ({ ...o, x: o.x - cfg.speed }))
      .filter(o => o.x + (o.type === 'bird' ? BIRD_W : ROD_W) > -10);

    // collision (AABB with margin)
    const mg = 7;
    const cL = CHAR_X + mg;
    const cR = CHAR_X + CHAR_W - mg;
    const cT = s.charY + mg;
    const cB = s.charY + CHAR_H - mg;

    for (const o of s.obstacles) {
      const oW = o.type === 'bird' ? BIRD_W : ROD_W;
      const oH = o.type === 'bird' ? BIRD_H : ROD_H;
      if (cR > o.x + mg && cL < o.x + oW - mg &&
          cB > o.y + mg && cT < o.y + oH - mg) {
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
  const pf      = P_FRAMES[frameIdx] || P_FRAMES[0];

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Bisikletçi</Text>
      <Text style={styles.sub}>Süre: {Math.ceil(state.timeLeft ?? cfg.duration)}s</Text>

      <TouchableOpacity style={styles.arena} onPress={handleTap} activeOpacity={1}>
        {/* Parallax BG – two copies */}
        <Image source={BG_IMG} style={[styles.bgTile, { left: -bgOff }]} />
        <Image source={BG_IMG} style={[styles.bgTile, { left: GAME_W - bgOff }]} />

        {/* Obstacles */}
        {(state.obstacles || []).map(o => {
          if (o.type === 'bird') {
            return (
              <Image
                key={o.id}
                source={BIRD_IMG}
                style={[styles.bird, {
                  left: o.x, top: o.y,
                  transform: [{ scaleX: birdFlap === 1 ? -1 : 1 }],
                }]}
              />
            );
          }
          return (
            <Image
              key={o.id}
              source={ROD_IMG}
              style={[styles.rod, { left: o.x, top: o.y }]}
            />
          );
        })}

        {/* Player – cycling through 4 sprite frames */}
        <View style={[styles.charWrap, { left: CHAR_X, top: charTop, width: CHAR_W, height: CHAR_H }]}>
          <Image
            source={PLAYER_IMG}
            style={{
              width:  P_SHEET_W * P_SCALE,
              height: P_SHEET_H * P_SCALE,
              transform: [
                { translateX: -pf.x * P_SCALE },
                { translateY: -pf.y * P_SCALE },
              ],
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
            <View style={[styles.btn, { backgroundColor: '#27ae60' }]}>
              <Text style={styles.btnTxt}>BAŞLA</Text>
            </View>
          </Overlay>
        )}
        {phase === 'win' && (
          <Overlay>
            <Text style={styles.ovTitle}>Tebrikler! 🎉</Text>
            <Text style={styles.ovDesc}>Bitişe ulaştın!</Text>
            <View style={[styles.btn, { backgroundColor: '#27ae60' }]}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </View>
          </Overlay>
        )}
        {phase === 'dead' && (
          <Overlay>
            <Text style={styles.ovTitle}>Çarptı! 💥</Text>
            <Text style={styles.ovDesc}>Kalan süre: {Math.ceil(state.timeLeft)}s</Text>
            <View style={[styles.btn, { backgroundColor: '#e74c3c' }]}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </View>
          </Overlay>
        )}
      </TouchableOpacity>
    </View>
  );
}

function Overlay({ children }) {
  return <View style={styles.overlay}>{children}</View>;
}

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
    width: GAME_W, height: GAME_H,
    resizeMode: 'cover',
  },
  bird: {
    position: 'absolute',
    width: BIRD_W, height: BIRD_H,
    resizeMode: 'contain',
  },
  rod: {
    position: 'absolute',
    width: ROD_W, height: ROD_H,
    resizeMode: 'stretch',
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
    backgroundColor: 'rgba(0,0,0,0.60)', zIndex: 20,
  },
  ovTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 8 },
  ovDesc: {
    color: 'rgba(255,255,255,0.8)', fontSize: 14,
    textAlign: 'center', marginBottom: 20, lineHeight: 22,
  },
  btn:    { paddingHorizontal: 36, paddingVertical: 12, borderRadius: 24 },
  btnTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
