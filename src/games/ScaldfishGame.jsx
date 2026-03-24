import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

const BG_IMG    = require('../assets/scaldfish/bg.jpg');
const BLOCK_IMG = require('../assets/scaldfish/sp_1.png');
const CLOUD_IMG = require('../assets/scaldfish/cloud.png');

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = Math.min(SW - 16, 380);
const GAME_H = Math.min(SH * 0.68, 520);

const BLOCK_MAX_W = 130;
const BLOCK_H     = 70;

// Stack grows upward from STACK_BASE_Y
// worldY(i) = STACK_BASE_Y - i * BLOCK_H   (i=0 oldest/bottom, increases upward)
const STACK_BASE_Y  = GAME_H - BLOCK_H - 15;   // ≈ 435
const DROP_ZONE_Y   = 18;                        // oscillating block sits here
const MIN_LAND_Y    = DROP_ZONE_Y + 90;          // camera clamps landing no higher than this

const FALL_SPEED  = 7;   // px per frame

const SCALE_MIN  = 0.22;
const SCALE_MAX  = 1.0;
const SCALE_STEP = 0.07;

const MAX_LIVES = 3;

const DIFFICULTY_CONFIG = {
  0: { winScore: 5,  intervalMs: 120 },
  1: { winScore: 8,  intervalMs: 75  },
  2: { winScore: 12, intervalMs: 50  },
};

// ── Camera helpers ──────────────────────────────────────────────────────────
// scrollOffset shifts everything DOWN so the landing zone stays visible
function getScrollOffset(stackLen) {
  const worldLandY = STACK_BASE_Y - stackLen * BLOCK_H;
  return Math.max(0, MIN_LAND_Y - worldLandY);
}
function worldToScreen(worldY, scrollOffset) {
  return worldY + scrollOffset;
}
function getLandingScreenY(stackLen) {
  const worldLandY = STACK_BASE_Y - stackLen * BLOCK_H;
  const offset     = getScrollOffset(stackLen);
  return worldToScreen(worldLandY, offset); // always ≥ MIN_LAND_Y
}

