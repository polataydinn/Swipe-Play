import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

// ── attackonball assets ────────────────────────────────────────────────────────
const BG_IMG       = require('../assets/attackonball/Bg.png');
const LAND_IMG     = require('../assets/attackonball/Land0.png');
const STICKMAN_IMG = require('../assets/attackonball/Stickman.png');
const BALL_IMGS    = [
  require('../assets/attackonball/Ball0.png'),
  require('../assets/attackonball/Ball1.png'),
  require('../assets/attackonball/Ball2.png'),
  require('../assets/attackonball/Ball3.png'),
  require('../assets/attackonball/Ball4.png'),
];

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 16, 360);
const GAME_H = Math.min(SH * 0.68, 520);

// ── Stickman sprite: 256×64 → 4 frames of 64×64 ──────────────────────────────
const STK_SHEET_W = 256;
const STK_SHEET_H = 64;
const STK_FRAME_W = 64;
const STK_SCALE   = 0.75;   // display: 48×48
const CHAR_W = STK_FRAME_W * STK_SCALE;
const CHAR_H = STK_SHEET_H  * STK_SCALE;

// ── Ball: 100×98, display at ~0.38 scale ─────────────────────────────────────
const BALL_SCALE  = 0.38;
const BALL_W      = 100 * BALL_SCALE;  // ≈38
const BALL_H      = 98  * BALL_SCALE;  // ≈37

// ── Ground: Land0.png 1216×204, tile it across game width ────────────────────
const LAND_H_ORIG = 204;
const LAND_SCALE  = 0.22;
const LAND_DISP_H = LAND_H_ORIG * LAND_SCALE; // ≈45
const LAND_DISP_W = 1216 * LAND_SCALE;        // ≈267

const GROUND_Y  = GAME_H - LAND_DISP_H;
const PLAYER_Y  = GROUND_Y - CHAR_H;

const DIFFICULTY_CONFIG = {
  0: { duration: 30, spawnMs: 1600, fallSpd: 3,   maxBalls: 6,  playerSpd: 5 },
  1: { duration: 30, spawnMs: 1100, fallSpd: 4.2,  maxBalls: 9,  playerSpd: 6 },
  2: { duration: 25, spawnMs: 750,  fallSpd: 5.8,  maxBalls: 12, playerSpd: 7 },
};

