import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, StyleSheet, Dimensions,
  TouchableOpacity,
} from 'react-native';
import { playCorrect, playWrong } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = SW;
const GAME_H = Math.min(SH - 80, 700);

// Sprite sizes
const PLAYER_W  = 64;
const PLAYER_H  = 64;
const BULLET_W  = 12;
const BULLET_H  = 28;
const ENEMY_MIN = 40;
const ENEMY_MAX = 64;

// Speed (original coords, px/sec)
const BULLET_SPD   = 420;
const PLAYER_SPD   = 320;
const ENEMY_BASE   = 90;
const FIRE_EVERY   = 0.45;   // seconds between auto-shots
const SPAWN_BASE   = 1.8;    // seconds between spawns (decreases with kills)
const WIN_KILLS    = 20;

const BG_IMG     = require('../assets/spaceshooter/background.png');
const PLAYER_IMG = require('../assets/spaceshooter/player.png');
const BULLET_IMG = require('../assets/spaceshooter/bullet.png');
const ENEMY_IMG  = require('../assets/spaceshooter/enemy.png');

let _bid = 0, _eid = 0;

function fresh() {
  return {
    playerX: GAME_W / 2 - PLAYER_W / 2,
    playerY: GAME_H - PLAYER_H - 16,
    bullets: [],
    enemies: [],
    score: 0,
    kills: 0,
    fireTimer: 0,
    spawnTimer: 0,
  };
}

function snapshot(s) {
  return {
    playerX: s.playerX,
    playerY: s.playerY,
    bullets: s.bullets.map(b => ({ ...b })),
    enemies: s.enemies.map(e => ({ ...e })),
    score: s.score,
    kills: s.kills,
  };
}

