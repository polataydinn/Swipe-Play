import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, StyleSheet, Dimensions, TouchableOpacity,
} from 'react-native';
import { playCorrect, playWrong } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');
const GAME_W = Math.min(SW - 4, 390);

// Grid config
const COLS = 22;
const ROWS = 30;
const CELL_W = GAME_W / COLS;
const GAME_H = CELL_W * ROWS;
const TOTAL_CELLS = COLS * ROWS;

// Assets
const PARK_BG = require('../assets/wipeglass/park-bg.jpg');
const RAG_IMG  = require('../assets/wipeglass/rag.png');

const DIFF = { ragR: 3.2, winPct: 100, timeLimit: 20 };

export default function WipeGlassGame({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const diff = DIFF;

  const [phase,   setPhase]   = useState('ready');
  const [percent, setPercent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(diff.timeLimit);
  const [ragPos,  setRagPos]  = useState(null);
  const [tick,    setTick]    = useState(0);

  const wipedRef    = useRef(new Set());
  const phaseRef    = useRef('ready');
  const throttleRef = useRef(null);
  const timerRef    = useRef(null);
  const mounted     = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
      clearTimeout(throttleRef.current);
      clearInterval(timerRef.current);
      if (onUnlockSwipe) onUnlockSwipe();
    };
  }, []);

  const stopTimers = () => {
    clearTimeout(throttleRef.current);
    clearInterval(timerRef.current);
    throttleRef.current = null;
    timerRef.current = null;
  };

  const startGame = () => {
    wipedRef.current = new Set();
    phaseRef.current = 'play';
    if (onLockSwipe) onLockSwipe();
    setPhase('play');
    setPercent(0);
    setTick(0);
    setRagPos(null);
    setTimeLeft(diff.timeLimit);

    timerRef.current = setInterval(() => {
      if (!mounted.current) return;
      setTimeLeft(t => {
        if (t <= 1) {
          if (phaseRef.current === 'play') {
            phaseRef.current = 'over';
            stopTimers();
            setPhase('over');
            if (onUnlockSwipe) onUnlockSwipe();
            playWrong();
            onWrong();
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const resetGame = () => {
    stopTimers();
    wipedRef.current = new Set();
    phaseRef.current = 'ready';
    setPhase('ready');
    setPercent(0);
    setTick(0);
    setRagPos(null);
    setTimeLeft(diff.timeLimit);
  };

  const handleWipe = (e) => {
    if (phaseRef.current !== 'play') return;
    const tx = e.nativeEvent.locationX;
    const ty = e.nativeEvent.locationY;

    setRagPos({ x: tx, y: ty });

    const { ragR, winPct } = diff;
    const cellX = tx / CELL_W;
    const cellY = ty / CELL_W;
    let changed = false;

    const rMin = Math.floor(cellY - ragR) - 1;
    const rMax = Math.ceil(cellY + ragR) + 1;
    const cMin = Math.floor(cellX - ragR) - 1;
    const cMax = Math.ceil(cellX + ragR) + 1;

    for (let r = rMin; r <= rMax; r++) {
      for (let c = cMin; c <= cMax; c++) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
        const dist = Math.sqrt((cellX - (c + 0.5)) ** 2 + (cellY - (r + 0.5)) ** 2);
        if (dist < ragR) {
          const idx = r * COLS + c;
          if (!wipedRef.current.has(idx)) {
            wipedRef.current.add(idx);
            changed = true;
          }
        }
      }
    }

    if (changed && !throttleRef.current) {
      throttleRef.current = setTimeout(() => {
        throttleRef.current = null;
        if (!mounted.current) return;
        const pct = Math.round((wipedRef.current.size / TOTAL_CELLS) * 100);
        setPercent(pct);
        setTick(t => t + 1);

        if (pct >= winPct && phaseRef.current === 'play') {
          phaseRef.current = 'win';
          stopTimers();
          setPhase('win');
          if (onUnlockSwipe) onUnlockSwipe();
          playCorrect();
          onCorrect();
        }
      }, 40);
    }
  };

  const ragSize = diff.ragR * 2 * CELL_W;
  const timePct  = Math.round((timeLeft / diff.timeLimit) * 100);
  const timerColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : '#22c55e';

  return (
    <View style={styles.root}>
      {/* HUD */}
      <View style={[styles.hud, { width: GAME_W }]}>
        <Text style={styles.hudTxt}>🧹 {percent}% temiz</Text>
        <Text style={[styles.hudTxt, { color: timerColor }]}>⏱ {timeLeft}s</Text>
      </View>

      {/* Progress bars */}
      <View style={[styles.barsRow, { width: GAME_W }]}>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: '#38bdf8' }]} />
        </View>
        <View style={[styles.barTrack, { marginLeft: 6 }]}>
          <View style={[styles.barFill, { width: `${timePct}%`, backgroundColor: timerColor }]} />
        </View>
      </View>

      {/* Game arena */}
      <View
        style={[styles.arena, { width: GAME_W, height: GAME_H }]}
        onStartShouldSetResponder={() => phaseRef.current === 'play'}
        onMoveShouldSetResponder={() => phaseRef.current === 'play'}
        onResponderGrant={handleWipe}
        onResponderMove={handleWipe}
      >
        {/* Clean background image */}
        <Image source={PARK_BG} style={StyleSheet.absoluteFill} resizeMode="cover" />

        {/* Fog grid — only non-wiped cells rendered */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const idx = r * COLS + c;
              if (wipedRef.current.has(idx)) return null;
              return (
                <View
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: c * CELL_W,
                    top: r * CELL_W,
                    width: CELL_W + 0.5,
                    height: CELL_W + 0.5,
                    backgroundColor: 'rgba(200, 215, 230, 0.92)',
                  }}
                />
              );
            })
          )}
        </View>

        {/* Rag cursor */}
        {ragPos && phase === 'play' && (
          <Image
            source={RAG_IMG}
            style={{
              position: 'absolute',
              left: ragPos.x - ragSize / 2,
              top: ragPos.y - ragSize / 2,
              width: ragSize,
              height: ragSize,
              opacity: 0.85,
            }}
            pointerEvents="none"
          />
        )}

        {/* Ready overlay */}
        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.ovIcon}>🪟</Text>
            <Text style={styles.ovTitle}>Camı Sil!</Text>
            <Text style={styles.ovDesc}>
              Parmağını sürükleyerek kirli camı temizle.{'\n'}
              %{diff.winPct} temizleyince kazanırsın!{'\n'}
              Süren: {diff.timeLimit} saniye
            </Text>
            <TouchableOpacity style={styles.btn} onPress={startGame}>
              <Text style={styles.btnTxt}>BAŞLA</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Win overlay */}
        {phase === 'win' && (
          <View style={styles.overlay}>
            <Text style={styles.ovIcon}>✨</Text>
            <Text style={styles.ovTitle}>Tertemiz!</Text>
            <Text style={styles.ovDesc}>Camı %{percent} temizledin!</Text>
            <TouchableOpacity style={styles.btn} onPress={resetGame}>
              <Text style={styles.btnTxt}>TEKRAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Game over overlay */}
        {phase === 'over' && (
          <View style={styles.overlay}>
            <Text style={styles.ovIcon}>💨</Text>
            <Text style={styles.ovTitle}>Süre Doldu!</Text>
            <Text style={styles.ovDesc}>
              Sadece %{percent} temizleyebildin.{'\n'}
              Hedef: %{diff.winPct}
            </Text>
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
    backgroundColor: '#1a2535',
  },
  hud: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
  },
  hudTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  barsRow: {
    flexDirection: 'row', paddingHorizontal: 8, marginBottom: 4,
  },
  barTrack: {
    flex: 1, height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden',
  },
  barFill: {
    height: '100%', borderRadius: 3,
  },
  arena: {
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)', zIndex: 30,
  },
  ovIcon: { fontSize: 48, marginBottom: 8 },
  ovTitle: {
    color: '#fff', fontSize: 26, fontWeight: '900',
    marginBottom: 8, letterSpacing: 1,
  },
  ovDesc: {
    color: '#cbd5e1', fontSize: 14, textAlign: 'center',
    marginBottom: 24, lineHeight: 22,
  },
  btn: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 36, paddingVertical: 12, borderRadius: 24,
  },
  btnTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
