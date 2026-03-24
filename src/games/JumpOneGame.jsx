import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Pressable,
  Animated, Easing,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W  = Math.min(SW - 16, 380);
const GAME_H  = Math.min(SH * 0.70, 540);
const GS      = GAME_W / 360;
const sc      = v => v * GS;

const CX = GAME_W / 2;
const CY = GAME_H * 0.50;

const PLAT_W  = sc(76);
const PLAT_H  = sc(16);
const CHAR_W  = sc(28);
const CHAR_H  = sc(38);

// Landing tolerance: anything visually on the platform counts as a hit
const LAND_TOL = PLAT_W * 0.44;
const PERFECT  = PLAT_W * 0.08;
const MAX_PWR  = 250;
const JUMP_MS  = 300;
const SLIDE_MS = 280;

const PLAT_COLORS = ['#6c5ce7','#e84393','#00b894','#e17055','#0984e3','#fd79a8','#00cec9','#a29bfe'];
const CHAR_COLORS = ['#6c5ce7','#e84393','#00b894'];

// p.y = TOP SURFACE of platform (where feet rest)
function p1Pos(lx, ly) { return { x: CX - sc(lx), y: CY + sc(ly) }; }
function p2Pos(lx, ly) { return { x: CX + sc(lx), y: CY - sc(ly) }; }

// Character view: centered on feetX, bottom edge at feetY
function pLeft(feetX) { return feetX - CHAR_W / 2; }
function pTop(feetY)  { return feetY - CHAR_H; }

