import { useCallback } from 'react';

// Ads disabled for now
export function useAdManager() {
  const onVerticalSwipe = useCallback(() => {
    return false;
  }, []);

  return { onVerticalSwipe };
}
