import React, { useState, useEffect, useRef, memo } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Image, TouchableOpacity,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

// ── Assets ─────────────────────────────────────────────────────────────────────
const TILES_IMG  = require('../assets/pacman/pacman-tiles.png');
const PACMAN_IMG = require('../assets/pacman/pacman.png');
const GHOSTS_IMG = require('../assets/pacman/ghosts32.png');
const DOT_IMG    = require('../assets/pacman/dot.png');
const PILL_IMG   = require('../assets/pacman/pill16.png');
const MAP_DATA   = require('../assets/pacman/pacman-map.json');

const { width: SW } = Dimensions.get('window');

// ── Map constants ──────────────────────────────────────────────────────────────
const TILE = 16, MW = 28, MH = 31;
const SAFE = 14, DOT_T = 7, PILL_T = 40;
const MAP  = MAP_DATA.layers[0].data; // 868 values

// ── Scale ──────────────────────────────────────────────────────────────────────
const GAME_W = Math.min(SW - 4, 390);
const SCALE  = GAME_W / (MW * TILE);   // = GAME_W / 448
const TILE_D = TILE * SCALE;
const GAME_H = MH * TILE_D;

// ── Tileset: 256×48 = 16 cols × 3 rows of 16×16 tiles ────────────────────────
const TS_SHEET_W = 256;
const TS_SHEET_H = 48;

// ── Pac-Man sprite: 448×32 = 14 frames of 32px ───────────────────────────────
const PAC_SW  = 448;
const PAC_FW  = 32;
const PAC_DISP = TILE_D * 1.7; // display size
const PAC_MUNCH_FRAMES = [0, 1, 2, 1];
const PAC_DEATH_FRAMES = [3,4,5,6,7,8,9,10,11,12,13];

// ── Ghost sprite: 128×192 = 4 cols × 6 rows of 32px ──────────────────────────
const G_SW   = 128;
const G_SH   = 192;
const G_FW   = 32;
const G_DISP = PAC_DISP;
// dir → frame-within-ghost-block: left=0, up=1, down=2, right=3
const DIR_F  = { left:0, up:1, down:2, right:3 };

// Ghost definitions (all start outside house on row 11 corridor)
const GHOST_DEFS = [
  { name:'blinky', offset:12, col:13, row:11, dir:'right' },
  { name:'pinky',  offset: 8, col:14, row:11, dir:'left'  },
  { name:'inky',   offset: 0, col:15, row:11, dir:'right' },
  { name:'clyde',  offset: 4, col:12, row:11, dir:'left'  },
];

// ── Dot / Pill display ─────────────────────────────────────────────────────────
const DOT_DISP  = Math.max(3, 4  * SCALE);
const PILL_DISP = TILE_D * 0.80;

// Pre-compute dot/pill positions once
const DOT_POS  = [];
const PILL_POS = [];
MAP.forEach((t, idx) => {
  const col = idx % MW, row = Math.floor(idx / MW);
  if (t === DOT_T)  DOT_POS.push({ col, row, idx });
  if (t === PILL_T) PILL_POS.push({ col, row, idx });
});

// ── Movement helpers ───────────────────────────────────────────────────────────
const PAC_SPD    = 90;   // px/sec (original coords)
const GHOST_SPD  = 68;
const FRIGHT_SPD = 42;
const THRESHOLD  = 4;    // px tolerance to cell center for turning

const DIR_VEC = { left:[-1,0], right:[1,0], up:[0,-1], down:[0,1] };
const OPPOSITE = { left:'right', right:'left', up:'down', down:'up' };

function isSafe(col, row, forGhost = false) {
  if (row < 0 || row >= MH) return false;
  const c = ((col % MW) + MW) % MW;
  const t = MAP[row * MW + c];
  if (forGhost) return t === SAFE || t === DOT_T || t === PILL_T || t === 35 || t === 36;
  return t === SAFE || t === DOT_T || t === PILL_T;
}

function cellCenter(col, row) {
  return [col * TILE + TILE / 2, row * TILE + TILE / 2];
}

// ── Memoised static wall layer ─────────────────────────────────────────────────
const WallLayer = memo(() => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {MAP.map((t, i) => {
      if (t === SAFE || t === DOT_T || t === PILL_T || t === 35 || t === 36) return null;
      const col = i % MW, row = Math.floor(i / MW);
      const tsCol = (t - 1) % 16;
      const tsRow = Math.floor((t - 1) / 16);
      return (
        <View key={i} style={{
          position: 'absolute',
          left: col * TILE_D, top: row * TILE_D,
          width: TILE_D, height: TILE_D,
          overflow: 'hidden',
        }}>
          <Image
            source={TILES_IMG}
            style={{
              width: TS_SHEET_W * SCALE,
              height: TS_SHEET_H * SCALE,
              transform: [
                { translateX: -tsCol * TILE_D },
                { translateY: -tsRow * TILE_D },
              ],
            }}
          />
        </View>
      );
    })}
  </View>
));