export default function ScaldfishGame({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const [phase, setPhase] = useState('ready');
  const [rs, setRs]       = useState(null);

  const stRef   = useRef(null);
  const rafRef  = useRef(null);
  const oscRef  = useRef(null);
  const mounted = useRef(true);

  const fresh = () => ({
    phase: 'ready',
    oscScale: SCALE_MIN,
    oscDir: 1,
    stack: [],          // scale values: index 0 = oldest (bottom), last = newest (top)
    score: 0,
    lives: MAX_LIVES,
    falling: false,
    rejected: false,    // visual flash on wrong drop
    fallingScale: SCALE_MIN,
    fallingY: DROP_ZONE_Y,
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
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (oscRef.current) clearInterval(oscRef.current);
  };

  const resetGame = () => {
    stopAll();
    stRef.current = fresh();
    setPhase('ready');
    setRs({ ...stRef.current });
  };

  const startOscillation = () => {
    if (oscRef.current) clearInterval(oscRef.current);
    oscRef.current = setInterval(() => {
      if (!mounted.current) return;
      const s = stRef.current;
      if (s.phase !== 'play' || s.falling || s.rejected) return;
      s.oscScale += SCALE_STEP * s.oscDir;
      if (s.oscScale >= SCALE_MAX) { s.oscScale = SCALE_MAX; s.oscDir = -1; }
      else if (s.oscScale <= SCALE_MIN) { s.oscScale = SCALE_MIN; s.oscDir = 1; }
      setRs(prev => ({ ...prev, oscScale: s.oscScale }));
    }, cfg.intervalMs);
  };

  const startGame = () => {
    if (onLockSwipe) onLockSwipe();
    stRef.current.phase = 'play';
    setPhase('play');
    startOscillation();
  };

  const dropBlock = () => {
    const s = stRef.current;
    if (s.falling || s.rejected) return;
    playTap();
    s.falling      = true;
    s.fallingScale = s.oscScale;
    s.fallingY     = DROP_ZONE_Y;
    setRs(prev => ({ ...prev, falling: true, fallingScale: s.fallingScale, fallingY: DROP_ZONE_Y }));
    rafRef.current = requestAnimationFrame(fallLoop);
  };

  const fallLoop = () => {
    if (!mounted.current) return;
    const s = stRef.current;
    if (s.phase !== 'play') return;

    s.fallingY += FALL_SPEED;
    const targetY = getLandingScreenY(s.stack.length);

    if (s.fallingY >= targetY) {
      // Block reached landing position — stop here first
      s.fallingY = targetY;
      s.falling  = false;

      const prevScale = s.stack.length > 0 ? s.stack[s.stack.length - 1] : Infinity;

      if (s.fallingScale > prevScale) {
        // Wrong drop: block too wide — flash red, lose a life, resume oscillation
        s.rejected = true;
        s.lives--;
        setRs({ ...s });
        playWrong();

        setTimeout(() => {
          if (!mounted.current) return;
          const s2 = stRef.current;
          if (s2.phase !== 'play') return;

          if (s2.lives <= 0) {
            // No lives left → game over
            s2.phase = 'dead';
            stopAll();
            if (onUnlockSwipe) onUnlockSwipe();
            setPhase('dead');
            setRs({ ...s2 });
            onWrong();
          } else {
            // Still alive: reset block, resume oscillation
            s2.rejected    = false;
            s2.falling     = false;
            s2.oscScale    = SCALE_MIN;
            s2.oscDir      = 1;
            setRs({ ...s2 });
          }
        }, 350);
      } else {
        // Correct drop: block lands on top, stays there
        s.stack.push(s.fallingScale);
        s.score++;

        if (s.score >= cfg.winScore) {
          s.phase = 'win';
          stopAll();
          if (onUnlockSwipe) onUnlockSwipe();
          setPhase('win');
          setRs({ ...s });
          playCorrect();
          onCorrect();
        } else {
          s.oscScale = SCALE_MIN;
          s.oscDir   = 1;
          setRs({ ...s });
        }
      }
    } else {
      setRs(prev => ({ ...prev, fallingY: s.fallingY }));
      rafRef.current = requestAnimationFrame(fallLoop);
    }
  };

  const handleTap = () => {
    if (phase === 'ready') { startGame(); return; }
    if (phase !== 'play')  { resetGame(); return; }
    const s = stRef.current;
    if (!s.falling && !s.rejected) dropBlock();
  };

  const state    = rs || fresh();
  const stackLen = (state.stack || []).length;
  const offset   = getScrollOffset(stackLen);

  // Active block Y and scale
  const isActive     = phase === 'play';
  const activeScale  = state.falling || state.rejected ? state.fallingScale : state.oscScale;
  const activeY      = state.falling ? state.fallingY
                     : state.rejected ? getLandingScreenY(stackLen)
                     : DROP_ZONE_Y;
  const activeW      = BLOCK_MAX_W * activeScale;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Fener İstifi</Text>
      <View style={styles.hud}>
        <Text style={styles.hudText}>🏮 {state.score || 0} / {cfg.winScore}</Text>
        <Text style={styles.hudText}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => i < (state.lives ?? MAX_LIVES) ? '❤️' : '🖤').join('')}
        </Text>
      </View>

      <TouchableOpacity style={styles.arena} onPress={handleTap} activeOpacity={1}>
        {/* Background */}
        <Image source={BG_IMG} style={styles.bgImage} />
        <Image source={CLOUD_IMG} style={styles.cloud} />

        {/* Stacked blocks — each stays at its world position */}
        {(state.stack || []).map((sc, i) => {
          const screenY = worldToScreen(STACK_BASE_Y - i * BLOCK_H, offset);
          const bW      = BLOCK_MAX_W * sc;
          if (screenY > GAME_H || screenY + BLOCK_H < 0) return null; // off screen
          return (
            <Image
              key={i}
              source={BLOCK_IMG}
              style={{
                position: 'absolute',
                top:    screenY,
                left:   (GAME_W - bW) / 2,
                width:  bW,
                height: BLOCK_H,
              }}
              resizeMode="stretch"
            />
          );
        })}

        {/* Active (falling / rejected / oscillating) block */}
        {isActive && (
          <Image
            source={BLOCK_IMG}
            style={[{
              position: 'absolute',
              top:    activeY,
              left:   (GAME_W - activeW) / 2,
              width:  activeW,
              height: BLOCK_H,
            }, state.rejected && styles.blockRejected]}
            resizeMode="stretch"
          />
        )}

        {/* Overlays */}
        {phase === 'ready' && (
          <Overlay>
            <Text style={styles.ovTitle}>🏮 Fener İstifi</Text>
            <Text style={styles.ovDesc}>
              Fener sallanırken tam zamanda dokun!{'\n'}
              Her yeni fener öncekinden dar olmalı.{'\n'}
              {cfg.winScore} feneri istifle, 3 hakkın var!
            </Text>
            <View style={[styles.btn, { backgroundColor: '#c0392b' }]}>
              <Text style={styles.btnTxt}>BAŞLA</Text>
            </View>
          </Overlay>
        )}
        {phase === 'win' && (
          <Overlay>
            <Text style={styles.ovTitle}>Tebrikler! 🎉</Text>
            <Text style={styles.ovDesc}>{state.score} feneri başarıyla istifledin!</Text>
            <View style={[styles.btn, { backgroundColor: '#22c55e' }]}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </View>
          </Overlay>
        )}
        {phase === 'dead' && (
          <Overlay>
            <Text style={styles.ovTitle}>Devrildi! 💥</Text>
            <Text style={styles.ovDesc}>İstif: {state.score} / {cfg.winScore}</Text>
            <View style={[styles.btn, { backgroundColor: '#ef4444' }]}>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    margin: 8,
  },
  title:   { color: COLORS.text, fontSize: 22, fontWeight: '900', marginBottom: 2 },
  hud:     { flexDirection: 'row', gap: 20, marginBottom: 8 },
  hudText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
  arena: {
    width: GAME_W,
    height: GAME_H,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1a0505',
  },
  bgImage: {
    position: 'absolute',
    top: 0, left: 0,
    width: GAME_W,
    height: GAME_H,
    resizeMode: 'cover',
  },
  cloud: {
    position: 'absolute',
    bottom: 0, left: 0,
    width: GAME_W,
    height: 70,
    resizeMode: 'stretch',
    opacity: 0.55,
  },
  blockRejected: {
    opacity: 0.45,
    tintColor: '#ff4444',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.68)',
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
