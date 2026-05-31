import { useState, useCallback } from 'react';
import type { Station } from '../types';

const KEY = 'radio_recent';
const MAX = 20;

function load(): Station[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function useRecent() {
  const [recent, setRecent] = useState<Station[]>(load);

  const addRecent = useCallback((station: Station) => {
    setRecent((prev) => {
      const filtered = prev.filter((s) => s.stationuuid !== station.stationuuid);
      const next = [station, ...filtered].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { recent, addRecent };
}
