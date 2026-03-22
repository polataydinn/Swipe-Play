import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { createGameDeck } from '../utils/gameDeck';
import { GAME_COMPONENTS } from '../utils/gameRegistry';
import { useScore } from '../hooks/useScore';
import { useAdManager } from '../hooks/useAdManager';
import HUD from './HUD';
import DifficultyDots from './DifficultyDots';
import GameCaption from './GameCaption';
import ParticleEffect from './ParticleEffect';
import ScreenShake from './ScreenShake';
import GamePreview from './GamePreview';
import { initSounds, playCorrect, playWrong } from '../utils/sounds';

const { width: SW, height: SH } = Dimensions.get('window');
const SWIPE_Y_THRESHOLD = SH * 0.12;
const SWIPE_X_THRESHOLD = SW * 0.2;
const SNAP_TIMING = { duration: 300, easing: Easing.out(Easing.cubic) };
const RUBBER_FACTOR = 0.25;

export default function GameFeed({ startGameId, onBack }) {
  const insets = useSafeAreaInsets();
  const [gameDeck] = useState(() => createGameDeck(startGameId));
  const [currentGameIdx, setCurrentGameIdx] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState(1);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [swipeLocked, setSwipeLocked] = useState(false);
  const { score, addScore } = useScore();
  const { onVerticalSwipe } = useAdManager();

  useEffect(() => {
    initSounds();
  }, []);

  const dragY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const difficultyShared = useSharedValue(1);

  const lockedAxis = useSharedValue(0);
  const gameIdxSV = useSharedValue(0);
  const diffSV = useSharedValue(1);
  const isAnimating = useSharedValue(false);
  const pendingReset = useSharedValue(0);
  const deckLength = gameDeck.length;
  const isSingleLevelSV = useSharedValue(0);
  // Worklet-side lock: updated synchronously so the gesture worklet sees it immediately
  const swipeLockedSV = useSharedValue(0);

  const handleCorrect = useCallback(() => {
    addScore(currentDifficulty);
    setParticleTrigger((t) => t + 1);
    playCorrect();
  }, [currentDifficulty, addScore]);

  const handleWrong = useCallback(() => {
    setShakeTrigger((t) => t + 1);
    playWrong();
  }, []);

  const onLockSwipe = useCallback(() => {
    swipeLockedSV.value = 1;
    setSwipeLocked(true);
  }, []);

  const onUnlockSwipe = useCallback(() => {
    swipeLockedSV.value = 0;
    setSwipeLocked(false);
  }, []);

  useEffect(() => {
    const dir = pendingReset.value;
    if (dir !== 0) {
      dragY.value = 0;
      pendingReset.value = 0;
      isAnimating.value = false;
    }
  }, [currentGameIdx]);

  useEffect(() => {
    swipeLockedSV.value = 0;
    setSwipeLocked(false);
  }, [currentGameIdx]);

  const commitVertical = useCallback((newIdx) => {
    gameIdxSV.value = newIdx;
    setCurrentGameIdx(newIdx);
    onVerticalSwipe();
  }, [onVerticalSwipe]);

  const commitHorizontal = useCallback((newDiff) => {
    diffSV.value = newDiff;
    difficultyShared.value = newDiff;
    setCurrentDifficulty(newDiff);
  }, []);

  // panGesture: .enabled() handles React-side, swipeLockedSV handles worklet-side (no render delay)
  const panGesture = Gesture.Pan()
    .enabled(!swipeLocked)
    .onStart(() => {
      'worklet';
      if (swipeLockedSV.value) return;
      lockedAxis.value = 0;
    })
    .onUpdate((e) => {
      'worklet';
      if (swipeLockedSV.value) return;
      if (isAnimating.value) return;

      const absX = Math.abs(e.translationX);
      const absY = Math.abs(e.translationY);

      if (lockedAxis.value === 0) {
        if (absX > 10 || absY > 10) {
          lockedAxis.value = absX > absY ? 1 : 2;
        }
        return;
      }

      if (lockedAxis.value === 2) {
        let ty = e.translationY;
        const idx = gameIdxSV.value;
        if (idx === 0 && ty > 0) ty *= RUBBER_FACTOR;
        if (idx >= deckLength - 1 && ty < 0) ty *= RUBBER_FACTOR;
        dragY.value = ty;
      } else {
        if (isSingleLevelSV.value === 1) return;
        let tx = e.translationX;
        const diff = diffSV.value;
        if (diff === 0 && tx > 0) tx *= RUBBER_FACTOR;
        if (diff === 2 && tx < 0) tx *= RUBBER_FACTOR;
        translateX.value = tx;
      }
    })
    .onEnd((e) => {
      'worklet';
      if (swipeLockedSV.value) {
        dragY.value = withTiming(0, SNAP_TIMING);
        translateX.value = withTiming(0, SNAP_TIMING);
        return;
      }
      if (isAnimating.value) return;

      const axis = lockedAxis.value;
      lockedAxis.value = 0;

      if (axis === 2) {
        const idx = gameIdxSV.value;
        if (e.translationY < -SWIPE_Y_THRESHOLD && idx < deckLength - 1) {
          isAnimating.value = true;
          pendingReset.value = 1;
          dragY.value = withTiming(-SH, SNAP_TIMING, () => {
            runOnJS(commitVertical)(idx + 1);
          });
        } else if (e.translationY > SWIPE_Y_THRESHOLD && idx > 0) {
          isAnimating.value = true;
          pendingReset.value = -1;
          dragY.value = withTiming(SH, SNAP_TIMING, () => {
            runOnJS(commitVertical)(idx - 1);
          });
        } else {
          dragY.value = withTiming(0, SNAP_TIMING);
        }
      } else if (axis === 1) {
        if (isSingleLevelSV.value !== 1) {
          const diff = diffSV.value;
          if (e.translationX < -SWIPE_X_THRESHOLD && diff < 2) {
            runOnJS(commitHorizontal)(diff + 1);
          } else if (e.translationX > SWIPE_X_THRESHOLD && diff > 0) {
            runOnJS(commitHorizontal)(diff - 1);
          }
        }
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      } else {
        translateX.value = withTiming(0, SNAP_TIMING);
        dragY.value = withTiming(0, SNAP_TIMING);
      }
    });

  const currentCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
  }));

  const nextCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: SH + dragY.value }],
  }));

  const prevCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -SH + dragY.value }],
  }));

  const currentGame = gameDeck[currentGameIdx];
  const prevGame = currentGameIdx > 0 ? gameDeck[currentGameIdx - 1] : null;
  const nextGame = currentGameIdx < gameDeck.length - 1 ? gameDeck[currentGameIdx + 1] : null;

  const GameComponent = GAME_COMPONENTS[currentGame?.id];
  const isSingleLevel = !!currentGame?.singleLevel;
  useEffect(() => {
    isSingleLevelSV.value = isSingleLevel ? 1 : 0;
  }, [isSingleLevel]);

  if (!currentGame || !GameComponent) return null;

  const cardHeight = SH - insets.top - insets.bottom;

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={[styles.hudContainer, { paddingTop: insets.top + 8 }]}>
        <HUD score={score} difficulty={currentDifficulty} onBack={onBack} singleLevel={isSingleLevel} />
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.feedContainer}>
          {prevGame && (
            <Animated.View style={[styles.card, { height: cardHeight }, prevCardStyle]}>
              <View style={styles.gameArea}>
                <GamePreview game={prevGame} difficulty={currentDifficulty} />
              </View>
              <BottomInfo
                game={prevGame}
                difficultyShared={difficultyShared}
                translateX={translateX}
              />
            </Animated.View>
          )}

          <Animated.View style={[styles.card, { height: cardHeight }, currentCardStyle]}>
            <ScreenShake trigger={shakeTrigger}>
              <View style={styles.gameArea}>
                <GameComponent
                  key={`${currentGame.id}-${currentGameIdx}`}
                  difficulty={currentDifficulty}
                  onCorrect={handleCorrect}
                  onWrong={handleWrong}
                  onLockSwipe={onLockSwipe}
                  onUnlockSwipe={onUnlockSwipe}
                />
              </View>
            </ScreenShake>
            <BottomInfo
              game={currentGame}
              difficultyShared={difficultyShared}
              translateX={translateX}
              singleLevel={isSingleLevel}
            />
          </Animated.View>

          {nextGame && (
            <Animated.View style={[styles.card, { height: cardHeight }, nextCardStyle]}>
              <View style={styles.gameArea}>
                <GamePreview game={nextGame} difficulty={currentDifficulty} />
              </View>
              <BottomInfo
                game={nextGame}
                difficultyShared={difficultyShared}
                translateX={translateX}
              />
            </Animated.View>
          )}
        </Animated.View>
      </GestureDetector>

      <ParticleEffect trigger={particleTrigger} />
    </View>
  );
}

function BottomInfo({ game, difficultyShared, translateX, singleLevel }) {
  return (
    <View style={styles.bottomArea}>
      {!singleLevel && (
        <DifficultyDots
          difficulty={difficultyShared}
          translateX={translateX}
          screenWidth={SW}
        />
      )}
      <GameCaption
        title={game.title}
        shortDesc={game.shortDesc}
        fullDesc={game.fullDesc}
        singleLevel={singleLevel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  hudContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  feedContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SW,
    backgroundColor: COLORS.background,
  },
  gameArea: {
    flex: 1,
    paddingTop: 60,
  },
  bottomArea: {
    paddingBottom: 16,
  },
});
