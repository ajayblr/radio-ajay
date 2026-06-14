import { useState, useCallback } from 'react';

const KEY = 'radio_favorite_country';

export function getFavoriteCountry(): string | null {
  try {
    return localStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}

export function useFavoriteCountry() {
  const [favoriteCountry, setFavoriteCountry] = useState<string | null>(getFavoriteCountry);

  const toggle = useCallback((country: string) => {
    setFavoriteCountry((prev) => {
      const next = prev === country ? null : country;
      try {
        if (next) localStorage.setItem(KEY, next);
        else localStorage.removeItem(KEY);
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { favoriteCountry, toggle };
}