// ── Main component ─────────────────────────────────────────────────────────────
export default function PacmanGame({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {

  const [phase,       setPhase]       = useState('ready');
  const [rs,          setRs]          = useState(null);
  const [pacFrame,    setPacFrame]    = useState(0);   // index into PAC_MUNCH_FRAMES
  const [gFrightFlip, setGFrightFlip] = useState(0);  // 0|1 for ghost frightened flash
  const [deathFrame,  setDeathFrame]  = useState(0);  // for death animation

  const stRef   = useRef(null);
  const rafRef  = useRef(null);
  const animRef = useRef(null);
  const mounted = useRef(true);
  const lastTs  = useRef(null);

  // Eaten sets (refs — not state, to avoid stale closure re-creates)
  const eatenDots  = useRef(new Set());
  const eatenPills = useRef(new Set());
  const [eatTick, setEatTick] = useState(0); // bumped to trigger dot layer re-render

  const fresh = () => ({
    pacX: 14 * TILE + TILE / 2,
    pacY: 17 * TILE + TILE / 2,
    pacVx: -1, pacVy: 0,
    pacDir: 'left', pacWant: 'left',
    lives: 3, score: 0,
    frightUntil: 0,
    ghosts: GHOST_DEFS.map(g => {
      const [cx, cy] = cellCenter(g.col, g.row);
      return { ...g, x: cx, y: cy, vx: g.dir === 'right' ? 1 : -1, vy: 0 };
    }),
  });

  useEffect(() => {
    stRef.current = fresh();
    setRs(snapshot(stRef.current, 0));
    return () => {
      mounted.current = false;
      stopAll();
      if (onUnlockSwipe) onUnlockSwipe();
    };
  }, []);

  const stopAll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (animRef.current) clearInterval(animRef.current);
  };

  const resetGame = () => {
    stopAll();
    eatenDots.current  = new Set();
    eatenPills.current = new Set();
    stRef.current = fresh();
    setPhase('ready');
    setPacFrame(0);
    setDeathFrame(0);
    setEatTick(0);
    setRs(snapshot(stRef.current, 0));
  };

  const startGame = () => {
    if (onLockSwipe) onLockSwipe();
    setPhase('play');
    lastTs.current = null;
    // Munch animation
    let mStep = 0;
    let fStep = 0;
    animRef.current = setInterval(() => {
      if (!mounted.current) return;
      mStep = (mStep + 1) % PAC_MUNCH_FRAMES.length;
      setPacFrame(mStep);
      fStep = fStep === 0 ? 1 : 0;
      setGFrightFlip(fStep);
    }, 100);
    rafRef.current = requestAnimationFrame(loop);
  };

  const loop = (ts) => {
    if (!mounted.current) return;
    const dt = lastTs.current ? Math.min((ts - lastTs.current) / 1000, 0.05) : 0.016;
    lastTs.current = ts;

    const s = stRef.current;
    if (!s) return;

    const now = ts;
    const frightened = now < s.frightUntil;

    // ── Move Pac-Man ────────────────────────────────────────────────────────────
    const pSpd = PAC_SPD;

    // Try to apply desired direction at grid center
    const pCol = Math.floor(s.pacX / TILE);
    const pRow = Math.floor(s.pacY / TILE);
    const [pcx, pcy] = cellCenter(pCol, pRow);

    const wantDir = s.pacWant;
    const curDir  = s.pacDir;
    if (wantDir && wantDir !== curDir) {
      const wv = DIR_VEC[wantDir];
      const cv = DIR_VEC[curDir];
      const sameAxis = (wv[0] !== 0) === (cv[0] !== 0); // same horizontal/vertical
      if (sameAxis) {
        // 180° turn: always allow
        if (wantDir === OPPOSITE[curDir]) {
          s.pacDir = wantDir; s.pacVx = wv[0]; s.pacVy = wv[1];
        }
      } else {
        // Perpendicular: need to be near cell center on the movement axis
        const nearCenter = s.pacVx !== 0
          ? Math.abs(s.pacY - pcy) < THRESHOLD
          : Math.abs(s.pacX - pcx) < THRESHOLD;
        if (nearCenter && isSafe(pCol + wv[0], pRow + wv[1])) {
          if (s.pacVx !== 0) s.pacY = pcy; else s.pacX = pcx;
          s.pacDir = wantDir; s.pacVx = wv[0]; s.pacVy = wv[1];
        }
      }
    }

    // Move
    const nx = s.pacX + s.pacVx * pSpd * dt;
    const ny = s.pacY + s.pacVy * pSpd * dt;

    // Wall collision
    const ncol = Math.floor(nx / TILE), nrow = Math.floor(ny / TILE);
    if (isSafe(ncol, nrow)) { s.pacX = nx; s.pacY = ny; }
    else {
      // Snap to cell center to prevent getting stuck
      s.pacX = pcx; s.pacY = pcy;
      s.pacVx = 0;  s.pacVy = 0;
    }

    // Tunnel wrap
    if (s.pacX < 0)          s.pacX = MW * TILE - 1;
    if (s.pacX >= MW * TILE) s.pacX = 1;

    // ── Collect dots ───────────────────────────────────────────────────────────
    const eatCol = Math.round((s.pacX - TILE/2) / TILE);
    const eatRow = Math.round((s.pacY - TILE/2) / TILE);
    const eatIdx = eatRow * MW + eatCol;
    let ateSmth = false;
    if (MAP[eatIdx] === DOT_T && !eatenDots.current.has(eatIdx)) {
      eatenDots.current.add(eatIdx);
      s.score += 10;
      ateSmth = true;
    }
    if (MAP[eatIdx] === PILL_T && !eatenPills.current.has(eatIdx)) {
      eatenPills.current.add(eatIdx);
      s.score += 50;
      s.frightUntil = ts + 7000;
      ateSmth = true;
    }
    if (ateSmth) setEatTick(c => c + 1);

    // Win check
    if (eatenDots.current.size >= DOT_POS.length) {
      stopAll();
      if (onUnlockSwipe) onUnlockSwipe();
      setPhase('win');
      playCorrect();
      onCorrect();
      return;
    }

    // ── Move ghosts ────────────────────────────────────────────────────────────
    for (const g of s.ghosts) {
      const gSpd = frightened ? FRIGHT_SPD : GHOST_SPD;
      const gCol = Math.floor(g.x / TILE);
      const gRow = Math.floor(g.y / TILE);
      const [gcx, gcy] = cellCenter(gCol, gRow);
      const nearCenterX = Math.abs(g.x - gcx) < THRESHOLD;
      const nearCenterY = Math.abs(g.y - gcy) < THRESHOLD;

      if (nearCenterX && nearCenterY) {
        // Pick direction at intersection
        const possible = ['left','right','up','down'].filter(d => {
          if (d === OPPOSITE[g.dir]) return false; // no reverse
          const [dvx, dvy] = DIR_VEC[d];
          return isSafe(gCol + dvx, gRow + dvy, true);
        });
        if (possible.length === 0) {
          // Dead end: allow reverse
          const rev = OPPOSITE[g.dir];
          if (rev) possible.push(rev);
        }
        if (possible.length > 0) {
          // 60% toward Pac-Man for blinky, else random
          let chosen;
          if (!frightened && g.name === 'blinky' && Math.random() < 0.6) {
            const dx = s.pacX - g.x, dy = s.pacY - g.y;
            const best = possible.reduce((best, d) => {
              const [dvx, dvy] = DIR_VEC[d];
              const dot = dvx * dx + dvy * dy;
              return dot > best.dot ? { d, dot } : best;
            }, { d: possible[0], dot: -Infinity });
            chosen = best.d;
          } else {
            chosen = possible[Math.floor(Math.random() * possible.length)];
          }
          g.dir = chosen;
          g.vx = DIR_VEC[chosen][0];
          g.vy = DIR_VEC[chosen][1];
          g.x = gcx; g.y = gcy;
        }
      }

      const gnx = g.x + g.vx * gSpd * dt;
      const gny = g.y + g.vy * gSpd * dt;
      const gncol = Math.floor(gnx / TILE), gnrow = Math.floor(gny / TILE);
      if (isSafe(gncol, gnrow, true)) { g.x = gnx; g.y = gny; }
      else { g.x = gcx; g.y = gcy; g.vx = 0; g.vy = 0; }

      // Tunnel wrap
      if (g.x < 0)          g.x = MW * TILE - 1;
      if (g.x >= MW * TILE) g.x = 1;

      // ── Ghost ↔ Pac-Man collision ──────────────────────────────────────────
      const distSq = (g.x - s.pacX) ** 2 + (g.y - s.pacY) ** 2;
      const hitDist = TILE * 1.2;
      if (distSq < hitDist * hitDist) {
        if (frightened) {
          // Eat the ghost
          s.score += 200;
          const [sc, sr] = cellCenter(12, 11);
          g.x = sc; g.y = sr;
          g.dir = 'left'; g.vx = -1; g.vy = 0;
        } else {
          // Pac-Man dies
          s.lives -= 1;
          if (s.lives <= 0) {
            stopAll();
            if (onUnlockSwipe) onUnlockSwipe();
            setPhase('over');
            setRs(snapshot(s, ts));
            playWrong();
            onWrong();
            return;
          }
          // Reset Pac-Man position
          s.pacX = 14 * TILE + TILE / 2;
          s.pacY = 17 * TILE + TILE / 2;
          s.pacDir = 'left'; s.pacWant = 'left';
          s.pacVx = -1; s.pacVy = 0;
          playWrong();
        }
      }
    }

    setRs(snapshot(s, ts));
    rafRef.current = requestAnimationFrame(loop);
  };

  const setDir = (dir) => {
    if (stRef.current) stRef.current.pacWant = dir;
  };

  const state = rs || { pacX: 14*TILE+TILE/2, pacY: 17*TILE+TILE/2, pacDir:'left', lives:3, score:0, ghosts:[], frightUntil:0 };
  const now = Date.now();
  const frightened = now < (state.frightUntil || 0);

  // Pac-Man transform based on direction
  const pDir = state.pacDir || 'left';
  const pFlipX = pDir === 'left' ? -1 : 1;
  const pRotate = pDir === 'up' ? '-90deg' : pDir === 'down' ? '90deg' : '0deg';
  const pFrameIdx = PAC_MUNCH_FRAMES[pacFrame];
  const pFrameX   = -(pFrameIdx * PAC_FW) * (PAC_DISP / PAC_FW);

  const pacLeft = state.pacX * SCALE - PAC_DISP / 2;
  const pacTop  = state.pacY * SCALE - PAC_DISP / 2;

  return (
    <View style={styles.root}>
      {/* Score & Lives */}
      <View style={styles.hud}>
        <Text style={styles.hudTxt}>⬛ {state.lives || 3}</Text>
        <Text style={styles.hudTxt}>SCORE: {state.score || 0}</Text>
      </View>

      {/* Game arena */}
      <View style={[styles.arena, { width: GAME_W, height: GAME_H }]}>
        {/* Static wall layer */}
        <WallLayer />

        {/* Dots & Pills (re-renders on eat) */}
        <DotsLayer eatTick={eatTick} eatenDots={eatenDots.current} eatenPills={eatenPills.current} />

        {/* Pac-Man */}
        <View style={{
          position: 'absolute',
          left: pacLeft, top: pacTop,
          width: PAC_DISP, height: PAC_DISP,
          overflow: 'hidden',
          transform: [{ scaleX: pFlipX }, { rotate: pRotate }],
        }}>
          <Image source={PACMAN_IMG} style={{
            width: PAC_SW * (PAC_DISP / PAC_FW),
            height: PAC_DISP,
            transform: [{ translateX: pFrameX }],
          }} />
        </View>

        {/* Ghosts */}
        {(state.ghosts || []).map((g, i) => {
          const gfIdx  = frightened
            ? (gFrightFlip === 0 ? 16 : 17)
            : g.offset + (DIR_F[g.dir] || 0);
          const gfCol  = gfIdx % 4;
          const gfRow  = Math.floor(gfIdx / 4);
          const gLeft  = g.x * SCALE - G_DISP / 2;
          const gTop   = g.y * SCALE - G_DISP / 2;
          return (
            <View key={i} style={{
              position: 'absolute',
              left: gLeft, top: gTop,
              width: G_DISP, height: G_DISP,
              overflow: 'hidden',
            }}>
              <Image source={GHOSTS_IMG} style={{
                width:  G_SW * (G_DISP / G_FW),
                height: G_SH * (G_DISP / G_FW),
                transform: [
                  { translateX: -gfCol * G_FW * (G_DISP / G_FW) },
                  { translateY: -gfRow * G_FW * (G_DISP / G_FW) },
                ],
              }} />
            </View>
          );
        })}

        {/* Overlays */}
        {phase === 'ready' && (
          <Overlay>
            <Text style={styles.ovTitle}>PAC-MAN</Text>
            <Text style={styles.ovDesc}>Tüm noktaları ye!{'\n'}Hayaletlerden kaç.{'\n'}💊 ile onları ye!</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#f7e030' }]} onPress={startGame}>
              <Text style={[styles.btnTxt, { color: '#000' }]}>BAŞLA</Text>
            </TouchableOpacity>
          </Overlay>
        )}
        {phase === 'win' && (
          <Overlay>
            <Text style={styles.ovTitle}>Kazandın! 🎉</Text>
            <Text style={styles.ovDesc}>Skor: {state.score}</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#f7e030' }]} onPress={resetGame}>
              <Text style={[styles.btnTxt, { color: '#000' }]}>TEKRAR</Text>
            </TouchableOpacity>
          </Overlay>
        )}
        {phase === 'over' && (
          <Overlay>
            <Text style={styles.ovTitle}>OYUN BİTTİ 💀</Text>
            <Text style={styles.ovDesc}>Skor: {state.score}</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#ef4444' }]} onPress={resetGame}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </TouchableOpacity>
          </Overlay>
        )}
      </View>

      {/* D-Pad */}
      <View style={styles.dpad}>
        <TouchableOpacity style={styles.dBtn} onPress={() => { setDir('up'); if(phase==='ready') startGame(); }} activeOpacity={0.7}>
          <Text style={styles.dBtnTxt}>▲</Text>
        </TouchableOpacity>
        <View style={styles.dRow}>
          <TouchableOpacity style={styles.dBtn} onPress={() => { setDir('left'); if(phase==='ready') startGame(); }} activeOpacity={0.7}>
            <Text style={styles.dBtnTxt}>◀</Text>
          </TouchableOpacity>
          <View style={styles.dCenter} />
          <TouchableOpacity style={styles.dBtn} onPress={() => { setDir('right'); if(phase==='ready') startGame(); }} activeOpacity={0.7}>
            <Text style={styles.dBtnTxt}>▶</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.dBtn} onPress={() => { setDir('down'); if(phase==='ready') startGame(); }} activeOpacity={0.7}>
          <Text style={styles.dBtnTxt}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Snapshot helper ───────────────────────────────────────────────────────────
function snapshot(s, ts) {
  return {
    pacX: s.pacX, pacY: s.pacY,
    pacDir: s.pacDir,
    lives: s.lives, score: s.score,
    ghosts: s.ghosts.map(g => ({ ...g })),
    frightUntil: s.frightUntil,
  };
}

// ── Dots layer (re-renders on eat) ────────────────────────────────────────────
const DotsLayer = memo(({ eatTick, eatenDots, eatenPills }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {DOT_POS.map(({ col, row, idx }) => {
      if (eatenDots.has(idx)) return null;
      return (
        <Image
          key={idx}
          source={DOT_IMG}
          style={{
            position: 'absolute',
            left: col * TILE_D + TILE_D / 2 - DOT_DISP / 2,
            top:  row * TILE_D + TILE_D / 2 - DOT_DISP / 2,
            width: DOT_DISP, height: DOT_DISP,
            resizeMode: 'contain',
          }}
        />
      );
    })}
    {PILL_POS.map(({ col, row, idx }) => {
      if (eatenPills.has(idx)) return null;
      return (
        <Image
          key={idx}
          source={PILL_IMG}
          style={{
            position: 'absolute',
            left: col * TILE_D + TILE_D / 2 - PILL_DISP / 2,
            top:  row * TILE_D + TILE_D / 2 - PILL_DISP / 2,
            width: PILL_DISP, height: PILL_DISP,
            resizeMode: 'contain',
          }}
        />
      );
    })}
  </View>
));

function Overlay({ children }) {
  return <View style={styles.overlay}>{children}</View>;
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const DBTN = 48;
const styles = StyleSheet.create({
  root: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#000',
  },
  hud: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: GAME_W, paddingHorizontal: 8, paddingVertical: 4,
  },
  hudTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  arena: {
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  },
  dpad: {
    alignItems: 'center',
    marginTop: 8,
  },
  dRow: { flexDirection: 'row', alignItems: 'center' },
  dCenter: { width: DBTN, height: DBTN, backgroundColor: '#111', borderRadius: DBTN/2 },
  dBtn: {
    width: DBTN, height: DBTN,
    backgroundColor: '#222',
    borderRadius: DBTN / 2,
    justifyContent: 'center', alignItems: 'center',
    margin: 4,
  },
  dBtnTxt: { color: '#f7e030', fontSize: 20, fontWeight: '900' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 30,
  },
  ovTitle: { color: '#f7e030', fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: 2 },
  ovDesc: {
    color: '#fff', fontSize: 14, textAlign: 'center',
    marginBottom: 20, lineHeight: 22,
  },
  btn: { paddingHorizontal: 36, paddingVertical: 12, borderRadius: 24 },
  btnTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
