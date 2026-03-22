import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated,
} from 'react-native';
import { playTap, playCorrect, playWrong } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
  0: { baseSpawnMs: 4000, baseValue: 2 },
  1: { baseSpawnMs: 3000, baseValue: 3 },
  2: { baseSpawnMs: 2500, baseValue: 5 },
};

const UPGRADES = {
  speed: { baseCost: 30,  costMult: 2.2, maxLevel: 8, label: 'Hız',   icon: '⚡' },
  value: { baseCost: 50,  costMult: 2.5, maxLevel: 8, label: 'Değer', icon: '💎' },
};

const GOLDEN_BASE_COST = 400;
const MAX_VISIBLE_EGGS = 30;
const POLL_MS = 150;

let _id = 0;
const uid = () => ++_id;

export default function EggFarm({ difficulty, onCorrect, onWrong, onLockSwipe, onUnlockSwipe }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[0];

  const [phase, setPhase] = useState('ready');
  const [money, setMoney] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [eggs, setEggs] = useState([]);
  const [chickens, setChickens] = useState(1);
  const [speedLvl, setSpeedLvl] = useState(0);
  const [valueLvl, setValueLvl] = useState(0);
  const [goldenUnlocked, setGoldenUnlocked] = useState(false);
  const [sellFlash, setSellFlash] = useState(false);

  const stRef = useRef({
    money: 0, totalEarned: 0, eggs: [],
    chickens: 1, speedLvl: 0, valueLvl: 0, golden: false, phase: 'ready',
  });
  const chickenTimersRef = useRef([]); // last spawn time per chicken
  const loopRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (onUnlockSwipe) onUnlockSwipe();
      clearInterval(loopRef.current);
    };
  }, []);

  const getSpawnMs = useCallback(() => {
    const lvl = stRef.current.speedLvl;
    return Math.max(400, cfg.baseSpawnMs * Math.pow(0.78, lvl));
  }, [cfg]);

  const getEggValue = useCallback(() => {
    const lvl = stRef.current.valueLvl;
    const base = stRef.current.golden ? cfg.baseValue * 10 : cfg.baseValue;
    return Math.round(base * Math.pow(1.6, lvl));
  }, [cfg]);

  const spawnEgg = useCallback(() => {
    if (!mountedRef.current) return;
    setEggs(prev => {
      if (prev.length >= MAX_VISIBLE_EGGS) return prev;
      const x = 12 + Math.random() * (SW - 88);
      const y = Math.random() * 80;
      const anim = new Animated.Value(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 7 }).start();
      const newEgg = { id: uid(), x, y, anim, golden: stRef.current.golden };
      stRef.current.eggs = [...prev, newEgg];
      return [...prev, newEgg];
    });
  }, []);

  const startLoop = useCallback((spawnMs, chickenCount) => {
    clearInterval(loopRef.current);
    const now = Date.now();
    // Stagger chicken timers so they don't all spawn at once
    chickenTimersRef.current = Array.from({ length: chickenCount }, (_, i) => ({
      last: now - spawnMs + (i * spawnMs / chickenCount),
    }));

    loopRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      const s = stRef.current;
      if (s.phase !== 'play') return;
      const ms = getSpawnMs();
      const t = Date.now();
      const timers = chickenTimersRef.current;
      // Ensure timer array matches chicken count
      while (timers.length < s.chickens) {
        timers.push({ last: t - ms + (timers.length * ms / s.chickens) });
      }
      for (let i = 0; i < s.chickens; i++) {
        if (t - timers[i].last >= ms) {
          timers[i].last = t;
          spawnEgg();
        }
      }
    }, POLL_MS);
  }, [getSpawnMs, spawnEgg]);

  const stopGame = () => {
    clearInterval(loopRef.current);
    stRef.current.phase = 'end';
    setPhase('end');
    if (onUnlockSwipe) onUnlockSwipe();
    playCorrect();
    setTimeout(() => onCorrect(), 800);
  };

  const startGame = () => {
    if (onLockSwipe) onLockSwipe();
    clearInterval(loopRef.current);
    stRef.current = {
      money: 0, totalEarned: 0, eggs: [],
      chickens: 1, speedLvl: 0, valueLvl: 0, golden: false, phase: 'play',
    };
    setMoney(0); setTotalEarned(0); setEggs([]); setChickens(1);
    setSpeedLvl(0); setValueLvl(0); setGoldenUnlocked(false); setSellFlash(false);
    setPhase('play');
    const ms = cfg.baseSpawnMs;
    startLoop(ms, 1);
    spawnEgg();
  };

  const sellAll = () => {
    const count = stRef.current.eggs.length;
    if (count === 0) return;
    playCorrect();
    const earned = count * getEggValue();
    stRef.current.money += earned;
    stRef.current.totalEarned += earned;
    stRef.current.eggs = [];
    setMoney(stRef.current.money);
    setTotalEarned(stRef.current.totalEarned);
    setEggs([]);
    setSellFlash(true);
    setTimeout(() => setSellFlash(false), 300);
  };

  const tapEgg = (id) => {
    playTap();
    const val = getEggValue();
    stRef.current.money += val;
    stRef.current.totalEarned += val;
    stRef.current.eggs = stRef.current.eggs.filter(e => e.id !== id);
    setMoney(stRef.current.money);
    setTotalEarned(stRef.current.totalEarned);
    setEggs(prev => prev.filter(e => e.id !== id));
  };

  const buyChicken = () => {
    const count = stRef.current.chickens;
    const cost = Math.round(20 * Math.pow(1.9, count - 1));
    if (stRef.current.money < cost) { playWrong(); return; }
    playTap();
    stRef.current.money -= cost;
    stRef.current.chickens += 1;
    setMoney(stRef.current.money);
    setChickens(stRef.current.chickens);
    // Add new chicken to timer list immediately (staggered)
    const ms = getSpawnMs();
    chickenTimersRef.current.push({ last: Date.now() - ms * 0.5 });
  };

  const buySpeedUpgrade = () => {
    const lvl = stRef.current.speedLvl;
    if (lvl >= UPGRADES.speed.maxLevel) return;
    const cost = Math.round(UPGRADES.speed.baseCost * Math.pow(UPGRADES.speed.costMult, lvl));
    if (stRef.current.money < cost) { playWrong(); return; }
    playTap();
    stRef.current.money -= cost;
    stRef.current.speedLvl += 1;
    setMoney(stRef.current.money);
    setSpeedLvl(stRef.current.speedLvl);
    // Restart loop with new speed
    startLoop(getSpawnMs(), stRef.current.chickens);
  };

  const buyValueUpgrade = () => {
    const lvl = stRef.current.valueLvl;
    if (lvl >= UPGRADES.value.maxLevel) return;
    const cost = Math.round(UPGRADES.value.baseCost * Math.pow(UPGRADES.value.costMult, lvl));
    if (stRef.current.money < cost) { playWrong(); return; }
    playTap();
    stRef.current.money -= cost;
    stRef.current.valueLvl += 1;
    setMoney(stRef.current.money);
    setValueLvl(stRef.current.valueLvl);
  };

  const buyGoldenChicken = () => {
    const cost = Math.round(GOLDEN_BASE_COST * Math.pow(1.8, stRef.current.chickens - 1));
    if (stRef.current.golden || stRef.current.money < cost) { playWrong(); return; }
    playCorrect();
    stRef.current.money -= cost;
    stRef.current.golden = true;
    stRef.current.eggs = stRef.current.eggs.map(e => ({ ...e, golden: true }));
    setMoney(stRef.current.money);
    setGoldenUnlocked(true);
    setEggs(prev => prev.map(e => ({ ...e, golden: true })));
  };

  const chickenCount = chickens;
  const chickenCost  = Math.round(20 * Math.pow(1.9, chickenCount - 1));
  const speedCost    = speedLvl < UPGRADES.speed.maxLevel
    ? Math.round(UPGRADES.speed.baseCost * Math.pow(UPGRADES.speed.costMult, speedLvl)) : null;
  const valueCost    = valueLvl < UPGRADES.value.maxLevel
    ? Math.round(UPGRADES.value.baseCost * Math.pow(UPGRADES.value.costMult, valueLvl)) : null;
  const goldenCost   = Math.round(GOLDEN_BASE_COST * Math.pow(1.8, chickenCount - 1));

  return (
    <View style={styles.outer}>
      {phase === 'ready' && (
        <View style={styles.centerBox}>
          <Text style={styles.bigTitle}>🐔 Yumurta Çiftliği</Text>
          <Text style={styles.desc}>
            Tavuklar yumurta yapar, sen toplarsın!{'\n'}
            Daha fazla tavuk al, hız ve değeri yükselt.{'\n'}
            Sonsuza kadar büyü!
          </Text>
          <TouchableOpacity style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startTxt}>BAŞLA</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'end' && (
        <View style={styles.centerBox}>
          <Text style={styles.bigTitle}>🏆 Harika!</Text>
          <Text style={styles.desc}>Çiftlik hedefine ulaştın!</Text>
          <Text style={styles.moneyBig}>💰 {stRef.current.totalEarned}</Text>
          <TouchableOpacity style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startTxt}>TEKRAR</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'play' && (
        <View style={styles.playArea}>
          {/* HUD */}
          <View style={styles.hudRow}>
            <View style={styles.hudChip}>
              <Text style={styles.hudLabel}>💰</Text>
              <Text style={styles.hudVal}>{money}</Text>
            </View>
            <View style={styles.hudChip}>
              <Text style={styles.hudLabel}>🐔</Text>
              <Text style={styles.hudVal}>{chickens}</Text>
            </View>
            <View style={styles.hudChip}>
              <Text style={styles.hudLabel}>🥚</Text>
              <Text style={styles.hudVal}>{eggs.length}</Text>
            </View>
            <TouchableOpacity style={styles.stopBtn} onPress={stopGame}>
              <Text style={styles.stopTxt}>■ DUR</Text>
            </TouchableOpacity>
          </View>

          {/* Farm field */}
          <View style={styles.field}>
            {/* Chicken row */}
            <View style={styles.chickenRow}>
              {Array.from({ length: Math.min(chickens, 10) }).map((_, i) => (
                <Text key={i} style={styles.chickenEmoji}>
                  {goldenUnlocked ? '✨' : '🐔'}
                </Text>
              ))}
              {chickens > 10 && (
                <Text style={styles.chickenMore}>+{chickens - 10}</Text>
              )}
            </View>

            {/* Eggs */}
            {eggs.map(egg => (
              <Animated.View
                key={egg.id}
                style={[
                  styles.eggWrapper,
                  {
                    left: egg.x,
                    top: 72 + egg.y,
                    transform: [{
                      scale: egg.anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
                    }],
                  },
                ]}
              >
                <TouchableOpacity onPress={() => tapEgg(egg.id)} style={styles.eggBtn}>
                  <Text style={styles.eggEmoji}>{egg.golden ? '✨' : '🥚'}</Text>
                  <Text style={styles.eggVal}>+{getEggValue()}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Sell button */}
          <TouchableOpacity
            style={[styles.sellBtn, sellFlash && styles.sellFlash]}
            onPress={sellAll}
            activeOpacity={0.7}
          >
            <Text style={styles.sellTxt}>HEPSİNİ SAT  💰 +{eggs.length * getEggValue()}</Text>
          </TouchableOpacity>

          {/* Upgrades */}
          <View style={styles.upgradesPanel}>
            <UpBtn icon="🐔" label="Tavuk" sub={`${chickenCount} adet`} cost={chickenCost} money={money} onPress={buyChicken} />
            <UpBtn icon="⚡" label="Hız" sub={`Lv${speedLvl}`} cost={speedCost} money={money} onPress={buySpeedUpgrade} maxed={!speedCost} />
            <UpBtn icon="💎" label="Değer" sub={`Lv${valueLvl}`} cost={valueCost} money={money} onPress={buyValueUpgrade} maxed={!valueCost} />
            {!goldenUnlocked ? (
              <UpBtn icon="🌟" label="Altın" sub="×10" cost={goldenCost} money={money} onPress={buyGoldenChicken} special />
            ) : (
              <View style={styles.goldenBadge}>
                <Text style={styles.goldenBadgeTxt}>✨{'\n'}ALTIN</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function UpBtn({ icon, label, sub, cost, money, onPress, special, maxed }) {
  const canAfford = !maxed && cost != null && money >= cost;
  return (
    <TouchableOpacity
      style={[
        styles.upBtn,
        canAfford && styles.upBtnAfford,
        special && styles.upBtnSpecial,
        maxed && styles.upBtnMaxed,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.upIcon}>{icon}</Text>
      <Text style={styles.upLabel}>{label}</Text>
      {sub ? <Text style={styles.upSub}>{sub}</Text> : null}
      {maxed
        ? <Text style={styles.upCost}>MAX</Text>
        : <Text style={[styles.upCost, !canAfford && styles.upCostNo]}>💰{cost}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#0d1117', borderRadius: 20, margin: 8, overflow: 'hidden' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  bigTitle: { color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  desc: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  startBtn: { backgroundColor: '#f59e0b', borderRadius: 16, paddingHorizontal: 40, paddingVertical: 14 },
  startTxt: { color: '#000', fontWeight: '900', fontSize: 18 },
  moneyBig: { color: '#f59e0b', fontSize: 40, fontWeight: '900', marginVertical: 10 },

  playArea: { flex: 1, flexDirection: 'column' },

  hudRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6,
  },
  hudChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a2e', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 6, gap: 6,
  },
  hudLabel: { fontSize: 16 },
  hudVal: { color: '#fff', fontWeight: '800', fontSize: 16 },

  stopBtn: {
    backgroundColor: '#7f1d1d', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#ef4444',
  },
  stopTxt: { color: '#fca5a5', fontWeight: '900', fontSize: 12 },

  field: {
    flex: 1, marginHorizontal: 8,
    backgroundColor: '#111827', borderRadius: 16,
    position: 'relative', overflow: 'hidden',
  },
  chickenRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 10, paddingTop: 8, gap: 4,
  },
  chickenEmoji: { fontSize: 22 },
  chickenMore: { color: '#fbbf24', fontWeight: '900', fontSize: 14, alignSelf: 'center' },

  eggWrapper: { position: 'absolute', alignItems: 'center' },
  eggBtn: { alignItems: 'center', padding: 4 },
  eggEmoji: { fontSize: 30 },
  eggVal: { color: '#fbbf24', fontSize: 10, fontWeight: '700', marginTop: -2 },

  sellBtn: {
    marginHorizontal: 16, marginVertical: 8,
    backgroundColor: '#16a34a', borderRadius: 18, paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
  sellFlash: { backgroundColor: '#4ade80' },
  sellTxt: { color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },

  upgradesPanel: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 8,
    paddingHorizontal: 12, paddingBottom: 12,
  },
  upBtn: {
    backgroundColor: '#1e2235', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 8,
    alignItems: 'center', minWidth: 72,
    borderWidth: 1, borderColor: '#2d3748',
  },
  upBtnAfford: { borderColor: '#3b82f6' },
  upBtnSpecial: { borderColor: '#f59e0b', backgroundColor: '#1c1606' },
  upBtnMaxed: { borderColor: '#22c55e', opacity: 0.6 },
  upIcon: { fontSize: 20, marginBottom: 2 },
  upLabel: { color: '#e2e8f0', fontSize: 11, fontWeight: '700' },
  upSub: { color: '#60a5fa', fontSize: 10 },
  upCost: { color: '#fbbf24', fontSize: 11, fontWeight: '700', marginTop: 2 },
  upCostNo: { color: '#6b7280' },
  goldenBadge: {
    backgroundColor: '#78350f', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#f59e0b', minWidth: 72,
  },
  goldenBadgeTxt: { color: '#fbbf24', fontWeight: '900', fontSize: 12, textAlign: 'center' },
});
