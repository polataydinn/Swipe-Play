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

/**
 * Generate a maze guaranteed to have a path from top-left to bottom-right.
 *
 * Uses recursive backtracking (iterative stack version) to carve a perfect
 * maze on a grid, then converts the grid wall structure into visual wall
 * rectangles matching the original look.
 */
function generateMaze(gridSize) {
  const cellSize = MAZE_SIZE / gridSize;
  const cols = gridSize;
  const rows = gridSize;

  // Each cell tracks which walls are present (true = wall exists)
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      top: true,
      right: true,
      bottom: true,
      left: true,
      visited: false,
    }))
  );

  const directions = [
    { dr: -1, dc: 0, wall: 'top', opposite: 'bottom' },
    { dr: 0, dc: 1, wall: 'right', opposite: 'left' },
    { dr: 1, dc: 0, wall: 'bottom', opposite: 'top' },
    { dr: 0, dc: -1, wall: 'left', opposite: 'right' },
  ];

  // Shuffle helper
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Iterative backtracking to carve perfect maze
  const stack = [];
  grid[0][0].visited = true;
  stack.push({ r: 0, c: 0 });

  while (stack.length > 0) {
    const { r, c } = stack[stack.length - 1];
    const neighbors = shuffle([...directions]).filter(({ dr, dc }) => {
      const nr = r + dr;
      const nc = c + dc;
      return nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].visited;
    });

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const { dr, dc, wall, opposite } = neighbors[0];
      const nr = r + dr;
      const nc = c + dc;
      grid[r][c][wall] = false;
      grid[nr][nc][opposite] = false;
      grid[nr][nc].visited = true;
      stack.push({ r: nr, c: nc });
    }
  }

  // Open entrance (top of top-left cell) and exit (bottom of bottom-right cell)
  grid[0][0].top = false;
  grid[rows - 1][cols - 1].bottom = false;

  // --- Convert grid walls into visual wall rectangles ---
  const walls = [];

  // Outer border with entrance/exit gaps (same as original)
  const gapSize = cellSize * 1.2;
  walls.push({ x: gapSize, y: 0, w: MAZE_SIZE - gapSize, h: WALL_THICKNESS });
  walls.push({ x: 0, y: MAZE_SIZE - WALL_THICKNESS, w: MAZE_SIZE - gapSize, h: WALL_THICKNESS });
  walls.push({ x: 0, y: gapSize, w: WALL_THICKNESS, h: MAZE_SIZE - gapSize });
  walls.push({ x: MAZE_SIZE - WALL_THICKNESS, y: 0, w: WALL_THICKNESS, h: MAZE_SIZE - gapSize });

  // Internal horizontal walls (bottom edge of each cell, except last row)
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].bottom) {
        const wx = c * cellSize;
        const wy = (r + 1) * cellSize - WALL_THICKNESS / 2;
        walls.push({ x: wx, y: wy, w: cellSize, h: WALL_THICKNESS });
      }
    }
  }

  // Internal vertical walls (right edge of each cell, except last column)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) {
      if (grid[r][c].right) {
        const wx = (c + 1) * cellSize - WALL_THICKNESS / 2;
        const wy = r * cellSize;
        walls.push({ x: wx, y: wy, w: WALL_THICKNESS, h: cellSize });
      }
    }
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
  const sp = { x: cellSize * 0.5, y: cellSize * 0.5 };
  const ep = { x: MAZE_SIZE - cellSize * 0.5, y: MAZE_SIZE - cellSize * 0.5 };

  const playerX = useSharedValue(sp.x);
  const playerY = useSharedValue(sp.y);

  const wallsRef = useRef([]);
  const completedRef = useRef(false);
  const playingRef = useRef(false);
  const mazeRef = useRef(null);
  const layoutRef = useRef({ x: 0, y: 0 });

  const initMaze = useCallback(() => {
    const newWalls = generateMaze(config.gridSize);
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
