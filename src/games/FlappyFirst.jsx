import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const GAME_W = SW - 16;
const GAME_H = Math.min(SH * 0.68, 520);

const GRAVITY    = 0.2;
const JUMP_VEL   = -4.8;
const PIPE_SPEED = 3.0;
const PIPE_SPAWN_Z = 420;
const FOCAL = 340;

const cx = GAME_W / 2;
const cy = GAME_H / 2;

const DIFFICULTY_CONFIG = {
  0: { gapFraction: 0.50, pipeGapZ: 165, pipeW: 88 },
  1: { gapFraction: 0.40, pipeGapZ: 145, pipeW: 80 },
  2: { gapFraction: 0.32, pipeGapZ: 125, pipeW: 72 },
};

let _pid = 0;
const pid = () => ++_pid;

function makePipe(z, gapFraction) {
  const gapCenter = (Math.random() * 0.5 + 0.25) * GAME_H;
  const gapHalf   = (gapFraction / 2) * GAME_H;
  return {
    id: pid(), z,
    // world coordinates: 0 = center of screen
    gapTopWorld: (gapCenter - gapHalf) - GAME_H / 2,
    gapBotWorld: (gapCenter + gapHalf) - GAME_H / 2,
    passed: false,
  };
}

export default function FlappyFirst({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const [phase, setPhase] = useState('ready');
  const [score, setScore] = useState(0);
  const [playerY, setPlayerY] = useState(0);  // world Y (camera Y)
  const [pipes, setPipes] = useState([]);

  const stRef = useRef({
    phase: 'ready', velY: 0, playerY: 0,
    pipes: [], score: 0, frame: 0,
  });
  const frameRef   = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (onLockSwipe) onLockSwipe();
    return () => {
      mountedRef.current = false;
      if (onUnlockSwipe) onUnlockSwipe();
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const resetGame = () => {
    cancelAnimationFrame(frameRef.current);
    stRef.current = { phase: 'ready', velY: 0, playerY: 0, pipes: [], score: 0, frame: 0 };
    setPhase('ready');
    setPlayerY(0);
    setPipes([]);
    setScore(0);
  };

  useEffect(() => { resetGame(); }, [difficulty]);

  const startGame = () => {
    stRef.current.phase = 'play';
    stRef.current.velY  = JUMP_VEL;
    stRef.current.pipes = [makePipe(PIPE_SPAWN_Z, cfg.gapFraction)];
    setPhase('play');
    gameLoop();
  };

  const gameLoop = () => {
    if (!mountedRef.current) return;
    const s = stRef.current;
    if (s.phase !== 'play') return;
    s.frame++;

    // Gravity
    s.velY += GRAVITY;
    if (s.velY > 7) s.velY = 7;
    s.playerY += s.velY;

    // Move pipes toward player
    s.pipes = s.pipes.map(p => ({ ...p, z: p.z - PIPE_SPEED }));

    // Spawn new pipe
    const last = s.pipes[s.pipes.length - 1];
    if (!last || last.z < PIPE_SPAWN_Z - cfg.pipeGapZ) {
      s.pipes.push(makePipe(PIPE_SPAWN_Z, cfg.gapFraction));
    }

    // Remove pipes past player
    s.pipes = s.pipes.filter(p => p.z > -50);

    // Collision & score
    for (const p of s.pipes) {
      if (p.z < 55 && p.z > -15) {
        // Check collision in world space - player is at s.playerY, gap is in world coords
        const margin = 6;
        if (s.playerY < p.gapTopWorld + margin || s.playerY > p.gapBotWorld - margin) {
          s.phase = 'dead';
          setPhase('dead');
          setScore(s.score);
          playWrong();
          setTimeout(() => onWrong(), 800);
          return;
        }
      }
      if (!p.passed && p.z < 0) {
        p.passed = true;
        s.score++;
        playCorrect();
      }
    }

    // Floor/ceiling
    const halfH = GAME_H / 2;
    if (s.playerY > halfH || s.playerY < -halfH) {
      s.phase = 'dead';
      setPhase('dead');
      setScore(s.score);
      playWrong();
      setTimeout(() => onWrong(), 800);
      return;
    }

    setPlayerY(s.playerY);
    setPipes([...s.pipes]);
    setScore(s.score);
    frameRef.current = requestAnimationFrame(gameLoop);
  };

  const handleTap = () => {
    if (phase === 'ready') { playTap(); startGame(); return; }
    if (phase === 'dead')  { resetGame(); return; }
    if (phase === 'play')  {
      playTap();
      stRef.current.velY = JUMP_VEL;
    }
  };

  // Render a pipe pair with correct 3D projection accounting for playerY
  const renderPipe = (pipe) => {
    if (pipe.z <= 0) return null;
    const scale = FOCAL / pipe.z;
    const pipeW = Math.max(5, cfg.pipeW * scale);
    const sx    = cx - pipeW / 2;

    // Correct perspective: camera is at playerY, world objects shift by -playerY
    const screenGapTop = cy + (pipe.gapTopWorld - playerY) * scale;
    const screenGapBot = cy + (pipe.gapBotWorld - playerY) * scale;

    const distFade = Math.min(1, pipe.z / 280);
    const green    = Math.round(120 + distFade * 60);
    const pipeAlpha = 0.45 + distFade * 0.55;
    const pipeColor = `rgba(20, ${green}, 30, ${pipeAlpha})`;
    const capColor  = `rgba(10, ${green - 20}, 15, ${pipeAlpha + 0.1})`;
    const capH = Math.max(4, 20 * scale);
    const capW = pipeW + 12 * scale;
    const capOff = (capW - pipeW) / 2;

    // Gap indicator ring - bright outline around gap for visibility
    const gapH = screenGapBot - screenGapTop;
    const showGapRing = gapH > 10 && gapH < GAME_H * 1.5;

    return (
      <React.Fragment key={pipe.id}>
        {/* Top pipe body */}
        {screenGapTop > 0 && (
          <View style={[styles.pipe, {
            left: sx, top: 0,
            width: pipeW, height: Math.max(0, screenGapTop),
            backgroundColor: pipeColor,
          }]} />
        )}
        {/* Top pipe cap */}
        {screenGapTop > -capH && (
          <View style={[styles.pipeCap, {
            left: sx - capOff, top: screenGapTop - capH,
            width: capW, height: capH, backgroundColor: capColor,
          }]} />
        )}

        {/* Gap highlight ring */}
        {showGapRing && (
          <View style={[styles.gapRing, {
            left: sx - capOff - 2, top: screenGapTop,
            width: capW + 4, height: gapH,
            borderColor: `rgba(120, 255, 100, ${0.25 + (1 - distFade) * 0.4})`,
          }]} />
        )}
        {/* Gap center dot */}
        {showGapRing && (
          <View style={[styles.gapDot, {
            left: cx - 4,
            top: (screenGapTop + screenGapBot) / 2 - 4,
            opacity: 0.15 + (1 - distFade) * 0.35,
          }]} />
        )}

        {/* Bottom pipe body */}
        {screenGapBot < GAME_H && (
          <View style={[styles.pipe, {
            left: sx, top: screenGapBot,
            width: pipeW, height: Math.max(0, GAME_H - screenGapBot),
            backgroundColor: pipeColor,
          }]} />
        )}
        {/* Bottom pipe cap */}
        {screenGapBot < GAME_H + capH && (
          <View style={[styles.pipeCap, {
            left: sx - capOff, top: screenGapBot,
            width: capW, height: capH, backgroundColor: capColor,
          }]} />
        )}

        {/* Pipe depth edge (3D left face) */}
        <View style={[styles.pipeEdge, {
          left: sx,
          top: 0,
          width: Math.max(2, 8 * scale),
          height: Math.max(0, screenGapTop),
          backgroundColor: `rgba(60, ${green + 40}, 50, ${pipeAlpha * 0.5})`,
        }]} />
        {screenGapBot < GAME_H && (
          <View style={[styles.pipeEdge, {
            left: sx,
            top: screenGapBot,
            width: Math.max(2, 8 * scale),
            height: Math.max(0, GAME_H - screenGapBot),
            backgroundColor: `rgba(60, ${green + 40}, 50, ${pipeAlpha * 0.5})`,
          }]} />
        )}
      </React.Fragment>
    );
  };

  return (
    <View style={styles.outer}>
      <Text style={styles.title}>3D Flappy</Text>
      <Text style={styles.sub}>Skor: {score}</Text>

      <TouchableOpacity style={styles.gameArea} onPress={handleTap} activeOpacity={1}>
        {/* Tunnel / background */}
        <View style={styles.bg}>
          {/* Perspective grid lines */}
          {[0.08, 0.18, 0.3, 0.45, 0.62, 0.8].map((r, i) => (
            <View key={i} style={[styles.tunnelRect, {
              width:  GAME_W * r,
              height: GAME_H * r,
              left:  (GAME_W * (1 - r)) / 2,
              top:   (GAME_H * (1 - r)) / 2,
              borderColor: `rgba(0, 200, 80, ${0.04 + i * 0.018})`,
            }]} />
          ))}
          {/* Horizon lines */}
          <View style={[styles.horizLine, { top: GAME_H * 0.42 + playerY * 0.15 }]} />
          <View style={[styles.horizLine, { top: GAME_H * 0.58 + playerY * 0.15 }]} />
        </View>

        {/* Pipes (back to front) */}
        {[...pipes].sort((a, b) => b.z - a.z).map(p => renderPipe(p))}

        {/* Player ball — always at screen center in first-person */}
        {phase === 'play' && (
          <View style={styles.playerBall}>
            <View style={styles.playerInner} />
          </View>
        )}

        {phase === 'ready' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayBig}>3D Flappy</Text>
            <Text style={styles.overlayHint}>
              Dokun = Yukarı Uç{'\n'}Tünel boyunca ilerle!
            </Text>
          </View>
        )}
        {phase === 'dead' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayBig}>💥 {score} Puan</Text>
            <Text style={styles.overlayHint}>Tekrar için dokun</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#020810',
    borderRadius: 20, margin: 8,
    overflow: 'hidden', alignItems: 'center',
  },
  title: { color: '#facc15', fontSize: 26, fontWeight: '900', marginTop: 10 },
  sub: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 6 },

  gameArea: {
    width: GAME_W, flex: 1,
    backgroundColor: '#010b04',
    borderRadius: 14, overflow: 'hidden',
    position: 'relative', marginBottom: 10,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
  },
  tunnelRect: {
    position: 'absolute',
    borderWidth: 1, borderRadius: 4,
  },
  horizLine: {
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(0,200,80,0.06)',
  },

  pipe: { position: 'absolute' },
  pipeCap: { position: 'absolute', borderRadius: 3 },
  pipeEdge: { position: 'absolute' },
  gapRing: {
    position: 'absolute',
    borderWidth: 1.5, borderRadius: 2,
    backgroundColor: 'transparent',
  },
  gapDot: {
    position: 'absolute',
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(120, 255, 100, 0.7)',
  },

  playerBall: {
    position: 'absolute',
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: '#facc15',
    left: cx - 14, top: cy - 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#facc15',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  playerInner: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#f97316',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  overlayBig: { color: '#facc15', fontSize: 32, fontWeight: '900' },
  overlayHint: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
