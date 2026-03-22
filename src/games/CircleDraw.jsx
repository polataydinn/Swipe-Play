import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder, TouchableOpacity } from 'react-native';
import {
  Canvas, Path, Circle, Skia, BlurMask, SweepGradient, vec,
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';

const { width: SW } = Dimensions.get('window');
const CS = Math.min(SW - 48, 310); // canvas size
const CX = CS / 2;
const CY = CS / 2;
const GUIDE_R = CS * 0.34;

// Precompute guide ring dots
const GUIDE_DOTS = Array.from({ length: 40 }, (_, i) => {
  const a = (i / 40) * Math.PI * 2;
  return { x: CX + Math.cos(a) * GUIDE_R, y: CY + Math.sin(a) * GUIDE_R, show: i % 2 === 0 };
});

function analyze(pts) {
  if (pts.length < 20) return null;
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const radii = pts.map(p => Math.hypot(p.x - cx, p.y - cy));
  const avgR = radii.reduce((s, r) => s + r, 0) / radii.length;
  if (avgR < 18) return null;
  const variance = radii.reduce((s, r) => s + (r - avgR) ** 2, 0) / radii.length;
  const circularity = Math.max(0, 1 - Math.sqrt(variance) / avgR);
  const closeDist = Math.hypot(
    pts[0].x - pts[pts.length - 1].x,
    pts[0].y - pts[pts.length - 1].y,
  );
  const closedness = Math.max(0, 1 - closeDist / (avgR * 1.4));
  const score = Math.min(100, Math.round((circularity * 0.72 + closedness * 0.28) * 100));
  return { score, cx, cy, r: avgR };
}

const SCORE_LEVELS = [
  { min: 95, color: '#fbbf24', msg: 'Mükemmel! ✨', sub: 'İnanılmaz hassas bir çizim!' },
  { min: 85, color: '#22c55e', msg: 'Harika! 🎉', sub: 'Neredeyse kusursuz.' },
  { min: 70, color: '#84cc16', msg: 'Çok İyi! 👍', sub: 'Oldukça iyi bir daire.' },
  { min: 50, color: '#f97316', msg: 'Fena Değil!', sub: 'Biraz daha pratik yap.' },
  { min: 0,  color: '#ef4444', msg: 'Tekrar Dene!', sub: 'Yavaş ve dikkatli çiz.' },
];

const getInfo = s => SCORE_LEVELS.find(l => s >= l.min);

export default function CircleDraw({ onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const [phase, setPhase] = useState('ready'); // 'ready' | 'drawing' | 'result'
  const [points, setPoints] = useState([]);
  const [result, setResult] = useState(null);
  const [displayScore, setDisplayScore] = useState(0);
  const ptsRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (onLockSwipe) onLockSwipe();
    return () => {
      if (onUnlockSwipe) onUnlockSwipe();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Build Skia path from points (open)
  const skPath = useMemo(() => {
    if (points.length < 2) return null;
    const p = Skia.Path.Make();
    p.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) p.lineTo(points[i].x, points[i].y);
    return p;
  }, [points]);

  // Closed path for result phase
  const closedPath = useMemo(() => {
    if (points.length < 2 || phase !== 'result') return null;
    const p = Skia.Path.Make();
    p.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) p.lineTo(points[i].x, points[i].y);
    p.close();
    return p;
  }, [points, phase]);

  // Perfect circle dots overlay
  const perfectDots = useMemo(() => {
    if (!result) return [];
    return Array.from({ length: 48 }, (_, i) => {
      if (i % 2 !== 0) return null;
      const a = (i / 48) * Math.PI * 2;
      return { x: result.cx + Math.cos(a) * result.r, y: result.cy + Math.sin(a) * result.r };
    }).filter(Boolean);
  }, [result]);

  const finishDrawing = pts => {
    const res = analyze(pts);
    if (!res) { reset(); return; }
    setResult(res);
    setPhase('result');

    // Animated score counter
    if (timerRef.current) clearInterval(timerRef.current);
    let cur = 0;
    const step = Math.max(1, Math.ceil(res.score / 32));
    timerRef.current = setInterval(() => {
      cur = Math.min(cur + step, res.score);
      setDisplayScore(cur);
      if (cur >= res.score) clearInterval(timerRef.current);
    }, 22);

    // Haptics
    if (res.score >= 85) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (res.score >= 55) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    if (res.score >= 65) onCorrect(); else onWrong();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        ptsRef.current = [{ x, y }];
        setPhase('drawing');
        setPoints([{ x, y }]);
      },
      onPanResponderMove: e => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        const prev = ptsRef.current;
        if (prev.length > 0 && Math.hypot(x - prev[prev.length - 1].x, y - prev[prev.length - 1].y) < 4) return;
        ptsRef.current = [...prev, { x, y }];
        setPoints(ptsRef.current);
      },
      onPanResponderRelease: () => {
        finishDrawing(ptsRef.current);
      },
    })
  ).current;

  const reset = () => {
    ptsRef.current = [];
    setPhase('ready');
    setPoints([]);
    setResult(null);
    setDisplayScore(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const info = result ? getInfo(result.score) : null;
  const renderPath = phase === 'result' ? closedPath : skPath;
  const strokeColor = info?.color ?? '#06b6d4';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yuvarlak Çiz</Text>

      {phase === 'result' && info ? (
        <>
          <Text style={[styles.msg, { color: info.color }]}>{info.msg}</Text>
          <Text style={styles.sub}>{info.sub}</Text>
        </>
      ) : (
        <Text style={styles.hint}>
          {phase === 'ready' ? 'Parmağını kaldırmadan daire çiz' : 'Çizmeye devam et...'}
        </Text>
      )}

      <View
        style={styles.canvasWrap}
        {...(phase !== 'result' ? panResponder.panHandlers : {})}
      >
        <Canvas style={{ width: CS, height: CS }}>

          {/* Guide ring dots */}
          {phase !== 'result' && GUIDE_DOTS.map((d, i) =>
            d.show
              ? <Circle key={i} cx={d.x} cy={d.y} r={2.2} color="rgba(255,255,255,0.14)" />
              : <Circle key={i} cx={d.x} cy={d.y} r={1.2} color="rgba(255,255,255,0.06)" />
          )}

          {/* Outer glow */}
          {renderPath && (
            <Path
              path={renderPath}
              style="stroke"
              strokeWidth={26}
              color={strokeColor + '22'}
              strokeCap="round"
              strokeJoin="round"
            >
              <BlurMask blur={22} style="normal" />
            </Path>
          )}

          {/* Mid glow */}
          {renderPath && (
            <Path
              path={renderPath}
              style="stroke"
              strokeWidth={12}
              color={strokeColor + '66'}
              strokeCap="round"
              strokeJoin="round"
            >
              <BlurMask blur={8} style="normal" />
            </Path>
          )}

          {/* Main stroke — rainbow while drawing, score-color on result */}
          {renderPath && phase !== 'result' && (
            <Path
              path={renderPath}
              style="stroke"
              strokeWidth={5}
              strokeCap="round"
              strokeJoin="round"
            >
              <SweepGradient
                c={vec(CX, CY)}
                colors={['#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#06b6d4']}
              />
            </Path>
          )}
          {renderPath && phase === 'result' && (
            <Path
              path={renderPath}
              style="stroke"
              strokeWidth={5}
              color={strokeColor}
              strokeCap="round"
              strokeJoin="round"
            />
          )}

          {/* White core highlight */}
          {renderPath && (
            <Path
              path={renderPath}
              style="stroke"
              strokeWidth={1.5}
              color="rgba(255,255,255,0.6)"
              strokeCap="round"
              strokeJoin="round"
            />
          )}

          {/* Perfect circle overlay on result */}
          {phase === 'result' && perfectDots.map((d, i) => (
            <Circle key={i} cx={d.x} cy={d.y} r={2} color="rgba(255,255,255,0.28)" />
          ))}

          {/* Center point on result */}
          {phase === 'result' && result && (
            <Circle cx={result.cx} cy={result.cy} r={5} color="rgba(255,255,255,0.55)">
              <BlurMask blur={4} style="normal" />
            </Circle>
          )}

        </Canvas>
      </View>

      {/* Score display */}
      {phase === 'result' && info ? (
        <View style={styles.scoreRow}>
          <View style={[styles.scoreBadge, { borderColor: info.color + '80' }]}>
            <Text style={[styles.scoreNum, { color: info.color }]}>{displayScore}</Text>
            <Text style={[styles.scorePct, { color: info.color + 'aa' }]}>%</Text>
          </View>
          <View style={styles.scoreRight}>
            <Text style={styles.scoreLabel}>Yuvarlak Skoru</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { borderColor: info.color }]}
              onPress={reset}
            >
              <Text style={[styles.retryTxt, { color: info.color }]}>Tekrar Çiz</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        phase === 'ready' && (
          <Text style={styles.subHint}>İpucu: Noktalı rehber çemberi takip et</Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 20,
    margin: 10,
    backgroundColor: COLORS.surface,
  },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '900', marginBottom: 4 },
  hint: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 10 },
  msg: { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  sub: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 10 },
  subHint: { color: COLORS.textMuted, fontSize: 12, marginTop: 10 },
  canvasWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#050a1a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 18,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 2,
  },
  scoreNum: { fontSize: 52, fontWeight: '900', lineHeight: 56 },
  scorePct: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  scoreRight: { alignItems: 'flex-start', gap: 8 },
  scoreLabel: { color: COLORS.textMuted, fontSize: 12 },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  retryTxt: { fontSize: 14, fontWeight: '700' },
});
