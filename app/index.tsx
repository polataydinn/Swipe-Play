import React, { useState, useCallback } from 'react';
import GameFeed from '../src/components/GameFeed';
import GameListScreen from '../src/components/GameListScreen';

export default function HomeScreen() {
  const [screen, setScreen] = useState('list'); // 'list' | 'feed'
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [feedKey, setFeedKey] = useState(0);

  const handleSelectGame = useCallback((gameId) => {
    setSelectedGameId(gameId);
    setFeedKey((k) => k + 1); // force new GameFeed instance
    setScreen('feed');
  }, []);

  const handleBack = useCallback(() => {
    setScreen('list');
  }, []);

  if (screen === 'list') {
    return <GameListScreen onSelectGame={handleSelectGame} />;
  }

  return (
    <GameFeed
      key={feedKey}
      startGameId={selectedGameId}
      onBack={handleBack}
    />
  );
}