export default function SpaceShooterGame({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const [phase, setPhase] = useState('ready');
  const [rs,    setRs]    = useState(null);

  const stRef    = useRef(null);
  const rafRef   = useRef(null);
  const lastTs   = useRef(null);
  const touchX   = useRef(GAME_W / 2);
  const phaseRef = useRef('ready');
  const mounted  = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
      stopAll();
      if (onUnlockSwipe) onUnlockSwipe();
    };
  }, []);

  const stopAll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const startGame = () => {
    stopAll();
    _bid = 0; _eid = 0;
    stRef.current = fresh();
    touchX.current = GAME_W / 2;
    phaseRef.current = 'play';
    lastTs.current = null;
    if (onLockSwipe) onLockSwipe();
    setPhase('play');
    setRs(snapshot(stRef.current));
    rafRef.current = requestAnimationFrame(loop);
  };

  const loop = (ts) => {
    if (!mounted.current) return;
    const dt = lastTs.current ? Math.min((ts - lastTs.current) / 1000, 0.05) : 0.016;
    lastTs.current = ts;

    const s = stRef.current;
    if (!s) return;

    // ── Player follows finger ───────────────────────────────────────────────
    const targetX = touchX.current - PLAYER_W / 2;
    const diff    = targetX - s.playerX;
    const step    = PLAYER_SPD * dt;
    s.playerX += Math.abs(diff) < step ? diff : Math.sign(diff) * step;
    s.playerX = Math.max(0, Math.min(GAME_W - PLAYER_W, s.playerX));

    // ── Auto-fire ───────────────────────────────────────────────────────────
    s.fireTimer += dt;
    if (s.fireTimer >= FIRE_EVERY) {
      s.fireTimer = 0;
      s.bullets.push({
        id: _bid++,
        x: s.playerX + PLAYER_W / 2 - BULLET_W / 2,
        y: s.playerY - BULLET_H,
      });
    }

    // ── Move bullets up ─────────────────────────────────────────────────────
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      s.bullets[i].y -= BULLET_SPD * dt;
      if (s.bullets[i].y + BULLET_H < 0) s.bullets.splice(i, 1);
    }

    // ── Spawn enemies ────────────────────────────────────────────────────────
    s.spawnTimer += dt;
    const spawnInterval = Math.max(0.6, SPAWN_BASE - s.kills * 0.04);
    if (s.spawnTimer >= spawnInterval) {
      s.spawnTimer = 0;
      const size = ENEMY_MIN + Math.random() * (ENEMY_MAX - ENEMY_MIN);
      const spd  = ENEMY_BASE + s.kills * 3;
      s.enemies.push({
        id: _eid++,
        x: Math.random() * (GAME_W - size),
        y: -size,
        w: size, h: size,
        spd,
      });
    }

    // ── Move enemies down ────────────────────────────────────────────────────
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      s.enemies[i].y += s.enemies[i].spd * dt;
      if (s.enemies[i].y > GAME_H) s.enemies.splice(i, 1);
    }

    // ── Bullet ↔ Enemy collisions ───────────────────────────────────────────
    outer:
    for (let bi = s.bullets.length - 1; bi >= 0; bi--) {
      const b = s.bullets[bi];
      for (let ei = s.enemies.length - 1; ei >= 0; ei--) {
        const e = s.enemies[ei];
        if (b.x < e.x + e.w && b.x + BULLET_W > e.x &&
            b.y < e.y + e.h && b.y + BULLET_H > e.y) {
          s.bullets.splice(bi, 1);
          s.enemies.splice(ei, 1);
          s.score += 10;
          s.kills += 1;

          if (s.kills >= WIN_KILLS) {
            stopAll();
            phaseRef.current = 'win';
            setRs(snapshot(s));
            setPhase('win');
            if (onUnlockSwipe) onUnlockSwipe();
            playCorrect();
            onCorrect();
            return;
          }
          continue outer;
        }
      }
    }

    // ── Enemy ↔ Player collision ─────────────────────────────────────────────
    for (const e of s.enemies) {
      if (s.playerX < e.x + e.w && s.playerX + PLAYER_W > e.x &&
          s.playerY < e.y + e.h && s.playerY + PLAYER_H > e.y) {
        stopAll();
        phaseRef.current = 'over';
        setRs(snapshot(s));
        setPhase('over');
        if (onUnlockSwipe) onUnlockSwipe();
        playWrong();
        onWrong();
        return;
      }
    }

    setRs(snapshot(s));
    rafRef.current = requestAnimationFrame(loop);
  };

  const resetGame = () => {
    stopAll();
    phaseRef.current = 'ready';
    setPhase('ready');
    setRs(null);
  };

  const state = rs || {
    playerX: GAME_W / 2 - PLAYER_W / 2,
    playerY: GAME_H - PLAYER_H - 16,
    bullets: [], enemies: [], score: 0, kills: 0,
  };

  return (
    <View style={styles.root}>
      <View
        style={[styles.arena, { width: GAME_W, height: GAME_H }]}
        onStartShouldSetResponder={() => phaseRef.current === 'play'}
        onMoveShouldSetResponder={() => phaseRef.current === 'play'}
        onResponderGrant={e => { touchX.current = e.nativeEvent.locationX; }}
        onResponderMove={e => { touchX.current = e.nativeEvent.locationX; }}
      >
        {/* Background */}
        <Image source={BG_IMG} style={StyleSheet.absoluteFill} resizeMode="cover" />

        {/* Bullets */}
        {state.bullets.map(b => (
          <Image
            key={b.id} source={BULLET_IMG}
            style={{ position: 'absolute', left: b.x, top: b.y, width: BULLET_W, height: BULLET_H }}
            resizeMode="contain"
          />
        ))}

        {/* Enemies */}
        {state.enemies.map(e => (
          <Image
            key={e.id} source={ENEMY_IMG}
            style={{ position: 'absolute', left: e.x, top: e.y, width: e.w, height: e.h }}
            resizeMode="contain"
          />
        ))}

        {/* Player */}
        <Image
          source={PLAYER_IMG}
          style={{
            position: 'absolute',
            left: state.playerX, top: state.playerY,
            width: PLAYER_W, height: PLAYER_H,
          }}
          resizeMode="contain"
        />

        {/* HUD */}
        {phase === 'play' && (
          <View style={styles.hud}>
            <Text style={styles.hudTxt}>SKOR: {state.score}</Text>
            <Text style={styles.hudTxt}>{state.kills} / {WIN_KILLS} 💥</Text>
          </View>
        )}

        {/* Progress bar */}
        {phase === 'play' && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(state.kills / WIN_KILLS * 100)}%` }]} />
          </View>
        )}

        {/* Ready overlay */}
        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.ovTitle}>🚀 Space Shooter</Text>
            <Text style={styles.ovDesc}>
              Parmağını sürükleyerek{'\n'}gemiyi kontrol et.{'\n'}
              Otomatik ateş edilir.{'\n'}
              {WIN_KILLS} düşmanı yok et ve kazan!
            </Text>
            <TouchableOpacity style={styles.btn} onPress={startGame}>
              <Text style={styles.btnTxt}>BAŞLA</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Win overlay */}
        {phase === 'win' && (
          <View style={styles.overlay}>
            <Text style={styles.ovTitle}>🎉 Kazandın!</Text>
            <Text style={styles.ovDesc}>Skor: {state.score}</Text>
            <TouchableOpacity style={styles.btn} onPress={resetGame}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Game over overlay */}
        {phase === 'over' && (
          <View style={styles.overlay}>
            <Text style={styles.ovTitle}>💥 Vuruldun!</Text>
            <Text style={styles.ovDesc}>Skor: {state.score}</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#ef4444' }]} onPress={resetGame}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#000',
  },
  arena: { overflow: 'hidden', position: 'relative' },
  hud: {
    position: 'absolute', top: 10, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, zIndex: 10,
  },
  hudTxt: {
    color: '#fff', fontSize: 15, fontWeight: '800',
    textShadowColor: '#000', textShadowRadius: 4,
  },
  progressTrack: {
    position: 'absolute', bottom: 8, left: 12, right: 12,
    height: 6, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: '#a29bfe', borderRadius: 3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.78)', zIndex: 30,
    paddingHorizontal: 24,
  },
  ovTitle: {
    color: '#a29bfe', fontSize: 30, fontWeight: '900',
    marginBottom: 12, textAlign: 'center',
  },
  ovDesc: {
    color: '#ddd', fontSize: 14, textAlign: 'center',
    lineHeight: 24, marginBottom: 28,
  },
  btn: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 40, paddingVertical: 13, borderRadius: 24,
  },
  btnTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