export default function BallDodge({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const [phase,     setPhase]     = useState('ready');
  const [rs,        setRs]        = useState(null);
  const [animFrame, setAnimFrame] = useState(0);

  const stRef    = useRef(null);
  const rafRef   = useRef(null);
  const spawnRef = useRef(null);
  const countRef = useRef(null);
  const animRef  = useRef(null);
  const mounted  = useRef(true);

  const fresh = () => ({
    playerX: GAME_W / 2 - CHAR_W / 2,
    balls: [],
    timeLeft: cfg.duration,
    moveDir: 0,
    nextId: 0,
    phase: 'ready',
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
    setAnimFrame(0);
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
      if (s.phase !== 'play' || s.balls.length >= cfg.maxBalls) return;
      s.balls.push({
        id:    s.nextId++,
        x:     BALL_W / 2 + Math.random() * (GAME_W - BALL_W),
        y:     -BALL_H,
        vy:    cfg.fallSpd + Math.random() * 1.5,
        vx:    (Math.random() - 0.5) * 2.5,
        imgIdx: Math.floor(Math.random() * 5),
      });
    }, cfg.spawnMs);

    // walk animation (cycle stickman frames while moving)
    let wStep = 0;
    animRef.current = setInterval(() => {
      if (!mounted.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      if (s.moveDir !== 0) {
        wStep = (wStep + 1) % 4;
        setAnimFrame(wStep);
      } else {
        setAnimFrame(0);
      }
    }, 120);

    rafRef.current = requestAnimationFrame(loop);
  };

  const loop = () => {
    if (!mounted.current) return;
    const s = stRef.current;
    if (s.phase !== 'play') return;

    // move player
    s.playerX += s.moveDir * cfg.playerSpd;
    s.playerX = Math.max(0, Math.min(GAME_W - CHAR_W, s.playerX));

    // update balls
    for (const b of s.balls) {
      b.vy += 0.15;
      b.x  += b.vx;
      b.y  += b.vy;
      if (b.x < 0)               { b.x = 0;               b.vx =  Math.abs(b.vx); }
      if (b.x > GAME_W - BALL_W) { b.x = GAME_W - BALL_W; b.vx = -Math.abs(b.vx); }
    }
    s.balls = s.balls.filter(b => b.y < GAME_H + 20);

    // collision (AABB with margin)
    const mg = 8;
    const pL = s.playerX + mg;
    const pR = s.playerX + CHAR_W - mg;
    const pT = PLAYER_Y + mg;
    const pB = PLAYER_Y + CHAR_H - mg;

    for (const b of s.balls) {
      if (pR > b.x + mg && pL < b.x + BALL_W - mg &&
          pB > b.y + mg && pT < b.y + BALL_H - mg) {
        s.phase = 'dead';
        stopAll();
        if (onUnlockSwipe) onUnlockSwipe();
        setPhase('dead');
        setRs({ playerX: s.playerX, balls: [...s.balls], timeLeft: s.timeLeft });
        playWrong();
        onWrong();
        return;
      }
    }

    setRs({ playerX: s.playerX, balls: [...s.balls], timeLeft: s.timeLeft });
    rafRef.current = requestAnimationFrame(loop);
  };

  const setMoveDir = (dir) => {
    if (stRef.current?.phase === 'play') stRef.current.moveDir = dir;
  };

  const state      = rs || fresh();
  const facingLeft = stRef.current?.moveDir === -1;

  // Tile count to cover game width with land strip
  const landTiles = Math.ceil(GAME_W / LAND_DISP_W) + 1;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Top Kaçış</Text>
      <Text style={styles.sub}>Süre: {Math.ceil(state.timeLeft ?? cfg.duration)}s</Text>

      <View style={styles.arena}>
        {/* Background */}
        <Image source={BG_IMG} style={styles.bgImg} />

        {/* Ground – tiled Land strip */}
        {Array.from({ length: landTiles }).map((_, i) => (
          <Image
            key={i}
            source={LAND_IMG}
            style={[styles.landTile, { left: i * LAND_DISP_W, top: GROUND_Y }]}
          />
        ))}

        {/* Falling balls */}
        {(state.balls || []).map(b => (
          <Image
            key={b.id}
            source={BALL_IMGS[b.imgIdx]}
            style={[styles.ball, { left: b.x, top: b.y }]}
          />
        ))}

        {/* Player – stickman sprite */}
        <View style={[styles.charWrap, {
          left:      state.playerX,
          top:       PLAYER_Y,
          width:     CHAR_W,
          height:    CHAR_H,
          transform: [{ scaleX: facingLeft ? -1 : 1 }],
        }]}>
          <Image
            source={STICKMAN_IMG}
            style={{
              width:  STK_SHEET_W * STK_SCALE,
              height: STK_SHEET_H * STK_SCALE,
              transform: [{ translateX: -animFrame * STK_FRAME_W * STK_SCALE }],
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
            <Text style={styles.ovDesc}>Sol/Sağ'a basılı tut{'\n'}toplardan kaç!</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#e74c3c' }]} onPress={startGame}>
              <Text style={styles.btnTxt}>BAŞLA</Text>
            </TouchableOpacity>
          </Overlay>
        )}
        {phase === 'win' && (
          <Overlay>
            <Text style={styles.ovTitle}>Harika! 🎉</Text>
            <Text style={styles.ovDesc}>Hayatta kaldın!</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#27ae60' }]} onPress={resetGame}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </TouchableOpacity>
          </Overlay>
        )}
        {phase === 'dead' && (
          <Overlay>
            <Text style={styles.ovTitle}>Çarptı! 💥</Text>
            <Text style={styles.ovDesc}>Kalan süre: {Math.ceil(state.timeLeft)}s</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#e74c3c' }]} onPress={resetGame}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </TouchableOpacity>
          </Overlay>
        )}
      </View>
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
    backgroundColor: '#b0d8f0',
  },
  bgImg: {
    position: 'absolute', top: 0, left: 0,
    width: GAME_W, height: GAME_H, resizeMode: 'cover',
  },
  landTile: {
    position: 'absolute',
    width: LAND_DISP_W,
    height: LAND_DISP_H,
    resizeMode: 'stretch',
  },
  ball: {
    position: 'absolute',
    width:  BALL_W,
    height: BALL_H,
    resizeMode: 'contain',
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
  zoneArrow: { color: 'rgba(255,255,255,0.30)', fontSize: 28, fontWeight: '900' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.60)', zIndex: 10,
  },
  ovTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 8 },
  ovDesc: {
    color: 'rgba(255,255,255,0.8)', fontSize: 14,
    textAlign: 'center', marginBottom: 20, lineHeight: 22,
  },
  btn:    { paddingHorizontal: 36, paddingVertical: 12, borderRadius: 24 },
  btnTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
