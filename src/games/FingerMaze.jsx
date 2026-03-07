import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { COLORS } from '../constants/colors';

const { width: SW } = Dimensions.get('window');
const MAZE_SIZE = SW - 60;
const WALL_THICKNESS = 3;
const PLAYER_RADIUS = 10;

const DIFFICULTY_CONFIG = {
  0: { gridSize: 5, wallCount: 6 },
  1: { gridSize: 6, wallCount: 10 },
  2: { gridSize: 7, wallCount: 16 },
};

function generateMaze(gridSize, wallCount) {
  const cellSize = MAZE_SIZE / gridSize;
  const walls = [];

  // Border walls with gaps at start (top-left) and end (bottom-right)
  const gapSize = cellSize * 1.2;

  // Top border — gap at left for start
  walls.push({ x: gapSize, y: 0, w: MAZE_SIZE - gapSize, h: WALL_THICKNESS });
  // Bottom border — gap at right for end
  walls.push({ x: 0, y: MAZE_SIZE - WALL_THICKNESS, w: MAZE_SIZE - gapSize, h: WALL_THICKNESS });
  // Left border — gap at top for start
  walls.push({ x: 0, y: gapSize, w: WALL_THICKNESS, h: MAZE_SIZE - gapSize });
  // Right border — gap at bottom for end
  walls.push({ x: MAZE_SIZE - WALL_THICKNESS, y: 0, w: WALL_THICKNESS, h: MAZE_SIZE - gapSize });

  // Safe zones: no walls near start or end
  const safeRadius = cellSize * 1.5;
  const startCenter = { x: cellSize * 0.8, y: cellSize * 0.8 };
  const endCenter = { x: MAZE_SIZE - cellSize * 0.8, y: MAZE_SIZE - cellSize * 0.8 };

  const isInSafeZone = (wx, wy, ww, wh) => {
    // Check if wall rect overlaps with safe circles
    const wallCx = wx + ww / 2;
    const wallCy = wy + wh / 2;
    const distStart = Math.sqrt((wallCx - startCenter.x) ** 2 + (wallCy - startCenter.y) ** 2);
    const distEnd = Math.sqrt((wallCx - endCenter.x) ** 2 + (wallCy - endCenter.y) ** 2);
    return distStart < safeRadius || distEnd < safeRadius;
  };

  // Internal walls — avoid start/end zones
  const usedPositions = new Set();
  let attempts = 0;
  let placed = 0;

  while (placed < wallCount && attempts < wallCount * 5) {
    attempts++;
    const isHorizontal = Math.random() > 0.5;
    const gx = Math.floor(Math.random() * (gridSize - 2)) + 1;
    const gy = Math.floor(Math.random() * (gridSize - 2)) + 1;
    const key = `${gx}-${gy}-${isHorizontal}`;
    if (usedPositions.has(key)) continue;

    let wx, wy, ww, wh;
    if (isHorizontal) {
      ww = cellSize * (1 + Math.floor(Math.random() * 1.5));
      wh = WALL_THICKNESS;
      wx = gx * cellSize;
      wy = gy * cellSize;
    } else {
      ww = WALL_THICKNESS;
      wh = cellSize * (1 + Math.floor(Math.random() * 1.5));
      wx = gx * cellSize;
      wy = gy * cellSize;
    }

    // Keep walls inside maze
    if (wx + ww > MAZE_SIZE - WALL_THICKNESS) ww = MAZE_SIZE - WALL_THICKNESS - wx;
    if (wy + wh > MAZE_SIZE - WALL_THICKNESS) wh = MAZE_SIZE - WALL_THICKNESS - wy;
    if (wx < WALL_THICKNESS) { ww -= (WALL_THICKNESS - wx); wx = WALL_THICKNESS; }
    if (wy < WALL_THICKNESS) { wh -= (WALL_THICKNESS - wy); wy = WALL_THICKNESS; }

    if (ww <= 0 || wh <= 0) continue;
    if (isInSafeZone(wx, wy, ww, wh)) continue;

    usedPositions.add(key);
    walls.push({ x: wx, y: wy, w: ww, h: wh });
    placed++;
  }

  return walls;
}

