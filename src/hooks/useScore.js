import { useState, useCallback } from 'react';
import { getScoreForDifficulty } from '../utils/gameDeck';

export function useScore() {
  const [score, setScore] = useState(0);

  const addScore = useCallback((difficulty) => {
    const points = getScoreForDifficulty(difficulty);
    setScore((prev) => prev + points);
    return points;
  }, []);

  const resetScore = useCallback(() => setScore(0), []);

  return { score, addScore, resetScore };
}