// Jump: y is always the target platform surface; x depends on power
function jumpTarget(lx, ly, ld, power) {
  return { x: CX - sc(lx) + ld * sc(power * 2), y: p2Pos(lx, ly).y };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Platform({ color }) {
  return (
    <View style={{
      width: PLAT_W, height: PLAT_H,
      borderTopLeftRadius: 0, borderTopRightRadius: 0,
      borderBottomLeftRadius: sc(6), borderBottomRightRadius: sc(6),
      backgroundColor: color,
      shadowColor: '#000', shadowOffset: { width: 0, height: sc(3) },
      shadowOpacity: 0.35, shadowRadius: sc(4), elevation: 5,
    }}>
      <View style={{
        position: 'absolute', top: 0, left: sc(8), right: sc(8), height: sc(3),
        backgroundColor: 'rgba(255,255,255,0.35)',
      }} />
    </View>
  );
}

function Character({ color }) {
  const headH = Math.round(CHAR_H * 0.42);
  const bodyH  = CHAR_H - headH;
  const headW  = Math.round(CHAR_W * 0.8);
  const bodyW  = Math.round(CHAR_W * 0.45);
  return (
    <View style={{ width: CHAR_W, height: CHAR_H, alignItems: 'center', overflow: 'hidden' }}>
      <View style={{
        width: headW, height: headH, borderRadius: headH / 2,
        backgroundColor: color, borderWidth: sc(1.5),
        borderColor: 'rgba(255,255,255,0.5)', justifyContent: 'center',
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: headW * 0.18 }}>
          <View style={{ width: headH * 0.18, height: headH * 0.18, borderRadius: 99, backgroundColor: '#fff' }} />
          <View style={{ width: headH * 0.18, height: headH * 0.18, borderRadius: 99, backgroundColor: '#fff' }} />
        </View>
      </View>
      <View style={{
        width: bodyW, height: bodyH, backgroundColor: color,
        borderBottomLeftRadius: sc(3), borderBottomRightRadius: sc(3), opacity: 0.85,
      }} />
    </View>
  );
}

function ItemBadge({ type, tick }) {
  return (
    <View style={{
      position: 'absolute', top: -sc(22), left: PLAT_W / 2 - sc(10),
      transform: [{ translateY: (tick % 2 === 0) ? 0 : -sc(3) }],
    }}>
      <Text style={{ fontSize: sc(16) }}>{type === 1 ? '❤️' : '🎯'}</Text>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function JumpOneGame({ onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const [phase, setPhase]       = useState('menu');
  const [charIdx, setCharIdx]   = useState(0);
  const [rs, setRs]             = useState(null);
  const [aimPos, setAimPos]     = useState(null);
  const [itemTick, setItemTick] = useState(0);
  const [popup, setPopup]       = useState({ text: '', x: 0, y: 0 });

  const stRef      = useRef(null);
  const phaseRef   = useRef('menu');
  const mounted    = useRef(true);
  const holdRef    = useRef(0);
  const chargeRef  = useRef(null);
  const itemRef    = useRef(null);
  const charIdxRef = useRef(0);

  // Character position + rotation (all native driver via transform)
  const pX      = useRef(new Animated.Value(0)).current;
  const pY      = useRef(new Animated.Value(0)).current;
  const pRot    = useRef(new Animated.Value(0)).current;
  const pSY     = useRef(new Animated.Value(1)).current;

  // ─────────────────────────────────────────────────────────────────────────
  // Platform positions as individual Animated values.
  // This eliminates the sX/sY "reset race" bug:
  //   Old approach: static base pos (React state) + shared sX/sY offset.
  //     When sX.setValue(0) fires before setRs re-renders, platforms flash
  //     back to old-state positions for 1-2 frames → character floats.
  //   New approach: each platform has its own absolute Animated position.
  //     After slide, setValue to canonical coords (= animation end value).
  //     setRs only updates colors/items → zero timing conflict.
  // ─────────────────────────────────────────────────────────────────────────
  const plt1X   = useRef(new Animated.Value(0)).current;
  const plt1Y   = useRef(new Animated.Value(0)).current;
  const plt2X   = useRef(new Animated.Value(0)).current;
  const plt2Y   = useRef(new Animated.Value(0)).current;
  const plt3X   = useRef(new Animated.Value(GAME_W + 200)).current;
  const plt3Y   = useRef(new Animated.Value(0)).current;

  const p1Alpha = useRef(new Animated.Value(1)).current;
  const popDY   = useRef(new Animated.Value(0)).current;
  const popA    = useRef(new Animated.Value(0)).current;
  const flash   = useRef(new Animated.Value(0)).current;

  const rotInterp = pRot.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });
  const setPhaseSync = v => { phaseRef.current = v; setPhase(v); };

  useEffect(() => {
    return () => {
      mounted.current = false;
      clearInterval(chargeRef.current);
      clearInterval(itemRef.current);
      if (onUnlockSwipe) onUnlockSwipe();
    };
  }, []);

  useEffect(() => { charIdxRef.current = charIdx; }, [charIdx]);

  // ── Start ──────────────────────────────────────────────────────────────────
  function startGame() {
    clearInterval(chargeRef.current);
    if (onLockSwipe) onLockSwipe();

    const iLx = 40, iLy = 20;
    const ip1 = p1Pos(iLx, iLy);
    const ip2 = p2Pos(iLx, iLy);

    const st = {
      lastX: iLx, lastY: iLy, lastD: 1, lastP: 0,
      plate1TypeIdx: 0, lives: 3, aims: 3, score: 0, bonus: 0,
      plate2Item: null, plate3: null, moving: false,
    };
    stRef.current = st;

    // Platform Animated positions
    plt1X.setValue(ip1.x - PLAT_W / 2);  plt1Y.setValue(ip1.y);
    plt2X.setValue(ip2.x - PLAT_W / 2);  plt2Y.setValue(ip2.y);
    plt3X.setValue(GAME_W + 200);          plt3Y.setValue(CY);

    // Character at p1 surface
    pX.setValue(pLeft(ip1.x));  pY.setValue(pTop(ip1.y));
    pRot.setValue(0);  pSY.setValue(1);
    p1Alpha.setValue(1);  flash.setValue(0);  popA.setValue(0);

    setAimPos(null);
    setPopup({ text: '', x: 0, y: 0 });
    setRs({ ...st });

    clearInterval(itemRef.current);
    let t = 0;
    itemRef.current = setInterval(() => {
      if (!mounted.current) return;
      setItemTick(t = (t + 1) % 4);
    }, 200);

    setPhaseSync('play');
  }

  // ── Charge ─────────────────────────────────────────────────────────────────
  function handlePressIn() {
    const ph = phaseRef.current;
    if (ph === 'gameover') { startGame(); return; }
    if (ph !== 'play') return;
    const st = stRef.current;
    if (!st || st.moving) return;

    st.moving = true;
    holdRef.current = Date.now();
    pSY.setValue(1);

    clearInterval(chargeRef.current);
    chargeRef.current = setInterval(() => {
      if (!mounted.current || phaseRef.current !== 'play') return;
      const power = Math.min(Math.floor((Date.now() - holdRef.current) / 16), MAX_PWR);
      pSY.setValue(power > 100 ? 0.7 : 1 - 0.3 * power / 100);
      const cur = stRef.current;
      if (cur?.aims > 0) {
        const t = jumpTarget(cur.lastX, cur.lastY, cur.lastD, power);
        setAimPos({ x: t.x, y: t.y });
      } else {
        setAimPos(null);
      }
    }, 16);
  }

  // ── Jump ───────────────────────────────────────────────────────────────────
  function handlePressOut() {
    if (phaseRef.current !== 'play') return;
    clearInterval(chargeRef.current);
    const st = stRef.current;
    if (!st || holdRef.current === 0) return;

    const power  = Math.min(Math.floor((Date.now() - holdRef.current) / 16), MAX_PWR);
    holdRef.current = 0;
    pSY.setValue(1);
    setAimPos(null);

    const { lastX: lx, lastY: ly, lastD: ld } = st;
    const target = jumpTarget(lx, ly, ld, power);
    const p2     = p2Pos(lx, ly);
    const startY = pTop(p1Pos(lx, ly).y);
    const endL   = pLeft(target.x);
    const endT   = pTop(target.y);
    const peak   = Math.min(startY, endT) - sc(50);

    playTap();
    pRot.setValue(-ld * 150);

    Animated.parallel([
      Animated.timing(pX, { toValue: endL, duration: JUMP_MS, useNativeDriver: true, easing: Easing.linear }),
      Animated.sequence([
        Animated.timing(pY, { toValue: peak, duration: JUMP_MS / 2, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(pY, { toValue: endT, duration: JUMP_MS / 2, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
      ]),
      Animated.sequence([
        Animated.timing(pRot, { toValue: -ld * 90, duration: JUMP_MS / 2, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(pRot, { toValue: 0,        duration: JUMP_MS / 2, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
      ]),
    ]).start(() => {
      if (!mounted.current) return;
      if (Math.abs(target.x - p2.x) > LAND_TOL) doMiss(target, p2);
      else {
        pX.setValue(pLeft(p2.x));
        pY.setValue(pTop(p2.y));
        doLand(p2, Math.abs(target.x - p2.x) <= PERFECT);
      }
    });
  }

  // ── Land ───────────────────────────────────────────────────────────────────
  function doLand(p2, perfect) {
    const st = stRef.current;

    // Deduct aim for this jump first, then collect item (so pickup is a net gain)
    if (st.aims > 0) st.aims--;
    if (st.plate2Item) {
      if (st.plate2Item.type === 1) st.lives = Math.min(st.lives + 1, 9);
      else                           st.aims  = Math.min(st.aims  + 1, 9);
      st.plate2Item = null;
    }

    let add = 1;
    if (perfect) {
      st.bonus += 2;
      add = st.bonus;
      flash.setValue(0.6);
      Animated.timing(flash, { toValue: 0, duration: 500, useNativeDriver: true }).start();
      if (onCorrect) onCorrect();
      playCorrect();
    } else {
      st.bonus = 0;
    }
    st.score += add;

    setPopup({ text: '+' + add, x: p2.x, y: pTop(p2.y) - sc(8) });
    popDY.setValue(0); popA.setValue(1);
    Animated.parallel([
      Animated.timing(popDY, { toValue: -sc(40), duration: 800, useNativeDriver: true }),
      Animated.timing(popA,  { toValue: 0,       duration: 800, useNativeDriver: true }),
    ]).start();

    // ── Generate next level ────────────────────────────────────────────────
    const newRange = 10 + Math.floor(Math.random() * 41);
    const newD     = Math.random() < 0.5 ? 1 : -1;
    const newX     = newD * newRange * 2;
    const newY     = newRange;
    const newLastP = Math.floor(Math.random() * 8);
    const newItem  = Math.random() > 0.6 ? { type: Math.floor(Math.random() * 2) + 1 } : null;

    const slideDX = -sc(st.lastX + newX);
    const slideDY =  sc(st.lastY + newY);

    // Current plate1 position (for slide-away animation)
    const cur_p1 = p1Pos(st.lastX, st.lastY);

    // Plate3 starting position (will slide to become new plate2)
    const p3StartX = p2.x + sc(newX * 2) - PLAT_W / 2;
    const p3StartY = p2.y - sc(newY * 2);
    plt3X.setValue(p3StartX);
    plt3Y.setValue(p3StartY);

    // New canonical positions after slide
    const new_p1 = p1Pos(newX, newY);
    const new_p2 = p2Pos(newX, newY);

    // Store plate3 data so render shows it (needed for items + conditional display)
    st.plate3 = { typeIdx: newLastP, item: newItem };
    st.plate1TypeIdx = st.lastP;
    p1Alpha.setValue(1);

    // ── Slide: animate ALL platforms + character by (slideDX, slideDY) ────
    // Each platform has its own Animated position → no shared sX/sY to reset.
    // After animation, setValue to canonical coords (= animation end value)
    // so setRs (colors/items only) causes zero visual position change.
    Animated.parallel([
      Animated.timing(plt1X, { toValue: cur_p1.x - PLAT_W / 2 + slideDX, duration: SLIDE_MS, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(plt1Y, { toValue: cur_p1.y           + slideDY, duration: SLIDE_MS, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(plt2X, { toValue: p2.x  - PLAT_W / 2 + slideDX, duration: SLIDE_MS, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(plt2Y, { toValue: p2.y               + slideDY, duration: SLIDE_MS, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(plt3X, { toValue: p3StartX            + slideDX, duration: SLIDE_MS, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(plt3Y, { toValue: p3StartY            + slideDY, duration: SLIDE_MS, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(pX,    { toValue: pLeft(p2.x)         + slideDX, duration: SLIDE_MS, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(pY,    { toValue: pTop(p2.y)          + slideDY, duration: SLIDE_MS, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(p1Alpha, { toValue: 0, duration: SLIDE_MS, useNativeDriver: true }),
    ]).start(() => {
      if (!mounted.current) return;

      // Reassign platform roles: old plt2→plt1, old plt3→plt2, plt3→offscreen
      // These setValue calls set the EXACT same values the animations just ended at
      // → zero visual change, no flicker, no race with setRs
      plt1X.setValue(new_p1.x - PLAT_W / 2);
      plt1Y.setValue(new_p1.y);
      plt2X.setValue(new_p2.x - PLAT_W / 2);
      plt2Y.setValue(new_p2.y);
      plt3X.setValue(GAME_W + 200);
      plt3Y.setValue(CY);
      p1Alpha.setValue(1);

      // Character snaps to new p1 (same value as animation end)
      pX.setValue(pLeft(new_p1.x));
      pY.setValue(pTop(new_p1.y));

      // Update game logic only — platform positions already correct above
      st.lastX = newX; st.lastY = newY; st.lastD = newD;
      st.lastP = newLastP; st.plate1TypeIdx = newLastP;
      st.plate2Item = newItem;
      st.plate3 = null;
      st.moving = false;
      setRs({ ...st });
    });

    setRs({ ...st }); // show plate3, update score/lives in HUD
  }

  // ── Miss ───────────────────────────────────────────────────────────────────
  function doMiss(target, p2) {
    const st = stRef.current;
    if (st.aims > 0) st.aims--;
    playWrong();

    const tilt = target.x < p2.x ? -35 : 35;
    Animated.sequence([
      Animated.timing(pRot, { toValue: tilt, duration: 100, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(pY,   { toValue: pTop(target.y) + sc(140), duration: 500, useNativeDriver: true }),
        Animated.timing(pRot, { toValue: tilt * 2, duration: 500, useNativeDriver: true }),
      ]),
    ]).start(() => {
      if (!mounted.current) return;
      st.lives--;
      if (st.lives <= 0) {
        clearInterval(itemRef.current);
        if (onUnlockSwipe) onUnlockSwipe();
        setPhaseSync('gameover');
        if (onWrong) onWrong();
      } else {
        const p1 = p1Pos(st.lastX, st.lastY);
        pRot.setValue(0);
        pX.setValue(pLeft(p1.x));
        pY.setValue(pTop(p1.y) - sc(50));
        Animated.timing(pY, {
          toValue: pTop(p1.y), duration: 220, useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }).start(() => {
          if (!mounted.current) return;
          st.moving = false;
          setRs({ ...st });
        });
      }
      setRs({ ...st });
    });
    setRs({ ...st });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const st    = rs;
  const score = st?.score ?? 0;
  const lives = st?.lives ?? 3;
  const aims  = st?.aims  ?? 3;
  const pc    = i => PLAT_COLORS[i % PLAT_COLORS.length];

  return (
    <View style={styles.root}>
      <Pressable style={styles.arena} onPressIn={handlePressIn} onPressOut={handlePressOut}>

        {/* Background */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0f0c29' }]} />
        {[0.25, 0.5, 0.75].map(f => (
          <View key={f} style={{
            position: 'absolute', left: 0, right: 0, top: GAME_H * f,
            height: 1, backgroundColor: 'rgba(255,255,255,0.04)',
          }} />
        ))}

        {/* ── Platforms ── */}
        {phase === 'play' && st && (
          <>
            {/* Plate 1 — slides away + fades */}
            <Animated.View style={{
              position: 'absolute', left: 0, top: 0,
              opacity: p1Alpha,
              transform: [{ translateX: plt1X }, { translateY: plt1Y }],
            }}>
              <Platform color={pc(st.plate1TypeIdx ?? 0)} />
            </Animated.View>

            {/* Plate 2 — target */}
            <Animated.View style={{
              position: 'absolute', left: 0, top: 0,
              transform: [{ translateX: plt2X }, { translateY: plt2Y }],
            }}>
              <Platform color={pc(st.lastP)} />
              {st.plate2Item && <ItemBadge type={st.plate2Item.type} tick={itemTick} />}
            </Animated.View>

            {/* Plate 3 — appears during slide, becomes new plate 2 */}
            {st.plate3 && (
              <Animated.View style={{
                position: 'absolute', left: 0, top: 0,
                transform: [{ translateX: plt3X }, { translateY: plt3Y }],
              }}>
                <Platform color={pc(st.plate3.typeIdx)} />
                {st.plate3.item && <ItemBadge type={st.plate3.item.type} tick={itemTick} />}
              </Animated.View>
            )}
          </>
        )}

        {/* Perfect flash */}
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff', opacity: flash }]}
          pointerEvents="none" />

        {/* Player — outer: translate only | inner: rotate + scaleY */}
        {phase === 'play' && (
          <Animated.View style={{
            position: 'absolute', left: 0, top: 0,
            width: CHAR_W, height: CHAR_H,
            transform: [{ translateX: pX }, { translateY: pY }],
          }}>
            <Animated.View style={{
              width: CHAR_W, height: CHAR_H,
              transform: [{ rotate: rotInterp }, { scaleY: pSY }],
            }}>
              <Character color={CHAR_COLORS[charIdxRef.current % 3]} />
            </Animated.View>
          </Animated.View>
        )}

        {/* Aim indicator */}
        {aimPos && (
          <View style={{
            position: 'absolute',
            left: aimPos.x - sc(8), top: aimPos.y - sc(8),
            width: sc(16), height: sc(16), borderRadius: sc(8),
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderWidth: sc(2), borderColor: 'rgba(255,255,255,0.8)',
          }} pointerEvents="none" />
        )}

        {/* Score popup */}
        <Animated.View style={{
          position: 'absolute', left: popup.x - sc(16), top: popup.y,
          transform: [{ translateY: popDY }], opacity: popA,
        }} pointerEvents="none">
          <Text style={styles.popupTxt}>{popup.text}</Text>
        </Animated.View>

        {/* HUD */}
        {phase === 'play' && st && (
          <View style={styles.hud} pointerEvents="box-none">
            <Text style={styles.scoreTxt} pointerEvents="none">{score}</Text>
            <View style={styles.hudRow} pointerEvents="none">
              <Text style={styles.hudIcon}>❤️</Text>
              <Text style={styles.hudVal}>{lives}</Text>
              <View style={{ width: sc(14) }} />
              <Text style={styles.hudIcon}>🎯</Text>
              <Text style={styles.hudVal}>{aims}</Text>
            </View>
            {/* Stop button — unlocks scroll so user can swipe to next game */}
            <Pressable
              onPress={() => {
                clearInterval(chargeRef.current);
                clearInterval(itemRef.current);
                if (onUnlockSwipe) onUnlockSwipe();
                setPhaseSync('menu');
              }}
              style={styles.stopBtn}
              hitSlop={8}
            >
              <Text style={styles.stopBtnTxt}>✕</Text>
            </Pressable>
          </View>
        )}

        {/* Menu */}
        {phase === 'menu' && (
          <View style={styles.overlay}>
            <Text style={styles.menuTitle}>Jump One</Text>
            <View style={styles.charRow}>
              <Pressable onPress={() => setCharIdx(v => (v - 1 + 3) % 3)} hitSlop={20}>
                <Text style={styles.arrow}>◀</Text>
              </Pressable>
              <View style={{ width: CHAR_W * 2, height: CHAR_H * 2, alignItems: 'center', justifyContent: 'flex-end' }}>
                <View style={{ transform: [{ scale: 2 }] }}>
                  <Character color={CHAR_COLORS[charIdx % 3]} />
                </View>
              </View>
              <Pressable onPress={() => setCharIdx(v => (v + 1) % 3)} hitSlop={20}>
                <Text style={styles.arrow}>▶</Text>
              </Pressable>
            </View>
            <Pressable onPress={startGame} style={styles.btn}>
              <Text style={styles.btnTxt}>BAŞLA</Text>
            </Pressable>
            <Text style={styles.hint}>Basılı tut → güç biriktir → bırak → zıpla{'\n'}Tam ortaya düş → bonus puan!</Text>
          </View>
        )}

        {/* Game Over */}
        {phase === 'gameover' && st && (
          <View style={styles.overlay}>
            <Text style={styles.overTitle}>Oyun Bitti!</Text>
            <Text style={styles.overScore}>Skor: {st.score}</Text>
            <Pressable onPress={startGame} style={styles.btn}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </Pressable>
            <Pressable onPress={() => setPhaseSync('menu')} style={[styles.btn, styles.btnSecondary]}>
              <Text style={styles.btnTxt}>MENÜ</Text>
            </Pressable>
          </View>
        )}

      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 20, margin: 8,
  },
  arena: {
    width: GAME_W, height: GAME_H,
    borderRadius: 12, overflow: 'hidden',
  },
  hud: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  scoreTxt: { color: 'rgba(255,255,255,0.5)', fontSize: sc(44), fontWeight: '700', marginTop: sc(6) },
  hudRow: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: sc(14), left: sc(14) },
  stopBtn: {
    position: 'absolute', top: sc(10), right: sc(10),
    width: sc(28), height: sc(28), borderRadius: sc(14),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  stopBtnTxt: { color: 'rgba(255,255,255,0.7)', fontSize: sc(13), fontWeight: '700' },
  hudIcon: { fontSize: sc(14) },
  hudVal:  { color: '#fff', fontSize: sc(14), fontWeight: '700', marginLeft: sc(3) },
  popupTxt: {
    color: '#fff', fontSize: sc(18), fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: sc(4),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)', gap: sc(14),
  },
  menuTitle:   { color: '#fff', fontSize: sc(32), fontWeight: '900', letterSpacing: 2 },
  charRow:     { flexDirection: 'row', alignItems: 'center', gap: sc(28), marginVertical: sc(4) },
  arrow:       { color: '#fff', fontSize: sc(26), fontWeight: '700' },
  btn: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: sc(36), paddingVertical: sc(12),
    borderRadius: sc(12), minWidth: sc(140), alignItems: 'center',
  },
  btnSecondary: { backgroundColor: 'rgba(255,255,255,0.15)' },
  btnTxt:   { color: '#fff', fontSize: sc(16), fontWeight: '800', letterSpacing: 1 },
  hint:     { color: 'rgba(255,255,255,0.5)', fontSize: sc(12), textAlign: 'center', lineHeight: sc(20) },
  overTitle: { color: '#fff', fontSize: sc(28), fontWeight: '900' },
  overScore: { color: 'rgba(255,255,255,0.8)', fontSize: sc(20), marginBottom: sc(8) },
});
