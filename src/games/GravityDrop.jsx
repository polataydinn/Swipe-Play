import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');
const BUCKET_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];
const AREA_HEIGHT = 320;
const BALL_SIZE = 30;
const BUCKET_HEIGHT = 40;
const FALL_LIMIT = AREA_HEIGHT - BUCKET_HEIGHT - BALL_SIZE;

// Speed in pixels per second for smooth timestamp-based movement
const DIFFICULTY_CONFIG = {
  0: { buckets: 2, speed: 180 },
  1: { buckets: 3, speed: 260 },
  2: { buckets: 4, speed: 380 },
};

export default function GravityDrop({ difficulty, onCorrect, onWrong }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];
  const [ballColor, setBallColor] = useState(0);
  const [ballPos, setBallPos] = useState(0);
  const [ballY, setBallY] = useState(0);
  const [score, setScore] = useState(0);

  const rafRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastTimeRef = useRef(null);
  const ballYRef = useRef(0);
  const ballPosRef = useRef(0);
  const ballColorRef = useRef(0);
  const landedRef = useRef(false);

  const bucketW = Math.floor((SW - 40) / config.buckets);

  const newBall = useCallback(() => {
    const c = Math.floor(Math.random() * config.buckets);
    const p = Math.floor(Math.random() * config.buckets);
    setBallColor(c);
    ballColorRef.current = c;
    setBallPos(p);
    ballPosRef.current = p;
    setBallY(0);
    ballYRef.current = 0;
    lastTimeRef.current = null;
    landedRef.current = false;
  }, [config.buckets]);

  useEffect(() => {
    setScore(0);
    newBall();
  }, [difficulty, newBall]);

  const tick = useCallback((timestamp) => {
    if (!isMountedRef.current) return;
    if (landedRef.current) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    if (lastTimeRef.current === null) {
      lastTimeRef.current = timestamp;
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const delta = (timestamp - lastTimeRef.current) / 1000; // seconds
    lastTimeRef.current = timestamp;

    // Clamp delta to avoid huge jumps if tab was backgrounded
    const clampedDelta = Math.min(delta, 0.1);
    const newY = ballYRef.current + config.speed * clampedDelta;

    if (newY >= FALL_LIMIT) {
      landedRef.current = true;
      ballYRef.current = FALL_LIMIT;
      setBallY(FALL_LIMIT);

      if (ballPosRef.current === ballColorRef.current) {
        onCorrect();
        setScore(s => s + 1);
      } else {
        onWrong();
      }

      setTimeout(() => {
        newBall();
      }, 200);
    } else {
      ballYRef.current = newY;
      setBallY(newY);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [config.speed, newBall, onCorrect, onWrong]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      isMountedRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [tick]);

  const moveLeft = () => {
    playTap();
    setBallPos(p => {
      const next = Math.max(0, p - 1);
      ballPosRef.current = next;
      return next;
    });
  };

  const moveRight = () => {
    playTap();
    setBallPos(p => {
      const next = Math.min(config.buckets - 1, p + 1);
      ballPosRef.current = next;
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.score}>{score}</Text>
      <View style={styles.area}>
        <View
          style={[
            styles.ball,
            {
              left: ballPos * bucketW + bucketW / 2 - BALL_SIZE / 2,
              top: ballY,
              backgroundColor: BUCKET_COLORS[ballColor],
            },
          ]}
        />
        <View style={styles.buckets}>
          {Array.from({ length: config.buckets }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.bucket,
                {
                  width: bucketW - 8,
                  backgroundColor: BUCKET_COLORS[i] + '40',
                  borderColor: BUCKET_COLORS[i],
                },
              ]}
            />
          ))}
        </View>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.ctrlBtn} onPress={moveLeft} activeOpacity={0.7}>
          <Text style={styles.ctrlText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={moveRight} activeOpacity={0.7}>
          <Text style={styles.ctrlText}>{'\u2192'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  score: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  area: {
    width: SW - 40,
    height: AREA_HEIGHT,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
  },
  ball: { position: 'absolute', width: BALL_SIZE, height: BALL_SIZE, borderRadius: BALL_SIZE / 2 },
  buckets: { position: 'absolute', bottom: 0, flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  bucket: { height: BUCKET_HEIGHT, borderRadius: 8, borderWidth: 2, borderTopWidth: 0 },
  controls: { flexDirection: 'row', gap: 20 },
  ctrlBtn: {
    width: 70,
    height: 70,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  ctrlText: { color: COLORS.text, fontSize: 32, fontWeight: '700' },
});