export default function FingerMaze({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const cellSize = MAZE_SIZE / config.gridSize;
  const [walls, setWalls] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [round, setRound] = useState(0);

  // Start/end positions away from corners, inside safe zone
  const sp = { x: cellSize * 0.8, y: cellSize * 0.8 };
  const ep = { x: MAZE_SIZE - cellSize * 0.8, y: MAZE_SIZE - cellSize * 0.8 };

  const playerX = useSharedValue(sp.x);
  const playerY = useSharedValue(sp.y);

  const wallsRef = useRef([]);
  const completedRef = useRef(false);
  const playingRef = useRef(false);
  const mazeRef = useRef(null);
  const layoutRef = useRef({ x: 0, y: 0 });

  const initMaze = useCallback(() => {
    const newWalls = generateMaze(config.gridSize, config.wallCount);
    wallsRef.current = newWalls;
    setWalls(newWalls);
    playerX.value = sp.x;
    playerY.value = sp.y;
    setPlaying(false);
    playingRef.current = false;
    setCompleted(false);
    completedRef.current = false;
    if (onUnlockSwipe) onUnlockSwipe();
  }, [config, onUnlockSwipe, sp.x, sp.y]);

  useEffect(() => {
    initMaze();
  }, [difficulty, round]);

  useEffect(() => {
    return () => {
      if (onUnlockSwipe) onUnlockSwipe();
    };
  }, [onUnlockSwipe]);

  const checkWallCollision = (x, y) => {
    const r = PLAYER_RADIUS - 2; // Slightly smaller hitbox for forgiveness
    for (const wall of wallsRef.current) {
      if (
        x + r > wall.x &&
        x - r < wall.x + wall.w &&
        y + r > wall.y &&
        y - r < wall.y + wall.h
      ) {
        return true;
      }
    }
    return false;
  };

  const checkFinish = (x, y) => {
    const dist = Math.sqrt((x - ep.x) ** 2 + (y - ep.y) ** 2);
    return dist < cellSize * 0.6;
  };

  const handleStartPlay = () => {
    if (completedRef.current) return;
    // Re-measure layout right before playing
    measureLayout();
    setPlaying(true);
    playingRef.current = true;
    if (onLockSwipe) onLockSwipe();
  };

  const resetPlayer = () => {
    playerX.value = sp.x;
    playerY.value = sp.y;
    setPlaying(false);
    playingRef.current = false;
    if (onUnlockSwipe) onUnlockSwipe();
  };

  const handleTouchMove = (evt) => {
    if (!playingRef.current || completedRef.current) return;
    const { pageX, pageY } = evt.nativeEvent;
    const lx = layoutRef.current.x;
    const ly = layoutRef.current.y;
    const nx = Math.max(PLAYER_RADIUS, Math.min(MAZE_SIZE - PLAYER_RADIUS, pageX - lx));
    const ny = Math.max(PLAYER_RADIUS, Math.min(MAZE_SIZE - PLAYER_RADIUS, pageY - ly));

    playerX.value = nx;
    playerY.value = ny;

    if (checkWallCollision(nx, ny)) {
      onWrong();
      resetPlayer();
    } else if (checkFinish(nx, ny)) {
      if (!completedRef.current) {
        completedRef.current = true;
        setCompleted(true);
        setPlaying(false);
        playingRef.current = false;
        onCorrect();
        if (onUnlockSwipe) onUnlockSwipe();
        setTimeout(() => setRound((r) => r + 1), 1000);
      }
    }
  };

  const handleTouchEnd = () => {
    if (playingRef.current && !completedRef.current) {
      resetPlayer();
    }
  };

  const measureLayout = () => {
    if (mazeRef.current) {
      mazeRef.current.measureInWindow((x, y) => {
        layoutRef.current = { x, y };
      });
    }
  };

  const playerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: playerX.value - PLAYER_RADIUS },
      { translateY: playerY.value - PLAYER_RADIUS },
    ],
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        {completed
          ? '✅ Tamamlandı!'
          : playing
          ? '🔴 Duvarlara dokunma!'
          : 'START\'a bas, parmağını S → F sürükle'}
      </Text>

      <View
        ref={mazeRef}
        style={[styles.maze, { width: MAZE_SIZE, height: MAZE_SIZE }]}
        onLayout={measureLayout}
        onTouchMove={playing ? handleTouchMove : undefined}
        onTouchEnd={playing ? handleTouchEnd : undefined}
        onTouchCancel={playing ? handleTouchEnd : undefined}
      >
        {walls.map((wall, i) => (
          <View
            key={i}
            style={[styles.wall, { left: wall.x, top: wall.y, width: wall.w, height: wall.h }]}
          />
        ))}

        {/* Start zone - green circle */}
        <View style={[styles.zone, styles.startZone, {
          left: sp.x - cellSize * 0.5,
          top: sp.y - cellSize * 0.5,
          width: cellSize,
          height: cellSize,
          borderRadius: cellSize / 2,
        }]}>
          <Text style={styles.zoneText}>S</Text>
        </View>

        {/* End zone - blue circle */}
        <View style={[styles.zone, styles.endZone, {
          left: ep.x - cellSize * 0.5,
          top: ep.y - cellSize * 0.5,
          width: cellSize,
          height: cellSize,
          borderRadius: cellSize / 2,
        }]}>
          <Text style={styles.zoneText}>F</Text>
        </View>

        {/* Player */}
        <Animated.View style={[styles.player, playerStyle]} />

        {/* Start overlay */}
        {!playing && !completed && (
          <TouchableOpacity
            style={styles.startOverlay}
            onPress={handleStartPlay}
            activeOpacity={0.8}
          >
            <View style={styles.startButton}>
              <Text style={styles.startButtonText}>▶ START</Text>
            </View>
            <Text style={styles.overlayHint}>Parmağını S'den F'ye sürükle</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.round}>Tur: {round + 1}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  instruction: { color: COLORS.textSecondary, fontSize: 15, marginBottom: 12, textAlign: 'center' },
  maze: { backgroundColor: COLORS.surface, borderRadius: 8, position: 'relative', overflow: 'hidden' },
  wall: { position: 'absolute', backgroundColor: '#e74c3c' },
  zone: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  startZone: { backgroundColor: 'rgba(46, 204, 113, 0.25)', borderWidth: 2, borderColor: '#2ecc71' },
  endZone: { backgroundColor: 'rgba(52, 152, 219, 0.25)', borderWidth: 2, borderColor: '#3498db' },
  zoneText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  player: {
    position: 'absolute',
    width: PLAYER_RADIUS * 2, height: PLAYER_RADIUS * 2,
    borderRadius: PLAYER_RADIUS,
    backgroundColor: '#f39c12',
    zIndex: 10,
    shadowColor: '#f39c12',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  startButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 16,
  },
  startButtonText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  overlayHint: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 12 },
  round: { color: COLORS.textMuted, fontSize: 13, marginTop: 10 },
});
