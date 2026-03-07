import { useSharedValue } from 'react-native-reanimated';

export function useSwipe(gameCount) {
  const currentGameIndex = useSharedValue(0);
  const currentDifficulty = useSharedValue(1); // Start at Medium (index 1)
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);

  return {
    currentGameIndex,
    currentDifficulty,
    translateY,
    translateX,
  };
}
