import { useEffect, useState } from 'react';

const KEY = 'radio_geo_country';

// Resolves the listener's country from their IP, cached for the tab's
// session so the greeting doesn't refetch on every navigation.
export function useGeoCountry(): string | null {
  const [country, setCountry] = useState<string | null>(() => {
    try { return sessionStorage.getItem(KEY); } catch { return null; }
  });

  useEffect(() => {
    if (country) return;
    let cancelled = false;
    fetch('https://ipapi.co/country_name/')
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((name) => {
        const trimmed = name.trim();
        if (cancelled || !trimmed || trimmed.toLowerCase() === 'undefined') return;
        setCountry(trimmed);
        try { sessionStorage.setItem(KEY, trimmed); } catch { /* ignore */ }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [country]);

  return country;
}
