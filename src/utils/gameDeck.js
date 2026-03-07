import { GAME_DESCRIPTIONS } from '../constants/gameDescriptions';

// Fisher-Yates shuffle
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createGameDeck(startGameId) {
  let ordered;
  if (startGameId) {
    // Put the selected game first, shuffle the rest
    const selected = GAME_DESCRIPTIONS.find((g) => g.id === startGameId);
    const rest = shuffle(GAME_DESCRIPTIONS.filter((g) => g.id !== startGameId));
    ordered = selected ? [selected, ...rest] : shuffle(GAME_DESCRIPTIONS);
  } else {
    ordered = shuffle(GAME_DESCRIPTIONS);
  }
  return ordered.map((game, index) => ({
    ...game,
    index,
    difficulties: [0, 1, 2], // 0=Easy, 1=Medium, 2=Hard
  }));
}

export function getScoreForDifficulty(difficulty) {
  switch (difficulty) {
    case 0:
      return 10;
    case 1:
      return 20;
    case 2:
      return 35;
    default:
      return 10;
  }
}
