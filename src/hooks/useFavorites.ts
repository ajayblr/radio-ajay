import { useState, useCallback } from 'react';
import type { Station } from '../types';

const KEY = 'radio_favorites';

function load(): Station[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Station[]>(load);

  const toggle = useCallback((station: Station) => {
    setFavorites((prev) => {
      const exists = prev.some((s) => s.stationuuid === station.stationuuid);
      const next = exists
        ? prev.filter((s) => s.stationuuid !== station.stationuuid)
        : [station, ...prev];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((s) => s.stationuuid === id),
    [favorites]
  );

  return { favorites, toggle, isFavorite };
}
