import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, Pressable } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

const LANDSCAPE_IMG = require('../assets/quickrush3/landscape.png');
const TREES_IMG     = require('../assets/quickrush3/trees.png');
const PLATFORM_IMG  = require('../assets/quickrush3/platform.png');
const RUNNING_IMG   = require('../assets/quickrush3/running.png');
const COIN_IMG      = require('../assets/quickrush3/coin.png');
const OBSTACLE_IMG  = require('../assets/quickrush3/obstacle.png');

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 16, 380);
const GAME_H = Math.min(SH * 0.68, 520);

// Platform: 120×12 stretched to 240×24
const PLAT_W = 240;
const PLAT_H = 24;

// Character: 64×16 spritesheet, 4 frames of 16×16, scale ×3 → 48×48
const CHAR_FRAMES  = 4;
const CHAR_FRAME_W = 16;
const CHAR_FRAME_H = 16;
const CHAR_SCALE   = 3;
const CHAR_W       = CHAR_FRAME_W * CHAR_SCALE; // 48
const CHAR_H       = CHAR_FRAME_H * CHAR_SCALE; // 48
const CHAR_X       = GAME_W * 0.18;             // fixed horizontal position

// Coin: first frame 10×10 scaled ×2 → 20×20
const COIN_W = 20;
const COIN_H = 20;

// Obstacle: 19×19 scaled ×2 → 38×38
const OBS_W = 38;
const OBS_H = 38;

// Physics — tuned for snappy, responsive feel
const GRAVITY = 0.72;   // px/frame²
const JUMP_VY = -15.5;  // immediate upward velocity on jump

// Platforms: 3 height tiers
const PLAT_YS = [
  GAME_H - 90,
  GAME_H - 155,
  GAME_H - 215,
];
const PLAT_GAP     = 80;
const PLAT_SPACING = PLAT_W + PLAT_GAP;

// Progressive difficulty
const BASE_SPEED    = 3.5;
const MAX_SPEED     = 9.0;
const SPEED_PER_M   = 0.003;   // speed added per pixel of distance
const OBS_BASE_PROB = 0.30;
const OBS_MAX_PROB  = 0.65;

function getSpeed(dist)   { return Math.min(MAX_SPEED, BASE_SPEED + dist * SPEED_PER_M); }
function getObsProb(dist) { return Math.min(OBS_MAX_PROB, OBS_BASE_PROB + dist * 0.00008); }
function getLevelLabel(dist) {
  const lv = Math.min(10, Math.floor(dist / 800) + 1);
  return lv;
}

// Axis-aligned rect overlap
function overlaps(ax, ay, aw, ah, bx, by, bw, bh, tol = 5) {
  return (
    ax + tol < bx + bw - tol &&
    ax + aw - tol > bx + tol &&
    ay + tol < by + bh &&
    ay + ah  > by + tol
  );
}

function makePlatforms() {
  return [0, 1, 2].map((i) => ({
    x:    GAME_W * 0.25 + i * PLAT_SPACING,
    y:    PLAT_YS[i % PLAT_YS.length],
    coin: { xOff: PLAT_W / 2 - COIN_W / 2, collected: false },
    obs:  null, // no obstacles at start
  }));
}

function spawnPlatform(existing, dist) {
  const last = existing.reduce((a, b) => (a.x > b.x ? a : b));
  const yIdx = Math.floor(Math.random() * PLAT_YS.length);
  const hasObs = dist > 200 && Math.random() < getObsProb(dist);
  return {
    x:    last.x + PLAT_SPACING,
    y:    PLAT_YS[yIdx],
    coin: { xOff: PLAT_W / 2 - COIN_W / 2, collected: false },
    obs:  hasObs ? { xOff: PLAT_W * 0.62 } : null,
  };
}

const FRAME_MS  = 1000 / 60;
const FRAME_DUR = 110; // ms per animation frame

