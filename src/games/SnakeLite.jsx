import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap, playTick } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');
const BOARD_SIZE = SW - 40;
const CELL_COUNT = 15;
const CELL_SIZE = Math.floor(BOARD_SIZE / CELL_COUNT);

const DIFFICULTY_CONFIG = {
  0: { speed: 300 },
  1: { speed: 200 },
  2: { speed: 120 },
};

const DIRS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

function randomPos(snake) {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * CELL_COUNT),
      y: Math.floor(Math.random() * CELL_COUNT),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

export default function SnakeLite({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [snake, setSnake] = useState([{ x: 7, y: 7 }]);
  const [food, setFood] = useState({ x: 3, y: 3 });
  const [dir, setDir] = useState(DIRS.RIGHT);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const dirRef = useRef(dir);
  const foodRef = useRef(food);
  const intervalRef = useRef(null);

  useEffect(() => { dirRef.current = dir; }, [dir]);
  useEffect(() => { foodRef.current = food; }, [food]);

  const resetGame = useCallback(() => {
    const initial = [{ x: 7, y: 7 }];
    const newFood = randomPos(initial);
    setSnake(initial);
    setFood(newFood);
    foodRef.current = newFood;
    setDir(DIRS.RIGHT);
    dirRef.current = DIRS.RIGHT;
    setGameOver(false);
    setScore(0);
  }, []);

  useEffect(() => {
    resetGame();
  }, [difficulty]);

  useEffect(() => {
    if (gameOver) return;
    intervalRef.current = setInterval(() => {
      setSnake((prev) => {
        const head = prev[0];
        const d = dirRef.current;
        const newHead = {
          x: (head.x + d.x + CELL_COUNT) % CELL_COUNT,
          y: (head.y + d.y + CELL_COUNT) % CELL_COUNT,
        };

        // Self collision
        if (prev.some((s) => s.x === newHead.x && s.y === newHead.y)) {
          // Schedule state updates for next tick to avoid setState-during-render
          setTimeout(() => {
            setGameOver(true);
            onWrong();
          }, 0);
          return prev;
        }

        const newSnake = [newHead, ...prev];
        const currentFood = foodRef.current;

        // Check food
        if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
          const nextFood = randomPos(newSnake);
          foodRef.current = nextFood;
          // Schedule state updates for next tick
          setTimeout(() => {
            setFood(nextFood);
            setScore((s) => s + 1);
            onCorrect();
          }, 0);
          return newSnake; // Don't pop — snake grows
        }

        newSnake.pop();
        return newSnake;
      });
    }, config.speed);

    return () => clearInterval(intervalRef.current);
  }, [gameOver, config.speed, onCorrect, onWrong]);

  const changeDir = (newDir) => {
    playTap();
    const cur = dirRef.current;
    // Prevent reverse
    if (cur.x + newDir.x === 0 && cur.y + newDir.y === 0) return;
    setDir(newDir);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.score}>Yem: {score}</Text>
      <View style={[styles.board, { width: CELL_COUNT * CELL_SIZE, height: CELL_COUNT * CELL_SIZE }]}>
        {snake.map((s, i) => (
          <View
            key={i}
            style={[
              styles.cell,
              {
                left: s.x * CELL_SIZE,
                top: s.y * CELL_SIZE,
                backgroundColor: i === 0 ? '#2ecc71' : '#27ae60',
                borderRadius: i === 0 ? 4 : 2,
              },
            ]}
          />
        ))}
        <View
          style={[
            styles.cell,
            { left: food.x * CELL_SIZE, top: food.y * CELL_SIZE, backgroundColor: '#e74c3c', borderRadius: CELL_SIZE / 2 },
          ]}
        />
        {gameOver && (
          <TouchableOpacity style={styles.overlay} onPress={resetGame}>
            <Text style={styles.gameOverText}>Oyun Bitti!</Text>
            <Text style={styles.restartText}>Tekrar başla</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.arrowBtn} onPress={() => changeDir(DIRS.UP)}>
            <Text style={styles.arrow}>▲</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.arrowBtn} onPress={() => changeDir(DIRS.LEFT)}>
            <Text style={styles.arrow}>◀</Text>
          </TouchableOpacity>
          <View style={styles.arrowBtn} />
          <TouchableOpacity style={styles.arrowBtn} onPress={() => changeDir(DIRS.RIGHT)}>
            <Text style={styles.arrow}>▶</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.arrowBtn} onPress={() => changeDir(DIRS.DOWN)}>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  score: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  board: { backgroundColor: COLORS.surface, borderRadius: 8, position: 'relative', overflow: 'hidden' },
  cell: { position: 'absolute', width: CELL_SIZE - 1, height: CELL_SIZE - 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverText: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
  restartText: { color: COLORS.textSecondary, fontSize: 16, marginTop: 8 },
  controls: { marginTop: 20, alignItems: 'center' },
  controlRow: { flexDirection: 'row', justifyContent: 'center' },
  arrowBtn: { width: 60, height: 50, justifyContent: 'center', alignItems: 'center' },
  arrow: { color: COLORS.text, fontSize: 28 },
});