export default function QuickRushGame({ onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const [phase, setPhase]     = useState('ready');
  const [rs, setRs]           = useState(null);
  const phaseRef              = useRef('ready');

  const stRef        = useRef(null);
  const rafRef       = useRef(null);
  const lastRef      = useRef(null);
  const mounted      = useRef(true);
  const frameRef     = useRef(0);
  const frameTimeRef = useRef(0);

  const setPhaseSync = (v) => { phaseRef.current = v; setPhase(v); };

  const fresh = () => ({
    charY:       PLAT_YS[0] - CHAR_H,
    charVY:      0,
    prevCharY:   PLAT_YS[0] - CHAR_H,
    onGround:    true,
    platforms:   makePlatforms(),
    coins:       0,
    distance:    0,
    scrollX:     0,
    animFrame:   0,
  });

  useEffect(() => {
    stRef.current = fresh();
    setRs({ ...stRef.current });
    return () => {
      mounted.current = false;
      stopLoop();
      if (onUnlockSwipe) onUnlockSwipe();
    };
  }, []);

  const stopLoop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const resetGame = () => {
    stopLoop();
    stRef.current     = fresh();
    frameRef.current  = 0;
    frameTimeRef.current = 0;
    setPhaseSync('ready');
    setRs({ ...stRef.current });
  };

  const startGame = () => {
    if (onLockSwipe) onLockSwipe();
    setPhaseSync('play');
    lastRef.current = performance.now();
    rafRef.current  = requestAnimationFrame(loop);
  };

  // ── Called directly on press — zero-delay jump ────────────────────────────
  const handlePressIn = () => {
    const ph = phaseRef.current;
    if (ph === 'ready')              { startGame(); return; }
    if (ph === 'dead' || ph === 'win') { resetGame(); return; }
    if (ph !== 'play') return;

    const s = stRef.current;
    if (s.onGround) {
      s.charVY   = JUMP_VY;
      s.onGround = false;
      playTap();
    }
  };

  // ── Main game loop ────────────────────────────────────────────────────────
  const loop = (now) => {
    if (!mounted.current) return;
    const s = stRef.current;
    if (!s || phaseRef.current !== 'play') return;

    const dt    = Math.min(now - (lastRef.current ?? now), 50);
    lastRef.current = now;
    const steps = dt / FRAME_MS;
    const speed = getSpeed(s.distance) * steps;

    // ── Scroll platforms ──
    s.platforms.forEach(p => { p.x -= speed; });

    // Recycle off-screen platforms, spawn new ones
    s.platforms = s.platforms.filter(p => p.x + PLAT_W > -20);
    while (s.platforms.length < 4) {
      s.platforms.push(spawnPlatform(s.platforms, s.distance));
    }

    // ── Physics ──
    s.prevCharY = s.charY;
    s.charVY   += GRAVITY * steps;
    s.charY    += s.charVY * steps;

    // ── Platform collision (swept — checks previous + current position) ──
    s.onGround = false;
    for (const p of s.platforms) {
      const charLeft   = CHAR_X + 6;
      const charRight  = CHAR_X + CHAR_W - 6;
      const platLeft   = p.x + 4;
      const platRight  = p.x + PLAT_W - 4;

      const hOverlap = charRight > platLeft && charLeft < platRight;
      if (!hOverlap) continue;

      const prevBottom = s.prevCharY + CHAR_H;
      const curBottom  = s.charY    + CHAR_H;

      // Character was above platform top last frame, at or below this frame
      if (prevBottom <= p.y + 2 && curBottom >= p.y && s.charVY >= 0) {
        s.charY    = p.y - CHAR_H;
        s.charVY   = 0;
        s.onGround = true;
        break;
      }
    }

    // ── Distance & parallax ──
    s.distance += speed;
    s.scrollX  += speed;

    // ── Coin collection ──
    for (const p of s.platforms) {
      const c = p.coin;
      if (!c || c.collected) continue;
      const cx = p.x + c.xOff;
      const cy = p.y - COIN_H - 6;
      if (overlaps(CHAR_X, s.charY, CHAR_W, CHAR_H, cx, cy, COIN_W, COIN_H)) {
        c.collected = true;
        s.coins++;
      }
    }

    // ── Obstacle collision ──
    for (const p of s.platforms) {
      if (!p.obs) continue;
      const ox = p.x + p.obs.xOff;
      const oy = p.y - OBS_H;
      if (overlaps(CHAR_X, s.charY, CHAR_W, CHAR_H, ox, oy, OBS_W, OBS_H, 8)) {
        stopLoop();
        if (onUnlockSwipe) onUnlockSwipe();
        setPhaseSync('dead');
        setRs({ ...s });
        playWrong();
        onWrong();
        return;
      }
    }

    // ── Fall off screen ──
    if (s.charY > GAME_H + 60) {
      stopLoop();
      if (onUnlockSwipe) onUnlockSwipe();
      setPhaseSync('dead');
      setRs({ ...s });
      playWrong();
      onWrong();
      return;
    }

    // ── Animate character ──
    frameTimeRef.current += dt;
    if (frameTimeRef.current >= FRAME_DUR) {
      frameTimeRef.current = 0;
      frameRef.current = (frameRef.current + 1) % CHAR_FRAMES;
      s.animFrame = frameRef.current;
    }

    setRs({ ...s });
    rafRef.current = requestAnimationFrame(loop);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const state    = rs ?? fresh();
  const dist     = Math.floor(state.distance);
  const level    = getLevelLabel(dist);

  // Parallax
  const LAND_W   = 960 * (GAME_H / 400);
  const TREES_W2 = 600 * (GAME_H / 320);
  const landOff  = -(state.scrollX * 0.12) % LAND_W;
  const treesOff = -(state.scrollX * 0.30) % TREES_W2;

  const charSrcX = state.animFrame * CHAR_FRAME_W * CHAR_SCALE;

  // Level color
  const levelColors = ['#22c55e','#84cc16','#eab308','#f97316','#ef4444',
                       '#dc2626','#c026d3','#9333ea','#6c5ce7','#e11d48'];
  const lvColor = levelColors[Math.min(level - 1, 9)];

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Hızlı Koşu</Text>
      <View style={styles.hud}>
        <Text style={styles.hudText}>🪙 {state.coins}</Text>
        <Text style={styles.hudText}>📏 {dist}m</Text>
        <Text style={[styles.hudText, { color: lvColor }]}>Lv.{level}</Text>
      </View>

      <Pressable style={styles.arena} onPressIn={handlePressIn}>
        {/* Sky */}
        {[0, 1].map(i => (
          <Image key={'l' + i} source={LANDSCAPE_IMG}
            style={{ position:'absolute', bottom:0, left: landOff + i * LAND_W,
                     width: LAND_W, height: GAME_H }}
            resizeMode="stretch"
          />
        ))}

        {/* Trees */}
        {[0, 1].map(i => (
          <Image key={'t' + i} source={TREES_IMG}
            style={{ position:'absolute', bottom:0, left: treesOff + i * TREES_W2,
                     width: TREES_W2, height: GAME_H }}
            resizeMode="stretch"
          />
        ))}

        {/* Platforms */}
        {state.platforms.map((p, i) => (
          <View key={i} style={{ position:'absolute', left: p.x, top: p.y }}>
            <Image source={PLATFORM_IMG}
              style={{ width: PLAT_W, height: PLAT_H }}
              resizeMode="stretch"
            />
            {p.coin && !p.coin.collected && (
              <View style={{
                position:'absolute', top: -COIN_H - 6, left: p.coin.xOff,
                width: COIN_W, height: COIN_H, overflow:'hidden',
              }}>
                <Image source={COIN_IMG}
                  style={{ width: 46, height: COIN_H }}
                  resizeMode="stretch"
                />
              </View>
            )}
            {p.obs && (
              <Image source={OBSTACLE_IMG}
                style={{ position:'absolute', top: -OBS_H, left: p.obs.xOff,
                         width: OBS_W, height: OBS_H }}
                resizeMode="stretch"
              />
            )}
          </View>
        ))}

        {/* Character */}
        {phase !== 'ready' && (
          <View style={{
            position:'absolute', left: CHAR_X, top: state.charY,
            width: CHAR_W, height: CHAR_H, overflow:'hidden',
          }}>
            <Image source={RUNNING_IMG}
              style={{
                position:'absolute', left: -charSrcX, top: 0,
                width: CHAR_FRAME_W * CHAR_SCALE * CHAR_FRAMES,
                height: CHAR_H,
              }}
              resizeMode="stretch"
            />
          </View>
        )}

        {/* Overlays */}
        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.ovTitle}>🏃 Hızlı Koşu</Text>
            <Text style={styles.ovDesc}>
              Platformdan platforma zıpla!{'\n'}
              Sikkeleri topla, engellerden kaç.{'\n'}
              Ne kadar ileri gidebilirsin?
            </Text>
            <View style={[styles.btn, { backgroundColor: '#6c5ce7' }]}>
              <Text style={styles.btnTxt}>BAŞLA</Text>
            </View>
          </View>
        )}
        {phase === 'dead' && (
          <View style={styles.overlay}>
            <Text style={styles.ovTitle}>Game Over 💥</Text>
            <Text style={styles.ovDesc}>
              📏 {dist}m  🪙 {state.coins} sikke{'\n'}
              Lv.{level} — {level < 5 ? 'Daha iyi yapabilirsin!' : level < 8 ? 'Fena değil!' : 'Harika gidiş!'}
            </Text>
            <View style={[styles.btn, { backgroundColor: '#ef4444' }]}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}

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
  title:   { color: COLORS.text, fontSize: 22, fontWeight: '900', marginBottom: 2 },
  hud:     { flexDirection: 'row', gap: 16, marginBottom: 8 },
  hudText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
  arena: {
    width: GAME_W,
    height: GAME_H,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#87ceeb',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    zIndex: 20,
  },
  ovTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 8 },
  ovDesc: {
    color: 'rgba(255,255,255,0.85)',
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
